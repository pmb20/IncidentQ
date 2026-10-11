package com.incidentiq.dto;

import java.util.List;

public class AiIncidentAnalysis {

    private final String category;
    private final String severity;
    private final String priority;
    private final String possibleCause;
    private final String rootCause;
    private final List<String> recommendedActions;
    private final String summary;

    public AiIncidentAnalysis(
            String category,
            String severity,
            String priority,
            String possibleCause,
            String rootCause,
            List<String> recommendedActions,
            String summary) {
        this.category = category;
        this.severity = severity;
        this.priority = priority;
        this.possibleCause = possibleCause;
        this.rootCause = rootCause;
        this.recommendedActions = List.copyOf(recommendedActions);
        this.summary = summary;
    }

    public String getCategory() {
        return category;
    }

    public String getSeverity() {
        return severity;
    }

    public String getPriority() {
        return priority;
    }

    public String getPossibleCause() {
        return possibleCause;
    }

    public String getRootCause() {
        return rootCause;
    }

    public List<String> getRecommendedActions() {
        return recommendedActions;
    }

    public String getSummary() {
        return summary;
    }
}
