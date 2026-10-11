package com.incidentiq.dto;

public class AiIncidentAnalysisRequest {

    private Long incidentId;
    private String description;

    public AiIncidentAnalysisRequest() {
    }

    public Long getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(Long incidentId) {
        this.incidentId = incidentId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
