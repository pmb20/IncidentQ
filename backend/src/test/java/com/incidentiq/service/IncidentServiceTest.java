package com.incidentiq.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;

import java.time.Instant;
import java.util.Optional;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import com.incidentiq.Model.Incident;
import com.incidentiq.Model.IncidentAudit;
import com.incidentiq.dto.SimilarIncidentResponse;
import com.incidentiq.repository.IncidentAuditRepository;
import com.incidentiq.repository.IncidentRepository;

class IncidentServiceTest {

    private IncidentRepository repository;
    private IncidentAuditRepository auditRepository;
    private IncidentService service;

    @BeforeEach
    void setUp() {
        repository = mock(IncidentRepository.class);
        auditRepository = mock(IncidentAuditRepository.class);
        service = new IncidentService(repository, auditRepository);
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updatesOnlyClassificationFields() {
        Incident incident = new Incident();
        incident.setTitle("Database outage");
        incident.setDescription("Application cannot reach database");
        incident.setCategory("Infrastructure");
        incident.setSeverity("MEDIUM");
        incident.setPriority("LOW");
        incident.setStatus("IN_PROGRESS");
        incident.setReporter("reporter@example.com");
        incident.setAssignee("engineer@example.com");

        when(repository.findById(5L)).thenReturn(Optional.of(incident));
        when(repository.save(incident)).thenReturn(incident);

        Incident updated =
                service.updateClassification(5L, "Database", "HIGH", "CRITICAL");

        assertEquals("Database", updated.getCategory());
        assertEquals("HIGH", updated.getSeverity());
        assertEquals("CRITICAL", updated.getPriority());
        assertEquals("Database outage", updated.getTitle());
        assertEquals("Application cannot reach database", updated.getDescription());
        assertEquals("IN_PROGRESS", updated.getStatus());
        assertEquals("reporter@example.com", updated.getReporter());
        assertEquals("engineer@example.com", updated.getAssignee());
        verify(repository).save(incident);
    }

    @Test
    void returnsNullWhenIncidentDoesNotExist() {
        when(repository.findById(5L)).thenReturn(Optional.empty());

        assertNull(service.updateClassification(5L, "Database", "HIGH", "HIGH"));
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void returnsSimilarIncidentsAndExcludesTheCurrentIncident() {
        Incident current = incident(
                1L,
                "Database connection failure",
                "Application cannot connect to primary database server",
                "Infrastructure",
                "HIGH",
                "HIGH"
        );
        Incident similar = incident(
                2L,
                "Database connection failure",
                "Application cannot connect to primary database server",
                "Infrastructure",
                "HIGH",
                "HIGH"
        );

        when(repository.findById(1L)).thenReturn(Optional.of(current));
        when(repository.findAll()).thenReturn(List.of(current, similar));

        List<SimilarIncidentResponse> results =
                service.findSimilarIncidents(1L);

        assertEquals(1, results.size());
        assertEquals(2L, results.get(0).getIncidentId());
        assertEquals(100, results.get(0).getSimilarityScore());
    }

    @Test
    void sortsSimilarIncidentsByScoreDescending() {
        Incident current = incident(
                1L, "Database connection failure", "Application cannot connect",
                "Infrastructure", "HIGH", "HIGH"
        );
        Incident categoryMatch = incident(
                2L, "Email outage", "Mail service unavailable",
                "Infrastructure", "LOW", "LOW"
        );
        Incident highScore = incident(
                3L, "Database connection failure", "Application cannot connect",
                "Infrastructure", "HIGH", "HIGH"
        );

        when(repository.findById(1L)).thenReturn(Optional.of(current));
        when(repository.findAll()).thenReturn(List.of(categoryMatch, highScore));

        List<SimilarIncidentResponse> results =
                service.findSimilarIncidents(1L);

        assertEquals(3L, results.get(0).getIncidentId());
        assertEquals(2L, results.get(1).getIncidentId());
        assertEquals(100, results.get(0).getSimilarityScore());
        assertEquals(30, results.get(1).getSimilarityScore());
    }

    @Test
    void limitsSimilarIncidentResultsToFive() {
        Incident current = incident(
                1L, "Database outage", "Database connection failure",
                "Infrastructure", "HIGH", "HIGH"
        );
        List<Incident> candidates = new java.util.ArrayList<>();
        for (long id = 1; id <= 8; id++) {
            candidates.add(incident(
                    id, "Database outage", "Database connection failure",
                    "Infrastructure", "HIGH", "HIGH"
            ));
        }

        when(repository.findById(1L)).thenReturn(Optional.of(current));
        when(repository.findAll()).thenReturn(candidates);

        List<SimilarIncidentResponse> results =
                service.findSimilarIncidents(1L);

        assertEquals(5, results.size());
        assertEquals(
                List.of(2L, 3L, 4L, 5L, 6L),
                results.stream().map(SimilarIncidentResponse::getIncidentId).toList()
        );
    }

    @Test
    void returnsNullForAnInvalidIncidentId() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertNull(service.findSimilarIncidents(404L));
        verify(repository, never()).findAll();
    }

    @Test
    void returnsAnEmptyListWhenThereAreNoMeaningfulMatches() {
        Incident current = incident(
                1L, "Database connection failure", "Cannot connect to database",
                "Infrastructure", "HIGH", "HIGH"
        );
        Incident unrelated = incident(
                2L, "Printer jam", "Paper feed issue",
                "Hardware", "LOW", "LOW"
        );

        when(repository.findById(1L)).thenReturn(Optional.of(current));
        when(repository.findAll()).thenReturn(List.of(unrelated));

        assertEquals(List.of(), service.findSimilarIncidents(1L));
    }

    @Test
    void transitionsStatusAndAuditsOldNewValuesAndAuthenticatedUser() {
        Incident incident = incident(
                5L, "Outage", "Description", "System", "HIGH", "HIGH"
        );
        incident.setStatus("OPEN");
        authenticateAs("user@example.com");
        when(repository.findById(5L)).thenReturn(Optional.of(incident));
        when(repository.save(incident)).thenReturn(incident);

        Incident updated = service.updateStatus(5L, "IN_PROGRESS");

        assertEquals("IN_PROGRESS", updated.getStatus());
        verify(auditRepository).save(argThat(audit ->
                audit.getIncidentId().equals(5L) &&
                        audit.getAction().equals("STATUS_CHANGED") &&
                        audit.getOldValue().equals("OPEN") &&
                        audit.getNewValue().equals("IN_PROGRESS") &&
                        audit.getChangedBy().equals("user@example.com") &&
                        audit.getChangedAt() != null
        ));
    }

    @Test
    void rejectsInvalidStatusValue() {
        Incident incident = incident(
                5L, "Outage", "Description", "System", "HIGH", "HIGH"
        );
        incident.setStatus("OPEN");
        when(repository.findById(5L)).thenReturn(Optional.of(incident));

        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> service.updateStatus(5L, "CANCELLED")
        );
        verify(repository, never()).save(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void returnsNullForInvalidIncidentIdWhenUpdatingStatus() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertNull(service.updateStatus(404L, "IN_PROGRESS"));
        verify(repository, never()).save(any());
    }

    @Test
    void rejectsIllegalLifecycleTransition() {
        Incident incident = incident(
                5L, "Outage", "Description", "System", "HIGH", "HIGH"
        );
        incident.setStatus("CLOSED");
        when(repository.findById(5L)).thenReturn(Optional.of(incident));

        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalStateException.class,
                () -> service.updateStatus(5L, "OPEN")
        );
        verify(repository, never()).save(any());
        verify(auditRepository, never()).save(any());
    }

