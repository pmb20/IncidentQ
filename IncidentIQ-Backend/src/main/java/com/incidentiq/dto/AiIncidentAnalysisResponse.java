package com.incidentiq.dto;

import com.incidentiq.Model.Incident;

public class AiIncidentAnalysisResponse {

    private final AiIncidentAnalysis analysis;
    private final Incident incident;

    public AiIncidentAnalysisResponse(AiIncidentAnalysis analysis, Incident incident) {
        this.analysis = analysis;
        this.incident = incident;
    }

    public AiIncidentAnalysis getAnalysis() {
        return analysis;
    }

    public Incident getIncident() {
        return incident;
    }
}
