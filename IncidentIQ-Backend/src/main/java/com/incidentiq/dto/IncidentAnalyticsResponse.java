package com.incidentiq.dto;

import java.util.Map;

public class IncidentAnalyticsResponse {

    private final long totalIncidents;
    private final long openIncidents;
    private final long inProgressIncidents;
    private final long resolvedIncidents;
    private final long criticalIncidents;
    private final Map<String, Long> statusCounts;
    private final Map<String, Long> priorityCounts;
    private final Map<String, Long> severityCounts;

    public IncidentAnalyticsResponse(
            long totalIncidents,
            long openIncidents,
            long inProgressIncidents,
            long resolvedIncidents,
            long criticalIncidents,
            Map<String, Long> statusCounts,
            Map<String, Long> priorityCounts,
            Map<String, Long> severityCounts) {
        this.totalIncidents = totalIncidents;
        this.openIncidents = openIncidents;
        this.inProgressIncidents = inProgressIncidents;
        this.resolvedIncidents = resolvedIncidents;
        this.criticalIncidents = criticalIncidents;
        this.statusCounts = Map.copyOf(statusCounts);
        this.priorityCounts = Map.copyOf(priorityCounts);
        this.severityCounts = Map.copyOf(severityCounts);
    }

    public long getTotalIncidents() {
        return totalIncidents;
    }

    public long getOpenIncidents() {
        return openIncidents;
    }

    public long getInProgressIncidents() {
        return inProgressIncidents;
    }

    public long getResolvedIncidents() {
        return resolvedIncidents;
    }

    public long getCriticalIncidents() {
        return criticalIncidents;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public Map<String, Long> getPriorityCounts() {
        return priorityCounts;
    }

    public Map<String, Long> getSeverityCounts() {
        return severityCounts;
    }
}