    @Test
    void assignmentChangeIsAuditedOnceAndUnchangedAssigneeIsNotAudited() {
        Incident incident = incident(
                5L, "Outage", "Description", "System", "HIGH", "HIGH"
        );
        incident.setAssignee("first@example.com");
        authenticateAs("admin@example.com");
        when(repository.findById(5L)).thenReturn(Optional.of(incident));
        when(repository.save(incident)).thenReturn(incident);

        service.assignIncident(5L, "second@example.com");
        verify(auditRepository).save(argThat(audit ->
                audit.getAction().equals("ASSIGNEE_CHANGED") &&
                        audit.getOldValue().equals("first@example.com") &&
                        audit.getNewValue().equals("second@example.com") &&
                        audit.getChangedBy().equals("admin@example.com")
        ));

        service.assignIncident(5L, "second@example.com");
        verify(auditRepository, org.mockito.Mockito.times(1)).save(any());
    }

    @Test
    void returnsAuditHistoryNewestFirst() {
        IncidentAudit newest = new IncidentAudit(
                5L, "STATUS_CHANGED", "OPEN", "IN_PROGRESS",
                "user@example.com", Instant.parse("2026-10-07T12:00:00Z")
        );
        IncidentAudit older = new IncidentAudit(
                5L, "CREATED", null, "Outage",
                "user@example.com", Instant.parse("2026-10-07T11:00:00Z")
        );
        when(repository.existsById(5L)).thenReturn(true);
        when(auditRepository.findByIncidentIdOrderByChangedAtDescIdDesc(5L))
                .thenReturn(List.of(newest, older));

        List<IncidentAudit> history = service.getAuditHistory(5L);

        assertEquals(List.of(newest, older), history);
        verify(auditRepository)
                .findByIncidentIdOrderByChangedAtDescIdDesc(5L);
    }

    @Test
    void generalUpdateAuditsTrackedChangesButNoUnchangedValues() {
        Incident existing = incident(
                5L, "Outage", "Description", "System", "MEDIUM", "MEDIUM"
        );
        existing.setStatus("OPEN");
        existing.setAssignee("admin@example.com");
        Incident changed = incident(
                5L, "Outage", "Description", "Platform", "HIGH", "HIGH"
        );
        changed.setStatus("OPEN");
        changed.setAssignee("admin@example.com");
        when(repository.findById(5L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        service.update(5L, changed);

        verify(auditRepository).save(argThat(audit ->
                audit.getAction().equals("CATEGORY_CHANGED") &&
                        audit.getOldValue().equals("System") &&
                        audit.getNewValue().equals("Platform")
        ));
        verify(auditRepository).save(argThat(audit ->
                audit.getAction().equals("PRIORITY_CHANGED") &&
                        audit.getOldValue().equals("MEDIUM") &&
                        audit.getNewValue().equals("HIGH")
        ));
        verify(auditRepository).save(argThat(audit ->
                audit.getAction().equals("SEVERITY_CHANGED") &&
                        audit.getOldValue().equals("MEDIUM") &&
                        audit.getNewValue().equals("HIGH")
        ));
        verify(auditRepository, org.mockito.Mockito.times(3)).save(any());
    }

    private void authenticateAs(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "token", List.of())
        );
    }

    private Incident incident(
            Long id,
            String title,
            String description,
            String category,
            String priority,
            String severity) {
        Incident incident = new Incident();
        ReflectionTestUtils.setField(incident, "id", id);
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setCategory(category);
        incident.setPriority(priority);
        incident.setSeverity(severity);
        incident.setStatus("OPEN");
        return incident;
    }
}
