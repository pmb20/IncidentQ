package com.incidentiq.dto;

public class SimilarIncidentResponse {

    private final Long incidentId;
    private final String title;
    private final String category;
    private final String priority;
    private final String severity;
    private final String status;
    private final int similarityScore;

    public SimilarIncidentResponse(
            Long incidentId,
            String title,
            String category,
            String priority,
            String severity,
            String status,
            int similarityScore) {
        this.incidentId = incidentId;
        this.title = title;
        this.category = category;
        this.priority = priority;
        this.severity = severity;
        this.status = status;
        this.similarityScore = similarityScore;
    }

    public Long getIncidentId() {
        return incidentId;
    }

    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public String getPriority() {
        return priority;
    }

    public String getSeverity() {
        return severity;
    }

    public String getStatus() {
        return status;
    }

    public int getSimilarityScore() {
        return similarityScore;
    }
}
