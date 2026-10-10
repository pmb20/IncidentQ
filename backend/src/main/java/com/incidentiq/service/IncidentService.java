package com.incidentiq.service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.HashSet;
import java.util.Comparator;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incidentiq.Model.Incident;
import com.incidentiq.Model.IncidentAudit;
import com.incidentiq.dto.IncidentAnalyticsResponse;
import com.incidentiq.dto.SimilarIncidentResponse;
import com.incidentiq.repository.IncidentAuditRepository;
import com.incidentiq.repository.IncidentRepository;

@Service
public class IncidentService {

    private static final int MIN_SIMILARITY_SCORE = 30;
    private static final int MAX_SIMILAR_INCIDENTS = 5;
    private static final Pattern WORD_SEPARATOR = Pattern.compile("[^\\p{Alnum}]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "from", "this", "that",
            "was", "were", "are", "has", "have", "had", "into",
            "when", "then", "than", "but", "not", "our", "your"
    );

    private final IncidentRepository repository;
    private final IncidentAuditRepository auditRepository;

    public IncidentService(
            IncidentRepository repository,
            IncidentAuditRepository auditRepository) {
        this.repository = repository;
        this.auditRepository = auditRepository;
    }

    public Incident save(Incident incident) {
        return repository.save(incident);
    }

    @Transactional
    public Incident createIncident(Incident incident) {
        Incident created = repository.save(incident);
        recordAudit(created.getId(), "CREATED", null, created.getTitle());
        return created;
    }

    public List<Incident> getAll() {
        return repository.findAll();
    }

    public IncidentAnalyticsResponse getAnalytics() {
        Map<String, Long> statusCounts =
                toCounts(repository.countIncidentsByStatus());
        Map<String, Long> priorityCounts =
                toCounts(repository.countIncidentsByPriority());
        Map<String, Long> severityCounts =
                toCounts(repository.countIncidentsBySeverity());

        return new IncidentAnalyticsResponse(
                repository.count(),
                statusCounts.getOrDefault("OPEN", 0L),
                statusCounts.getOrDefault("IN_PROGRESS", 0L),
                statusCounts.getOrDefault("RESOLVED", 0L),
                severityCounts.getOrDefault("CRITICAL", 0L),
                statusCounts,
                priorityCounts,
                severityCounts
        );
    }

    public Incident getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public List<SimilarIncidentResponse> findSimilarIncidents(Long incidentId) {
        Incident current = getById(incidentId);
        if (current == null) {
            return null;
        }

        return repository.findAll().stream()
                .filter(candidate -> !incidentId.equals(candidate.getId()))
                .map(candidate -> new ScoredIncident(
                        candidate,
                        calculateSimilarityScore(current, candidate)
                ))
                .filter(scored -> scored.score() >= MIN_SIMILARITY_SCORE)
                .sorted(Comparator.comparingInt(ScoredIncident::score)
                        .reversed()
                        .thenComparing(scored -> scored.incident().getId()))
                .limit(MAX_SIMILAR_INCIDENTS)
                .map(scored -> toSimilarIncidentResponse(
                        scored.incident(),
                        scored.score()
                ))
                .toList();
    }

    private int calculateSimilarityScore(Incident current, Incident candidate) {
        int score = 0;
        score += matches(current.getCategory(), candidate.getCategory()) ? 30 : 0;
        score += matches(current.getPriority(), candidate.getPriority()) ? 20 : 0;
        score += matches(current.getSeverity(), candidate.getSeverity()) ? 20 : 0;
        score += keywordOverlapScore(current.getTitle(), candidate.getTitle());
        score += keywordOverlapScore(
                current.getDescription(),
                candidate.getDescription()
        );
        return score;
    }

    private boolean matches(String first, String second) {
        return first != null &&
                second != null &&
                !first.isBlank() &&
                first.trim().equalsIgnoreCase(second.trim());
    }

    private int keywordOverlapScore(String first, String second) {
        Set<String> firstWords = keywords(first);
        Set<String> secondWords = keywords(second);
        if (firstWords.isEmpty() || secondWords.isEmpty()) {
            return 0;
        }

        Set<String> intersection = new HashSet<>(firstWords);
        intersection.retainAll(secondWords);
        Set<String> union = new HashSet<>(firstWords);
        union.addAll(secondWords);

        return (int) Math.round(15.0 * intersection.size() / union.size());
    }

    private Set<String> keywords(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return WORD_SEPARATOR.splitAsStream(value.toLowerCase(Locale.ROOT))
                .filter(word -> word.length() >= 3)
                .filter(word -> !STOP_WORDS.contains(word))
                .collect(Collectors.toSet());
    }

