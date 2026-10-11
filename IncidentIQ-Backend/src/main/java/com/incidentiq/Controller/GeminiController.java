package com.incidentiq.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.Model.Incident;
import com.incidentiq.dto.AiIncidentAnalysis;
import com.incidentiq.dto.AiIncidentAnalysisRequest;
import com.incidentiq.dto.AiIncidentAnalysisResponse;
import com.incidentiq.dto.AiIncidentTroubleshootingRequest;
import com.incidentiq.dto.AiTroubleshootingResponse;
import com.incidentiq.service.IncidentService;
import com.incidentiq.service.GeminiService;
import com.incidentiq.service.GeminiService.GeminiRequestException;

@RestController
@RequestMapping("/api/ai")
public class GeminiController {

    private final GeminiService service;
    private final IncidentService incidentService;

    public GeminiController(
            GeminiService service,
            IncidentService incidentService) {
        this.service = service;
        this.incidentService = incidentService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeIncident(
            @RequestBody AiIncidentAnalysisRequest request) {
        if (request == null || request.getIncidentId() == null ||
                request.getIncidentId() < 1 ||
                request.getDescription() == null ||
                request.getDescription().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "incidentId and description are required."));
        }

        Incident incident = incidentService.getById(request.getIncidentId());
        if (incident == null) {
            return ResponseEntity.notFound().build();
        }

        if (incident.getDescription() == null ||
                incident.getDescription().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "The incident has no description to analyze."));
        }

        try {
            AiIncidentAnalysis analysis =
                    service.analyzeIncident(incident.getDescription());
            Incident updatedIncident = incidentService.updateClassification(
                    request.getIncidentId(),
                    analysis.getCategory(),
                    analysis.getSeverity(),
                    analysis.getPriority()
            );

            if (updatedIncident == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(
                    new AiIncidentAnalysisResponse(analysis, updatedIncident)
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (GeminiRequestException ex) {
            HttpStatus status = ex.isTimedOut()
                    ? HttpStatus.GATEWAY_TIMEOUT
                    : HttpStatus.BAD_GATEWAY;
            return ResponseEntity.status(status)
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to analyze this incident. Please try again."));
        }
    }

    @PostMapping("/troubleshoot")
    public ResponseEntity<?> troubleshootIncident(
            @RequestBody AiIncidentTroubleshootingRequest request) {
        if (request == null || request.getIncidentId() == null ||
                request.getIncidentId() < 1) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "A valid incidentId is required."));
        }

        Incident incident = incidentService.getById(request.getIncidentId());
        if (incident == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            AiTroubleshootingResponse response = service.troubleshootIncident(
                    incident,
                    request
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (GeminiRequestException ex) {
            HttpStatus status = ex.isTimedOut()
                    ? HttpStatus.GATEWAY_TIMEOUT
                    : HttpStatus.BAD_GATEWAY;
            return ResponseEntity.status(status)
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to generate troubleshooting guidance. Please try again."));
        }
    }
}