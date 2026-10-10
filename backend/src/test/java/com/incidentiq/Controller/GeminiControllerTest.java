package com.incidentiq.Controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.incidentiq.Model.Incident;
import com.incidentiq.dto.AiIncidentAnalysis;
import com.incidentiq.dto.AiIncidentAnalysisRequest;
import com.incidentiq.dto.AiIncidentAnalysisResponse;
import com.incidentiq.dto.AiIncidentTroubleshootingRequest;
import com.incidentiq.dto.AiTroubleshootingResponse;
import com.incidentiq.service.IncidentService;
import com.incidentiq.service.GeminiService;

class GeminiControllerTest {

    private GeminiService geminiService;
    private IncidentService incidentService;
    private GeminiController controller;

    @BeforeEach
    void setUp() {
        geminiService = mock(GeminiService.class);
        incidentService = mock(IncidentService.class);
        controller = new GeminiController(geminiService, incidentService);
    }

    @Test
    void analyzesAndUpdatesTheRequestedIncidentOnly() {
        Incident incident = new Incident();
        ReflectionTestUtils.setField(incident, "id", 5L);
        incident.setDescription("Persisted database incident description");

        AiIncidentAnalysis analysis = new AiIncidentAnalysis(
                "Database",
                "HIGH",
                "CRITICAL",
                "Connection failure",
                "Database endpoint is unavailable",
                List.of("Check database", "Review logs", "Restore connectivity"),
                "Users cannot reach the application."
        );

        when(incidentService.getById(5L)).thenReturn(incident);
        when(geminiService.analyzeIncident("Persisted database incident description"))
                .thenReturn(analysis);
        when(incidentService.updateClassification(
                5L,
                "Database",
                "HIGH",
                "CRITICAL"
        )).thenReturn(incident);

        AiIncidentAnalysisRequest request = new AiIncidentAnalysisRequest();
        request.setIncidentId(5L);
        request.setDescription("Client description must not select the record.");

        ResponseEntity<?> response = controller.analyzeIncident(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        AiIncidentAnalysisResponse body =
                assertInstanceOf(AiIncidentAnalysisResponse.class, response.getBody());
        assertEquals(analysis, body.getAnalysis());
        assertEquals(incident, body.getIncident());
        verify(incidentService).getById(5L);
        verify(incidentService).updateClassification(
                5L,
                "Database",
                "HIGH",
                "CRITICAL"
        );
    }

    @Test
    void troubleshootsUsingTheStoredIncidentAndDoesNotUpdateIt() {
        Incident storedIncident = new Incident();
        ReflectionTestUtils.setField(storedIncident, "id", 9L);
        storedIncident.setTitle("Stored title");
        storedIncident.setDescription("Stored description");
        storedIncident.setCategory("Database");
        storedIncident.setSeverity("HIGH");
        storedIncident.setPriority("CRITICAL");
        storedIncident.setStatus("IN_PROGRESS");

        AiIncidentAnalysis analysis = new AiIncidentAnalysis(
                "Database",
                "HIGH",
                "CRITICAL",
                "Possible connection pool exhaustion",
                "Unknown",
                List.of("Inspect pool usage", "Review logs", "Check database health"),
                "Database access is failing."
        );
        AiTroubleshootingResponse troubleshooting = new AiTroubleshootingResponse(
                List.of("Step 1", "Step 2", "Step 3", "Step 4"),
                "Restart the service after validation.",
                List.of("Check connectivity", "Confirm recovery")
        );

        when(incidentService.getById(9L)).thenReturn(storedIncident);
        AiIncidentTroubleshootingRequest request =
                new AiIncidentTroubleshootingRequest();
        request.setIncidentId(9L);
        request.setPossibleCause(analysis.getPossibleCause());
        request.setRootCause(analysis.getRootCause());
        request.setRecommendedActions(analysis.getRecommendedActions());
        request.setSummary(analysis.getSummary());
        when(geminiService.troubleshootIncident(storedIncident, request))
                .thenReturn(troubleshooting);

        ResponseEntity<?> response = controller.troubleshootIncident(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(troubleshooting, response.getBody());
        verify(incidentService).getById(9L);
        verify(geminiService).troubleshootIncident(storedIncident, request);
        verify(incidentService, never()).updateClassification(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString()
        );
    }

    @Test
    void doesNotGenerateTroubleshootingForAnUnknownIncident() {
        when(incidentService.getById(42L)).thenReturn(null);
        AiIncidentTroubleshootingRequest request =
                new AiIncidentTroubleshootingRequest();
        request.setIncidentId(42L);

        ResponseEntity<?> response = controller.troubleshootIncident(request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(geminiService, never()).troubleshootIncident(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }
}
