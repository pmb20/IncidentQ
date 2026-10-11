package com.incidentiq.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.Model.Incident;
import com.incidentiq.Model.IncidentAudit;
import com.incidentiq.dto.IncidentAnalyticsResponse;
import com.incidentiq.dto.SimilarIncidentResponse;
import com.incidentiq.service.IncidentService;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @PostMapping
    public Incident createIncident(
            @RequestBody Incident incident) {

        return service.createIncident(incident);
    }

    @GetMapping
    public List<Incident> getAllIncidents() {

        return service.getAll();
    }

    @GetMapping("/analytics")
    public IncidentAnalyticsResponse getAnalytics() {
        return service.getAnalytics();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncident(
            @PathVariable Long id) {

        Incident incident = service.getById(id);

        return incident == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(incident);
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<SimilarIncidentResponse>> getSimilarIncidents(
            @PathVariable Long id) {
        List<SimilarIncidentResponse> similarIncidents =
                service.findSimilarIncidents(id);

        return similarIncidents == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(similarIncidents);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Incident updated = service.updateStatus(id, status);
            return updated == null
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<IncidentAudit>> getAuditHistory(
            @PathVariable Long id) {
        List<IncidentAudit> auditHistory = service.getAuditHistory(id);
        return auditHistory == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(auditHistory);
    }

    @GetMapping("/search")
    public List<Incident> searchIncidents(
            @RequestParam String title) {

        return service.search(title);
    }

    @GetMapping("/status/{status}")
    public List<Incident> getByStatus(
            @PathVariable String status) {

        return service.getByStatus(status);
    }

    @GetMapping("/priority/{priority}")
    public List<Incident> getByPriority(
            @PathVariable String priority) {

        return service.getByPriority(priority);
    }

    @GetMapping("/severity/{severity}")
    public List<Incident> getBySeverity(
            @PathVariable String severity) {

        return service.getBySeverity(severity);
    }

    @GetMapping("/filter")
    public Page<Incident> searchAndFilter(

            @RequestParam(required = false) String title,

            @RequestParam(required = false) String status,

            @RequestParam(required = false) String priority,

            @RequestParam(required = false) String severity,

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {

        return service.searchAndFilter(
                title,
                status,
                priority,
                severity,
                page,
                size
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIncident(
            @PathVariable Long id,
            @RequestBody Incident incident) {
        try {
            Incident updated = service.update(id, incident);
            return updated == null
                    ? ResponseEntity.notFound().build()
                    : ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Incident> assignIncident(
            @PathVariable Long id,
            @RequestParam String assignee) {
        Incident updated = service.assignIncident(id, assignee);
        return updated == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public String deleteIncident(
            @PathVariable Long id) {

        service.delete(id);

        return "Incident deleted successfully";
    }
}