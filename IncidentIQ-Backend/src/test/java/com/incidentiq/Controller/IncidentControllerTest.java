package com.incidentiq.Controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.incidentiq.Model.Incident;
import com.incidentiq.Model.IncidentAudit;
import com.incidentiq.dto.SimilarIncidentResponse;
import com.incidentiq.service.IncidentService;

class IncidentControllerTest {

    private IncidentService incidentService;
    private IncidentController controller;

    @BeforeEach
    void setUp() {
        incidentService = mock(IncidentService.class);
        controller = new IncidentController(incidentService);
    }

    @Test
    void returnsSimilarIncidentsForTheRequestedIncident() {
        SimilarIncidentResponse similar = new SimilarIncidentResponse(
                12L,
                "Database connection failure",
                "Database",
                "HIGH",
                "HIGH",
                "RESOLVED",
                85
        );
        when(incidentService.findSimilarIncidents(5L)).thenReturn(List.of(similar));

        ResponseEntity<List<SimilarIncidentResponse>> response =
                controller.getSimilarIncidents(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(similar), response.getBody());
        verify(incidentService).findSimilarIncidents(5L);
    }

    @Test
    void returnsNotFoundWhenTheRequestedIncidentDoesNotExist() {
        when(incidentService.findSimilarIncidents(404L)).thenReturn(null);

        ResponseEntity<List<SimilarIncidentResponse>> response =
                controller.getSimilarIncidents(404L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void returnsAnEmptyListWhenThereAreNoSimilarIncidents() {
        when(incidentService.findSimilarIncidents(5L)).thenReturn(List.of());

        ResponseEntity<List<SimilarIncidentResponse>> response =
                controller.getSimilarIncidents(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(), response.getBody());
    }

    @Test
    void updatesIncidentStatus() {
        Incident updated = new Incident();
        updated.setStatus("IN_PROGRESS");
        when(incidentService.updateStatus(5L, "IN_PROGRESS")).thenReturn(updated);

        ResponseEntity<?> response = controller.updateStatus(5L, "IN_PROGRESS");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(updated, response.getBody());
    }

    @Test
    void rejectsInvalidStatusAndReturnsNotFoundForMissingIncident() {
        when(incidentService.updateStatus(5L, "INVALID"))
                .thenThrow(new IllegalArgumentException("Invalid status."));
        when(incidentService.updateStatus(404L, "IN_PROGRESS"))
                .thenReturn(null);

        assertEquals(
                HttpStatus.BAD_REQUEST,
                controller.updateStatus(5L, "INVALID").getStatusCode()
        );
        assertEquals(
                HttpStatus.NOT_FOUND,
                controller.updateStatus(404L, "IN_PROGRESS").getStatusCode()
        );
    }

    @Test
    void auditEndpointReturnsNewestFirstRecords() {
        IncidentAudit newest = new IncidentAudit(
                5L, "STATUS_CHANGED", "OPEN", "IN_PROGRESS", "user@example.com",
                Instant.parse("2026-10-07T12:00:00Z")
        );
        IncidentAudit older = new IncidentAudit(
                5L, "CREATED", null, "Incident", "user@example.com",
                Instant.parse("2026-10-07T11:00:00Z")
        );
        when(incidentService.getAuditHistory(5L))
                .thenReturn(List.of(newest, older));

        ResponseEntity<List<IncidentAudit>> response =
                controller.getAuditHistory(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(newest, older), response.getBody());
    }
}
