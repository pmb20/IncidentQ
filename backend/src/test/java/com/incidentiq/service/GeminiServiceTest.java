package com.incidentiq.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.google.genai.errors.ApiException;
import com.incidentiq.dto.AiIncidentAnalysis;
import com.incidentiq.dto.AiTroubleshootingResponse;

class GeminiServiceTest {

    @Test
    void parsesRequiredAnalysisFields() {
        AiIncidentAnalysis analysis = GeminiService.parseAnalysisResponse("""
                {
                  "category": "Database",
                  "severity": "HIGH",
                  "priority": "CRITICAL",
                  "possibleCause": "Database outage",
                  "rootCause": "Unknown",
                  "recommendedActions": ["Check database health", "Review logs", "Restore service"],
                  "summary": "The application cannot reach its database."
                }
                """);

        assertEquals("Database", analysis.getCategory());
        assertEquals("HIGH", analysis.getSeverity());
        assertEquals("CRITICAL", analysis.getPriority());
        assertEquals("Database outage", analysis.getPossibleCause());
        assertEquals("Unknown", analysis.getRootCause());
        assertEquals(3, analysis.getRecommendedActions().size());
        assertEquals(
                "The application cannot reach its database.",
                analysis.getSummary()
        );
    }

    @Test
    void rejectsMalformedJson() {
        assertThrows(
                IllegalStateException.class,
                () -> GeminiService.parseAnalysisResponse("{not json}")
        );
    }

    @Test
    void rejectsUnexpectedFields() {
        assertThrows(
                IllegalStateException.class,
                () -> GeminiService.parseAnalysisResponse("""
                        {
                          "category": "Database",
                          "severity": "HIGH",
                          "priority": "HIGH",
                          "possibleCause": "Database outage",
                          "rootCause": "Unknown",
                          "recommendedActions": ["Check health", "Review logs", "Restore service"],
                          "summary": "Database unavailable.",
                          "extra": "not allowed"
                        }
                        """)
        );
    }

    @Test
    void rejectsIncorrectRecommendedActionCount() {
        assertThrows(
                IllegalStateException.class,
                () -> GeminiService.parseAnalysisResponse("""
                        {
                          "category": "Database",
                          "severity": "HIGH",
                          "priority": "HIGH",
                          "possibleCause": "Database outage",
                          "rootCause": "Unknown",
                          "recommendedActions": ["Check health"],
                          "summary": "Database unavailable."
                        }
                        """)
        );
    }

    @Test
    void rejectsUnsupportedClassificationLevel() {
        assertThrows(
                        IllegalStateException.class,
                        () -> GeminiService.parseAnalysisResponse("""
                                {
                                  "category": "Database",
                                  "severity": "URGENT",
                                  "priority": "HIGH",
                                  "possibleCause": "Database outage",
                                  "rootCause": "Unknown",
                                  "recommendedActions": ["Check health", "Review logs", "Restore service"],
                                  "summary": "Database unavailable."
                                }
                                """)
        );
    }

    @Test
    void parsesRequiredTroubleshootingFields() {
        AiTroubleshootingResponse response =
                GeminiService.parseTroubleshootingResponse("""
                        {
                          "troubleshootingSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
                          "suggestedResolution": "Restart the database service after confirming backups.",
                          "verificationSteps": ["Check connectivity", "Confirm users can sign in"]
                        }
                        """);

        assertEquals(
                List.of("Step 1", "Step 2", "Step 3", "Step 4"),
                response.getTroubleshootingSteps()
        );
        assertEquals(
                "Restart the database service after confirming backups.",
                response.getSuggestedResolution()
        );
        assertEquals(
                List.of("Check connectivity", "Confirm users can sign in"),
                response.getVerificationSteps()
        );
    }

    @Test
    void rejectsMalformedAndIncompleteTroubleshootingResponses() {
        assertThrows(
                IllegalStateException.class,
                () -> GeminiService.parseTroubleshootingResponse("{not json}")
        );
        assertThrows(
                IllegalStateException.class,
                () -> GeminiService.parseTroubleshootingResponse("""
                        {
                          "troubleshootingSteps": ["Step 1", "Step 2"],
                          "suggestedResolution": "Try again.",
                          "verificationSteps": ["Verify"]
                        }
                        """)
        );
    }

    @Test
    void retries503TwiceWithExponentialBackoffThenReturnsResponse() {
        AtomicInteger calls = new AtomicInteger();
        List<Long> delays = new ArrayList<>();
        ApiException unavailable = apiException(503);
        String result = GeminiService.retry503(() -> {
            if (calls.incrementAndGet() <= 2) {
                throw unavailable;
            }
            return "success";
        }, delays::add);

        assertEquals("success", result);
        assertEquals(3, calls.get());
        assertEquals(List.of(2_000L, 4_000L), delays);
    }

    @Test
    void returnsSuccessfulResponseWithoutRetrying() {
        AtomicInteger calls = new AtomicInteger();
        List<Long> delays = new ArrayList<>();

        String result = GeminiService.retry503(() -> {
            calls.incrementAndGet();
            return "success";
        }, delays::add);

        assertEquals("success", result);
        assertEquals(1, calls.get());
        assertEquals(List.of(), delays);
    }

    @Test
    void doesNotRetryWhenProviderStatusIsUnknownOrNull() {
        AtomicInteger calls = new AtomicInteger();
        List<Long> delays = new ArrayList<>();
        IllegalStateException unknownStatus =
                new IllegalStateException("Provider status is unavailable.");

        IllegalStateException thrown = assertThrows(
                IllegalStateException.class,
                () -> GeminiService.retry503(() -> {
                    calls.incrementAndGet();
                    throw unknownStatus;
                }, delays::add)
        );

        assertEquals(unknownStatus, thrown);
        assertEquals(1, calls.get());
        assertEquals(List.of(), delays);
    }

    @Test
    void stopsAfterInitial503AndTwoRetries() {
        AtomicInteger calls = new AtomicInteger();
        List<Long> delays = new ArrayList<>();
        ApiException unavailable = apiException(503);

        ApiException thrown = assertThrows(
                ApiException.class,
                () -> GeminiService.retry503(() -> {
                    calls.incrementAndGet();
                    throw unavailable;
                }, delays::add)
        );

        assertEquals(unavailable, thrown);
        assertEquals(3, calls.get());
        assertEquals(List.of(2_000L, 4_000L), delays);
    }

    @Test
    void doesNotRetryPermanentClientOrAuthenticationErrors() {
        for (int status : List.of(400, 401, 403)) {
            AtomicInteger calls = new AtomicInteger();
            List<Long> delays = new ArrayList<>();
            ApiException permanentError = apiException(status);

            ApiException thrown = assertThrows(
                    ApiException.class,
                    () -> GeminiService.retry503(() -> {
                        calls.incrementAndGet();
                        throw permanentError;
                    }, delays::add)
            );

            assertEquals(permanentError, thrown);
            assertEquals(1, calls.get());
            assertEquals(List.of(), delays);
        }
    }

    private ApiException apiException(int status) {
        ApiException exception = mock(ApiException.class);
        when(exception.code()).thenReturn(status);
        return exception;
    }
}
