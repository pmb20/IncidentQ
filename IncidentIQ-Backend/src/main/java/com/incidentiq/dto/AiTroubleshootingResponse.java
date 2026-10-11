package com.incidentiq.dto;

import java.util.List;

public class AiTroubleshootingResponse {

    private final List<String> troubleshootingSteps;
    private final String suggestedResolution;
    private final List<String> verificationSteps;

    public AiTroubleshootingResponse(
            List<String> troubleshootingSteps,
            String suggestedResolution,
            List<String> verificationSteps) {
        this.troubleshootingSteps = List.copyOf(troubleshootingSteps);
        this.suggestedResolution = suggestedResolution;
        this.verificationSteps = List.copyOf(verificationSteps);
    }

    public List<String> getTroubleshootingSteps() {
        return troubleshootingSteps;
    }

    public String getSuggestedResolution() {
        return suggestedResolution;
    }

    public List<String> getVerificationSteps() {
        return verificationSteps;
    }
}