    private SimilarIncidentResponse toSimilarIncidentResponse(
            Incident incident,
            int similarityScore) {
        return new SimilarIncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getCategory(),
                incident.getPriority(),
                incident.getSeverity(),
                incident.getStatus(),
                similarityScore
        );
    }

    private record ScoredIncident(Incident incident, int score) {
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED."
            );
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED")
                .contains(normalized)) {
            throw new IllegalArgumentException(
                    "Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED."
            );
        }
        return normalized;
    }

    private void validateTransition(String currentStatus, String nextStatus) {
        String current = normalizeStatus(currentStatus);
        if (current.equals(nextStatus)) {
            return;
        }

        boolean allowed = switch (current) {
            case "OPEN" -> Set.of("IN_PROGRESS", "RESOLVED").contains(nextStatus);
            case "IN_PROGRESS" -> "RESOLVED".equals(nextStatus);
            case "RESOLVED" -> "CLOSED".equals(nextStatus);
            case "CLOSED" -> false;
            default -> false;
        };
        if (!allowed) {
            throw new IllegalStateException(
                    "Incident status cannot transition from " +
                            current + " to " + nextStatus + "."
            );
        }
    }

    private void recordIfChanged(
            Long incidentId,
            String action,
            String oldValue,
            String newValue) {
        if (!Objects.equals(oldValue, newValue)) {
            recordAudit(incidentId, action, oldValue, newValue);
        }
    }

    private void recordAudit(
            Long incidentId,
            String action,
            String oldValue,
            String newValue) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();
        String changedBy = authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getName() != null &&
                !authentication.getName().isBlank()
                ? authentication.getName()
                : "system";
        auditRepository.save(new IncidentAudit(
                incidentId,
                action,
                oldValue,
                newValue,
                changedBy,
                Instant.now()
        ));
    }

    @Transactional
    public Incident update(Long id, Incident incident) {

        Incident existing = repository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        String oldStatus = normalizeStatus(existing.getStatus());
        String newStatus = normalizeStatus(incident.getStatus());
        validateTransition(oldStatus, newStatus);

        recordIfChanged(existing.getId(), "STATUS_CHANGED", oldStatus, newStatus);
        recordIfChanged(
                existing.getId(),
                "CATEGORY_CHANGED",
                existing.getCategory(),
                incident.getCategory()
        );
        recordIfChanged(
                existing.getId(),
                "PRIORITY_CHANGED",
                existing.getPriority(),
                incident.getPriority()
        );
        recordIfChanged(
                existing.getId(),
                "SEVERITY_CHANGED",
                existing.getSeverity(),
                incident.getSeverity()
        );
        recordIfChanged(
                existing.getId(),
                "ASSIGNEE_CHANGED",
                existing.getAssignee(),
                incident.getAssignee()
        );

        existing.setTitle(incident.getTitle());
        existing.setDescription(incident.getDescription());
        existing.setCategory(incident.getCategory());
        existing.setPriority(incident.getPriority());
        existing.setSeverity(incident.getSeverity());
        existing.setStatus(newStatus);
        existing.setReporter(incident.getReporter());
        existing.setAssignee(incident.getAssignee());

        return repository.save(existing);
    }

    @Transactional
    public Incident updateStatus(Long id, String requestedStatus) {
        Incident existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        String newStatus = normalizeStatus(requestedStatus);
        String oldStatus = normalizeStatus(existing.getStatus());
        validateTransition(oldStatus, newStatus);
        recordIfChanged(
                existing.getId(),
                "STATUS_CHANGED",
                oldStatus,
                newStatus
        );
        existing.setStatus(newStatus);
        return repository.save(existing);
    }

    @Transactional
    public Incident assignIncident(Long id, String assignee) {
        Incident existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        recordIfChanged(
                existing.getId(),
                "ASSIGNEE_CHANGED",
                existing.getAssignee(),
                assignee
        );
        existing.setAssignee(assignee);
        return repository.save(existing);
    }

    public List<IncidentAudit> getAuditHistory(Long incidentId) {
        if (!repository.existsById(incidentId)) {
            return null;
        }
        return auditRepository.findByIncidentIdOrderByChangedAtDescIdDesc(
                incidentId
        );
    }

    @Transactional
    public Incident updateClassification(
            Long id,
            String category,
            String severity,
            String priority) {
        Incident existing = repository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        recordIfChanged(
                existing.getId(),
                "CATEGORY_CHANGED",
                existing.getCategory(),
                category
        );
        recordIfChanged(
                existing.getId(),
                "SEVERITY_CHANGED",
                existing.getSeverity(),
                severity
        );
        recordIfChanged(
                existing.getId(),
                "PRIORITY_CHANGED",
                existing.getPriority(),
                priority
        );
        existing.setCategory(category);
        existing.setSeverity(severity);
        existing.setPriority(priority);

        return repository.save(existing);
    }

    public List<Incident> search(String title) {
        return repository.findByTitleContainingIgnoreCase(title);
    }

    public List<Incident> getByStatus(String status) {
        return repository.findByStatusIgnoreCase(status);
    }

    public List<Incident> getByPriority(String priority) {
        return repository.findByPriorityIgnoreCase(priority);
    }

    public List<Incident> getBySeverity(String severity) {
        return repository.findBySeverityIgnoreCase(severity);
    }

    public Page<Incident> searchAndFilter(
            String title,
            String status,
            String priority,
            String severity,
            int page,
            int size) {

        if (page < 0) {
            page = 0;
        }

        if (size < 1) {
            size = 10;
        }

        if (size > 100) {
            size = 100;
        }

        title = normalize(title);
        status = normalize(status);
        priority = normalize(priority);
        severity = normalize(severity);

        Pageable pageable = PageRequest.of(page, size);

        return repository.searchAndFilter(
                title,
                status,
                priority,
                severity,
                pageable
        );
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private String normalize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private Map<String, Long> toCounts(List<Object[]> groupedCounts) {
        Map<String, Long> counts = new LinkedHashMap<>();

        for (Object[] groupedCount : groupedCounts) {
            String value = groupedCount[0] == null
                    ? "UNKNOWN"
                    : groupedCount[0].toString()
                            .trim()
                            .toUpperCase(Locale.ROOT);

            if (value.isEmpty()) {
                value = "UNKNOWN";
            }

            long count = ((Number) groupedCount[1]).longValue();
            counts.merge(value, count, Long::sum);
        }

        return counts;
    }
}