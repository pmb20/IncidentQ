import { useEffect, useRef, useState } from "react";
import "./dashboard.css";

function App() {
  /* =========================
     LOGIN
     ========================= */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authPage, setAuthPage] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");

  /* =========================
     INCIDENTS
     ========================= */

  const [incidents, setIncidents] = useState([]);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState("");
  const [analytics, setAnalytics] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    statusCounts: {},
    priorityCounts: {},
    severityCounts: {},
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");

  const [activeIncidentFilters, setActiveIncidentFilters] =
    useState({
      title: "",
      status: "",
      priority: "",
      severity: "",
    });

  const [incidentPage, setIncidentPage] = useState({
    number: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
  });

  const incidentRequestIdRef = useRef(0);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedIncident, setSelectedIncident] =
    useState(null);
  const [activeIncidentSection, setActiveIncidentSection] =
    useState("overview");

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const incidentDetailsRef = useRef(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const aiRequestIdRef = useRef(0);
  const [aiTroubleshooting, setAiTroubleshooting] = useState(null);
  const [troubleshootingLoading, setTroubleshootingLoading] = useState(false);
  const [troubleshootingError, setTroubleshootingError] = useState("");
  const troubleshootingRequestIdRef = useRef(0);
  const [similarIncidents, setSimilarIncidents] = useState(null);
  const [similarIncidentsLoading, setSimilarIncidentsLoading] = useState(false);
  const [similarIncidentsError, setSimilarIncidentsError] = useState("");
  const similarIncidentsRequestIdRef = useRef(0);
  const intelligenceRequestIdRef = useRef(0);
  const [auditHistory, setAuditHistory] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const auditRequestIdRef = useRef(0);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");

  /* =========================
     CREATE INCIDENT
     ========================= */

  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    severity: "MEDIUM",
    status: "OPEN",
    reporter: "bcrypttest@gmail.com",
    assignee: "",
  });

  /* =========================
     UPDATE INCIDENT
     ========================= */

  const [editingIncident, setEditingIncident] =
    useState(false);

  const [updateLoading, setUpdateLoading] =
    useState(false);

  /* =========================
     ASSIGN INCIDENT
     ========================= */

  const [assigningIncident, setAssigningIncident] =
    useState(false);

  const [assigneeInput, setAssigneeInput] =
    useState("");

  /* =========================
     COMMENTS
     ========================= */

  const [comments, setComments] = useState([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [newComment, setNewComment] =
    useState("");

  const [commentLoading, setCommentLoading] =
    useState(false);

  /* =========================
     RESOLUTIONS
     ========================= */

  const [resolutions, setResolutions] =
    useState([]);

  const [resolutionsLoading, setResolutionsLoading] =
    useState(false);

  const [newResolution, setNewResolution] =
    useState("");

  const [resolutionLoading, setResolutionLoading] =
    useState(false);

  /* =========================
     ATTACHMENTS
     ========================= */

  const [attachments, setAttachments] =
    useState([]);

  const [attachmentsLoading, setAttachmentsLoading] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [attachmentUploading, setAttachmentUploading] =
    useState(false);

  const [attachmentMessage, setAttachmentMessage] =
    useState("");

  const [attachmentMessageType, setAttachmentMessageType] =
    useState("");

  const attachmentFileInputRef = useRef(null);

  const attachmentRequestIdRef = useRef(0);

  /* =========================
     LOGIN
     ========================= */

  const login = async (event) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Login failed."
        );

        setMessageType("error");

        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "userEmail",
        email.trim().toLowerCase()
      );

      setLoggedIn(true);

      setMessage("Login successful!");
      setMessageType("success");

      await Promise.all([
        loadIncidents(data.token),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        "Unable to connect to the backend. Make sure Spring Boot is running."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const register = async (event) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Registration failed."
        );
        setMessageType("error");
        return;
      }

      setEmail(email.trim());
      setPassword("");
      setName("");
      setAuthPage("login");
      setMessage("Account created. Sign in with your new credentials.");
      setMessageType("success");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(
        "Unable to connect to the backend. Make sure Spring Boot is running."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOAD ALL INCIDENTS
     ========================= */

  const loadIncidents = async (
    jwtToken = localStorage.getItem("token"),
    filters = activeIncidentFilters,
    pageNumber = incidentPage.number
  ) => {
    if (!jwtToken) {
      setIncidentError(
        "Please login again to load incidents."
      );
      return;
    }

    const requestId =
      ++incidentRequestIdRef.current;

    setIncidentLoading(true);
    setIncidentError("");

    try {
      const query = new URLSearchParams();
      const title = filters.title.trim();

      if (title) {
        query.set("title", title);
      }

      if (filters.status) {
        query.set("status", filters.status);
      }

      if (filters.priority) {
        query.set("priority", filters.priority);
      }

      if (filters.severity) {
        query.set("severity", filters.severity);
      }

      query.set("page", String(pageNumber));
      query.set("size", "10");

      const response = await fetch(
        `http://localhost:8080/api/incidents/filter?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (requestId !== incidentRequestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to load incidents:",
          response.status,
          errorText
        );

        setIncidents([]);
        setIncidentPage({
          number: 0,
          size: 10,
          totalPages: 0,
          totalElements: 0,
          first: true,
          last: true,
        });
        setIncidentError(
          response.status === 401 ||
            response.status === 403
            ? "Your session is no longer authorized. Please login again."
            : "Unable to load incidents. Please try again."
        );

        return;
      }

      const data = await response.json();

      if (requestId !== incidentRequestIdRef.current) {
        return;
      }

      if (
        !data ||
        !Array.isArray(data.content) ||
        !Number.isInteger(data.number) ||
        !Number.isInteger(data.size) ||
        !Number.isInteger(data.totalPages) ||
        !Number.isFinite(data.totalElements) ||
        typeof data.first !== "boolean" ||
        typeof data.last !== "boolean"
      ) {
        throw new Error(
          "The incident filter endpoint returned an invalid page response."
        );
      }

      if (
        data.content.length === 0 &&
        data.totalPages > 0 &&
        pageNumber >= data.totalPages
      ) {
        await loadIncidents(
          jwtToken,
          filters,
          data.totalPages - 1
        );
        return;
      }

      setIncidents(
        data.content
      );
      setIncidentPage({
        number: data.number,
        size: data.size,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      });
    } catch (error) {
      console.error(
        "Incident loading error:",
        error
      );

      if (requestId === incidentRequestIdRef.current) {
        setIncidents([]);
        setIncidentError(
          error instanceof SyntaxError
            ? "The backend returned an invalid incident response."
            : error instanceof Error &&
                error.message.includes(
                  "invalid page response"
                )
              ? error.message
              : "Unable to connect to the backend while loading incidents."
        );
      }
    } finally {
      if (requestId === incidentRequestIdRef.current) {
        setIncidentLoading(false);
      }
    }
  };

  const loadAnalytics = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAnalyticsError("Please login again to load analytics.");
      return;
    }

    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/incidents/analytics",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to load analytics:",
          response.status
        );
        setAnalyticsError(
          response.status === 401 || response.status === 403
            ? "Your session is no longer authorized. Please login again."
            : "Unable to load analytics. Please try again."
        );
        return;
      }

      const data = await response.json();
      const countMaps = [
        data?.statusCounts,
        data?.priorityCounts,
        data?.severityCounts,
      ];

      if (
        !data ||
        ![
          data.totalIncidents,
          data.openIncidents,
          data.inProgressIncidents,
          data.resolvedIncidents,
          data.criticalIncidents,
        ].every(Number.isFinite) ||
        !countMaps.every(
          (counts) =>
            counts !== null &&
            typeof counts === "object" &&
            !Array.isArray(counts) &&
            Object.values(counts).every(Number.isFinite)
        )
      ) {
        throw new Error(
          "The analytics endpoint returned an invalid response."
        );
      }

      setAnalytics(data);
    } catch (error) {
      console.error("Analytics loading error:", error);
      setAnalyticsError(
        error instanceof Error &&
          error.message.includes("invalid response")
          ? error.message
          : "Unable to connect to the backend while loading analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const applyIncidentFilters = (event) => {
    event.preventDefault();

    const filters = {
      title: searchTitle.trim(),
      status: selectedStatus,
      priority: selectedPriority,
      severity: selectedSeverity,
    };

    setActiveIncidentFilters(filters);
    loadIncidents(
      localStorage.getItem("token"),
      filters,
      0
    );
  };

  const loadAuditHistory = async (incidentId) => {
    const token = localStorage.getItem("token");
    const requestId = ++auditRequestIdRef.current;
    if (!token) {
      setAuditHistory([]);
      setAuditError("Your session has expired. Please login again.");
      return;
    }

    setAuditLoading(true);
    setAuditError("");
    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${incidentId}/audit`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json().catch(() => null);

      if (requestId !== auditRequestIdRef.current) {
        return;
      }
      if (!response.ok) {
        setAuditHistory([]);
        setAuditError(
          response.status === 401 || response.status === 403
            ? "You are not authorized to view this audit history. Please login again."
            : "Unable to load incident audit history."
        );
        return;
      }
      if (!Array.isArray(result)) {
        setAuditHistory([]);
        setAuditError("The audit history endpoint returned an invalid response.");
        return;
      }
      setAuditHistory(result);
    } catch (error) {
      console.error("Incident audit history request failed:", error);
      if (requestId === auditRequestIdRef.current) {
        setAuditHistory([]);
        setAuditError("Unable to connect to the backend while loading audit history.");
      }
    } finally {
      if (requestId === auditRequestIdRef.current) {
        setAuditLoading(false);
      }
    }
  };

  const clearIncidentFilters = () => {
    const filters = {
      title: "",
      status: "",
      priority: "",
      severity: "",
    };

    setSearchTitle("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedSeverity("");
    setActiveIncidentFilters(filters);
    loadIncidents(
      localStorage.getItem("token"),
      filters,
      0
    );
  };

  /* =========================
     LOAD INCIDENT DETAILS
     ========================= */

  const loadIncidentDetails = async (id) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    console.log(
      "Loading incident:",
      id
    );

    setDetailsLoading(true);
    setActiveIncidentSection("overview");

    intelligenceRequestIdRef.current += 1;
    aiRequestIdRef.current += 1;
    setAiAnalysis(null);
    setAiLoading(false);
    setAiError("");
    troubleshootingRequestIdRef.current += 1;
    setAiTroubleshooting(null);
    setTroubleshootingLoading(false);
    setTroubleshootingError("");
    similarIncidentsRequestIdRef.current += 1;
    setSimilarIncidents(null);
    setSimilarIncidentsLoading(false);
    setSimilarIncidentsError("");
    auditRequestIdRef.current += 1;
    setAuditHistory([]);
    setAuditLoading(false);
    setAuditError("");
    setStatusError("");

    attachmentRequestIdRef.current += 1;

    setSelectedIncident(null);

    setComments([]);

    setResolutions([]);

    setAttachments([]);

    setSelectedFile(null);

    setAttachmentMessage("");
    setAttachmentMessageType("");
    setAttachmentsLoading(false);

    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = "";
    }

    setNewComment("");

    setNewResolution("");

    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Incident details response:",
        response.status
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to load incident:",
          errorText
        );

        alert(
          "Unable to load incident details."
        );

        return;
      }

      const data =
        await response.json();

      console.log(
        "Incident details:",
        data
      );

      setSelectedIncident(data);

      setAssigneeInput(
        data.assignee || ""
      );

      await loadAuditHistory(data.id);
      await loadComments(data.id);

      await loadResolutions(data.id);

      await loadAttachments(data.id);
    } catch (error) {
      console.error(
        "Incident details error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const analyzeSelectedIncident = async () => {
    if (!selectedIncident) {
      setAiError("Open an incident before requesting AI analysis.");
      return null;
    }

    const description =
      selectedIncident.description?.trim();

    if (!description) {
      setAiAnalysis(null);
      setAiError(
        "Add an incident description before requesting AI analysis."
      );
      return null;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setAiAnalysis(null);
      setAiError(
        "Your session has expired. Please login again."
      );
      return null;
    }

    const requestId =
      ++aiRequestIdRef.current;

    troubleshootingRequestIdRef.current += 1;
    setAiTroubleshooting(null);
    setTroubleshootingLoading(false);
    setTroubleshootingError("");
    setAiAnalysis(null);
    setAiError("");
    setAiLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/ai/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            incidentId: selectedIncident.id,
            description,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (requestId !== aiRequestIdRef.current) {
        return null;
      }

      if (!response.ok) {
        setAiError(
          response.status === 401 ||
            response.status === 403
            ? "You are not authorized to analyze this incident. Please login again."
            : typeof result?.error === "string"
              ? result.error
              : "Unable to analyze this incident. Please try again."
        );
        return null;
      }

      const expectedFields = [
        "category",
        "severity",
        "priority",
        "possibleCause",
        "rootCause",
        "recommendedActions",
        "summary",
      ];
      const analysis = result?.analysis;
      const updatedIncident = result?.incident;
      const validAnalysis =
        result !== null &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        Object.keys(result).length === 2 &&
        Object.prototype.hasOwnProperty.call(result, "analysis") &&
        Object.prototype.hasOwnProperty.call(result, "incident") &&
        analysis !== null &&
        typeof analysis === "object" &&
        !Array.isArray(analysis) &&
        Object.keys(analysis).length === expectedFields.length &&
        expectedFields.every((field) =>
          Object.prototype.hasOwnProperty.call(analysis, field)
        ) &&
        expectedFields
          .filter((field) => field !== "recommendedActions")
          .every(
            (field) =>
              typeof analysis[field] === "string" &&
              analysis[field].trim().length > 0
          ) &&
        Array.isArray(analysis.recommendedActions) &&
        analysis.recommendedActions.length === 3 &&
        analysis.recommendedActions.every(
          (action) =>
            typeof action === "string" &&
            action.trim().length > 0
        ) &&
        updatedIncident !== null &&
        typeof updatedIncident === "object" &&
        updatedIncident.id === selectedIncident.id &&
        updatedIncident.category === analysis.category &&
        updatedIncident.severity === analysis.severity &&
        updatedIncident.priority === analysis.priority;

      if (!validAnalysis) {
        setAiError(
          "The AI returned an invalid analysis response. Please try again."
        );
        return null;
      }

      setSelectedIncident(updatedIncident);
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === updatedIncident.id
            ? updatedIncident
            : incident
        )
      );
      setAiAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error("Incident AI analysis failed:", error);

      if (requestId === aiRequestIdRef.current) {
        setAiError(
          "Unable to analyze this incident. Please try again."
        );
      }
      return null;
    } finally {
      if (requestId === aiRequestIdRef.current) {
        setAiLoading(false);
      }
    }
  };

  const getAiTroubleshooting = async (analysis = aiAnalysis) => {
    if (!selectedIncident) {
      setTroubleshootingError("Open an incident before requesting troubleshooting.");
      return null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setTroubleshootingError("Your session has expired. Please login again.");
      return null;
    }

    const requestId = ++troubleshootingRequestIdRef.current;
    setAiTroubleshooting(null);
    setTroubleshootingError("");
    setTroubleshootingLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/ai/troubleshoot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            incidentId: selectedIncident.id,
            possibleCause: analysis?.possibleCause,
            rootCause: analysis?.rootCause,
            recommendedActions: analysis?.recommendedActions,
            summary: analysis?.summary,
          }),
        }
      );
      const result = await response.json().catch(() => null);

      if (requestId !== troubleshootingRequestIdRef.current) {
        return null;
      }

      if (!response.ok) {
        setTroubleshootingError(
          response.status === 401 || response.status === 403
            ? "You are not authorized to request troubleshooting. Please login again."
            : typeof result?.error === "string"
              ? result.error
              : "Unable to get AI troubleshooting. Please try again."
        );
        return null;
      }

      const expectedFields = [
        "troubleshootingSteps",
        "suggestedResolution",
        "verificationSteps",
      ];
      const validResponse =
        result !== null &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        Object.keys(result).length === expectedFields.length &&
        expectedFields.every((field) =>
          Object.prototype.hasOwnProperty.call(result, field)
        ) &&
        Array.isArray(result.troubleshootingSteps) &&
        result.troubleshootingSteps.length === 4 &&
        result.troubleshootingSteps.every(
          (step) => typeof step === "string" && step.trim().length > 0
        ) &&
        typeof result.suggestedResolution === "string" &&
        result.suggestedResolution.trim().length > 0 &&
        Array.isArray(result.verificationSteps) &&
        result.verificationSteps.length === 2 &&
        result.verificationSteps.every(
          (step) => typeof step === "string" && step.trim().length > 0
        );

      if (!validResponse) {
        setTroubleshootingError(
          "The AI returned an invalid troubleshooting response. Please try again."
        );
        return null;
      }

      setAiTroubleshooting(result);
      return result;
    } catch (error) {
      console.error("Incident AI troubleshooting failed:", error);
      if (requestId === troubleshootingRequestIdRef.current) {
        setTroubleshootingError(
          "Unable to get AI troubleshooting. Please try again."
        );
      }
      return null;
    } finally {
      if (requestId === troubleshootingRequestIdRef.current) {
        setTroubleshootingLoading(false);
      }
    }
  };

  const getAvailableStatusTransitions = (status) => {
    switch (status) {
      case "OPEN":
        return ["IN_PROGRESS", "RESOLVED"];
      case "IN_PROGRESS":
        return ["RESOLVED"];
      case "RESOLVED":
        return ["CLOSED"];
      default:
        return [];
    }
  };

  const updateIncidentStatus = async (status) => {
    if (!selectedIncident) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatusError("Your session has expired. Please login again.");
      return;
    }

    setStatusUpdating(true);
    setStatusError("");
    try {
      let response;
      try {
        response = await fetch(
          `http://localhost:8080/api/incidents/${selectedIncident.id}/status?status=${encodeURIComponent(status)}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Incident status request failed:", error);
        setStatusError("Unable to connect to the backend while updating status.");
        return;
      }

      let result = null;
      try {
        result = await response.json();
      } catch (error) {
        console.error("Unable to read incident status response:", error);
      }

      if (!response.ok) {
        setStatusError(
          typeof result?.error === "string"
            ? result.error
            : response.status === 401 || response.status === 403
              ? "You are not authorized to change this incident status."
              : "Unable to update incident status."
        );
        return;
      }

      const updatedIncident =
        result?.incident ??
        result?.data ??
        result;
      if (
        updatedIncident === null ||
        typeof updatedIncident !== "object" ||
        Array.isArray(updatedIncident) ||
        String(updatedIncident.id) !== String(selectedIncident.id)
      ) {
        setStatusError(
          "The status was updated, but the backend returned an invalid incident response."
        );
        await loadAuditHistory(selectedIncident.id);
        return;
      }

      const refreshedIncident = {
        ...selectedIncident,
        ...updatedIncident,
        status: updatedIncident.status || status,
      };
      setSelectedIncident(refreshedIncident);
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          String(incident.id) === String(refreshedIncident.id)
            ? refreshedIncident
            : incident
        )
      );
      setStatusError("");
      await loadAuditHistory(refreshedIncident.id);
    } finally {
      setStatusUpdating(false);
    }
  };

  const findSimilarIncidents = async () => {
    if (!selectedIncident) {
      setSimilarIncidentsError("Open an incident before searching for similar incidents.");
      return null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setSimilarIncidentsError("Your session has expired. Please login again.");
      return null;
    }

    const requestId = ++similarIncidentsRequestIdRef.current;
    setSimilarIncidents(null);
    setSimilarIncidentsError("");
    setSimilarIncidentsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${selectedIncident.id}/similar`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json().catch(() => null);

      if (requestId !== similarIncidentsRequestIdRef.current) {
        return null;
      }

      if (!response.ok) {
        setSimilarIncidentsError(
          response.status === 401 || response.status === 403
            ? "You are not authorized to search similar incidents. Please login again."
            : typeof result?.error === "string"
              ? result.error
              : response.status === 404
                ? "The selected incident could not be found."
                : "Unable to find similar incidents. Please try again."
        );
        return null;
      }

      const validResults =
        Array.isArray(result) &&
        result.every(
          (incident) =>
            incident !== null &&
            typeof incident === "object" &&
            Number.isInteger(incident.incidentId) &&
            incident.incidentId !== selectedIncident.id &&
            typeof incident.title === "string" &&
            typeof incident.similarityScore === "number" &&
            incident.similarityScore >= 0 &&
            incident.similarityScore <= 100 &&
            ["category", "priority", "severity", "status"].every(
              (field) =>
                incident[field] === null ||
                typeof incident[field] === "string"
            )
        );

      if (!validResults) {
        setSimilarIncidentsError(
          "The similar incidents endpoint returned an invalid response."
        );
        return null;
      }

      setSimilarIncidents(result);
      return result;
    } catch (error) {
      console.error("Similar incidents request failed:", error);
      if (requestId === similarIncidentsRequestIdRef.current) {
        setSimilarIncidentsError(
          "Unable to connect to the backend while searching similar incidents."
        );
      }
      return null;
    } finally {
      if (requestId === similarIncidentsRequestIdRef.current) {
        setSimilarIncidentsLoading(false);
      }
    }
  };

  const analyzeIncidentIntelligence = async () => {
    if (!selectedIncident) {
      return;
    }

    const requestId = ++intelligenceRequestIdRef.current;
    setActiveIncidentSection("intelligence");

    const similarRequest = findSimilarIncidents();
    const analysis = await analyzeSelectedIncident();
    if (requestId !== intelligenceRequestIdRef.current) {
      return;
    }
    await getAiTroubleshooting(analysis);
    await similarRequest;
  };

  /* =========================
     CREATE INCIDENT
     ========================= */

  const createIncident = async (event) => {
    event.preventDefault();

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/incidents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            newIncident
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Create incident failed:",
          errorText
        );

        alert(
          "Failed to create incident."
        );

        return;
      }

      setShowCreateForm(false);

      setNewIncident({
        title: "",
        description: "",
        category: "",
        priority: "MEDIUM",
        severity: "MEDIUM",
        status: "OPEN",
        reporter: "bcrypttest@gmail.com",
        assignee: "",
      });

      await loadIncidents(token);

      alert(
        "Incident created successfully!"
      );
    } catch (error) {
      console.error(
        "Create incident error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  };

  /* =========================
     UPDATE INCIDENT
     ========================= */

  const updateIncident = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedIncident) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    setUpdateLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${selectedIncident.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            selectedIncident
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Update incident failed:",
          errorText
        );

        alert(
          "Failed to update incident."
        );

        return;
      }

      const updated =
        await response.json();

      setSelectedIncident(updated);

      setEditingIncident(false);

      await loadIncidents(token);

      alert(
        "Incident updated successfully!"
      );
    } catch (error) {
      console.error(
        "Update incident error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  /* =========================
     DELETE INCIDENT
     ========================= */

  const deleteIncident = async (
    id
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this incident?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete incident failed:",
          errorText
        );

        alert(
          "Failed to delete incident."
        );

        return;
      }

      setSelectedIncident(null);

      setComments([]);

      setResolutions([]);

      setAttachments([]);

      attachmentRequestIdRef.current += 1;

      setSelectedFile(null);

      setAttachmentMessage("");
      setAttachmentMessageType("");
      setAttachmentsLoading(false);

      if (attachmentFileInputRef.current) {
        attachmentFileInputRef.current.value = "";
      }

      await loadIncidents(token);

      alert(
        "Incident deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete incident error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  };

  /* =========================
     ASSIGN INCIDENT
     ========================= */

  const assignIncident = async () => {
    if (!selectedIncident) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    if (!assigneeInput.trim()) {
      alert("Please enter an assignee.");
      return;
    }

    setAssigningIncident(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/incidents/${selectedIncident.id}/assign?assignee=${encodeURIComponent(
          assigneeInput.trim()
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Assign incident failed:",
          errorText
        );

        alert(
          "Failed to assign incident."
        );

        return;
      }

      const updated =
        await response.json();

      setSelectedIncident(updated);

      await loadIncidents(token);

      alert(
        "Incident assigned successfully!"
      );
    } catch (error) {
      console.error(
        "Assign incident error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setAssigningIncident(false);
    }
  };

  /* =========================
     LOAD COMMENTS
     ========================= */

  const loadComments = async (
    incidentId
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token || !incidentId) {
      return;
    }

    setCommentsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/comments/incident/${incidentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to load comments:",
          errorText
        );

        setComments([]);

        return;
      }

      const data =
        await response.json();

      setComments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Comment loading error:",
        error
      );

      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  /* =========================
     ADD COMMENT
     ========================= */

  const addComment = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedIncident) {
      return;
    }

    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    setCommentLoading(true);

    try {
      const userEmail =
        localStorage.getItem(
          "userEmail"
        ) ||
        email.trim().toLowerCase() ||
        selectedIncident.reporter ||
        "unknown@example.com";

      const commentData = {
        incidentId:
          selectedIncident.id,

        userEmail:
          userEmail,

        comment:
          newComment.trim(),

        createdAt:
          new Date().toLocaleString(),
      };

      const response = await fetch(
        "http://localhost:8080/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            commentData
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Add comment failed:",
          errorText
        );

        alert(
          "Failed to add comment."
        );

        return;
      }

      setNewComment("");

      await loadComments(
        selectedIncident.id
      );

      alert(
        "Comment added successfully!"
      );
    } catch (error) {
      console.error(
        "Add comment error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setCommentLoading(false);
    }
  };

  /* =========================
     DELETE COMMENT
     ========================= */

  const deleteComment = async (
    commentId
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete comment failed:",
          errorText
        );

        alert(
          "Failed to delete comment."
        );

        return;
      }

      await loadComments(
        selectedIncident.id
      );

      alert(
        "Comment deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  };

  /* =========================
     LOAD RESOLUTIONS
     ========================= */

  const loadResolutions = async (
    incidentId
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token || !incidentId) {
      return;
    }

    setResolutionsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/resolutions/incident/${incidentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to load resolutions:",
          errorText
        );

        setResolutions([]);

        return;
      }

      const data =
        await response.json();

      setResolutions(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Resolution loading error:",
        error
      );

      setResolutions([]);
    } finally {
      setResolutionsLoading(false);
    }
  };

  /* =========================
     ADD RESOLUTION
     ========================= */

  const addResolution = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedIncident) {
      return;
    }

    if (!newResolution.trim()) {
      alert(
        "Please enter the resolution."
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    setResolutionLoading(true);

    try {
      const resolvedBy =
        localStorage.getItem(
          "userEmail"
        ) ||
        email.trim().toLowerCase() ||
        selectedIncident.assignee ||
        selectedIncident.reporter ||
        "unknown@example.com";

      const resolutionData = {
        incidentId:
          selectedIncident.id,

        resolvedBy:
          resolvedBy,

        resolution:
          newResolution.trim(),

        resolvedAt:
          new Date().toLocaleString(),
      };

      const response = await fetch(
        "http://localhost:8080/api/resolutions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            resolutionData
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Add resolution failed:",
          errorText
        );

        alert(
          "Failed to add resolution."
        );

        return;
      }

      setNewResolution("");

      await loadResolutions(
        selectedIncident.id
      );

      alert(
        "Resolution added successfully!"
      );
    } catch (error) {
      console.error(
        "Resolution error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setResolutionLoading(false);
    }
  };

  /* =========================
     DELETE RESOLUTION
     ========================= */

  const deleteResolution = async (
    resolutionId
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this resolution?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/resolutions/${resolutionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete resolution failed:",
          errorText
        );

        alert(
          "Failed to delete resolution."
        );

        return;
      }

      await loadResolutions(
        selectedIncident.id
      );

      alert(
        "Resolution deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete resolution error:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  };

  /* =========================
     LOAD ATTACHMENTS
     ========================= */

  const loadAttachments = async (
    incidentId
  ) => {
    const requestId =
      ++attachmentRequestIdRef.current;

    const token =
      localStorage.getItem("token");

    if (!token || !incidentId) {
      setAttachments([]);
      setAttachmentsLoading(false);
      return false;
    }

    setAttachmentsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/attachments/incident/${incidentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        requestId !==
        attachmentRequestIdRef.current
      ) {
        return false;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to load attachments:",
          errorText
        );

        setAttachments([]);
        setAttachmentMessage(
          "Unable to load attachments. Please try again."
        );
        setAttachmentMessageType("error");

        return false;
      }

      const data =
        await response.json();

      if (
        requestId !==
        attachmentRequestIdRef.current
      ) {
        return false;
      }

      setAttachments(
        Array.isArray(data)
          ? data
          : []
      );

      setAttachmentMessage("");
      setAttachmentMessageType("");
      setAttachmentsLoading(false);
      return true;
    } catch (error) {
      if (
        requestId !==
        attachmentRequestIdRef.current
      ) {
        return false;
      }

      console.error(
        "Attachment loading error:",
        error
      );

      setAttachments([]);
      setAttachmentMessage(
        "Unable to connect to the backend while loading attachments."
      );
      setAttachmentMessageType("error");
      return false;
    } finally {
      if (
        requestId ===
        attachmentRequestIdRef.current
      ) {
        setAttachmentsLoading(false);
      }
    }
  };

  /* =========================
     UPLOAD ATTACHMENT
     ========================= */

  const uploadAttachment = async (event) => {
    event.preventDefault();

    if (!selectedIncident) {
      setAttachmentMessage(
        "Select an incident before uploading an attachment."
      );
      setAttachmentMessageType("error");
      return;
    }

    if (!selectedFile) {
      setAttachmentMessage(
        "Choose a file before uploading."
      );
      setAttachmentMessageType("error");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setAttachmentMessage(
        "Please login again before uploading an attachment."
      );
      setAttachmentMessageType("error");
      return;
    }

    setAttachmentUploading(true);
    setAttachmentMessage("");
    setAttachmentMessageType("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(
        "http://localhost:8080/api/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadResult =
        await uploadResponse.text();

      if (
        !uploadResponse.ok ||
        !uploadResult.startsWith(
          "File uploaded successfully:"
        )
      ) {
        console.error(
          "Physical file upload failed:",
          uploadResult
        );

        setAttachmentMessage(
          uploadResult ||
            "Failed to upload the file."
        );
        setAttachmentMessageType("error");
        return;
      }

      const attachmentData = {
        incidentId: selectedIncident.id,
        fileName: selectedFile.name,
        fileType:
          selectedFile.type ||
          "application/octet-stream",
        filePath: `uploads/${selectedFile.name}`,
        uploadedBy:
          localStorage.getItem("userEmail") ||
          "unknown@example.com",
      };

      const metadataResponse = await fetch(
        "http://localhost:8080/api/attachments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(attachmentData),
        }
      );

      if (!metadataResponse.ok) {
        const errorText =
          await metadataResponse.text();

        console.error(
          "Saving attachment metadata failed:",
          errorText
        );

        setAttachmentMessage(
          "The file was uploaded, but saving its attachment details failed."
        );
        setAttachmentMessageType("error");
        return;
      }

      setSelectedFile(null);

      if (attachmentFileInputRef.current) {
        attachmentFileInputRef.current.value = "";
      }

      const refreshed =
        await loadAttachments(selectedIncident.id);

      if (refreshed) {
        setAttachmentMessage(
          "Attachment uploaded successfully."
        );
        setAttachmentMessageType("success");
      }
    } catch (error) {
      console.error(
        "Attachment upload error:",
        error
      );

      setAttachmentMessage(
        "Unable to connect to the backend while uploading the attachment."
      );
      setAttachmentMessageType("error");
    } finally {
      setAttachmentUploading(false);
    }
  };

  /* =========================
     DELETE ATTACHMENT
     ========================= */

  const deleteAttachment = async (
    attachmentId
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setAttachmentMessage(
        "Please login again before deleting an attachment."
      );
      setAttachmentMessageType("error");
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this attachment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete attachment failed:",
          errorText
        );

        setAttachmentMessage(
          "Failed to delete the attachment."
        );
        setAttachmentMessageType("error");
        return;
      }

      const refreshed = await loadAttachments(
        selectedIncident.id
      );

      if (refreshed) {
        setAttachmentMessage(
          "Attachment deleted successfully."
        );
        setAttachmentMessageType("success");
      }
    } catch (error) {
      console.error(
        "Delete attachment error:",
        error
      );

      setAttachmentMessage(
        "Unable to connect to the backend while deleting the attachment."
      );
      setAttachmentMessageType("error");
    }
  };

  /* =========================
     LOGOUT
     ========================= */

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem(
      "userEmail"
    );

    setLoggedIn(false);

    setIncidents([]);
    setAnalytics({
      totalIncidents: 0,
      openIncidents: 0,
      inProgressIncidents: 0,
      resolvedIncidents: 0,
      criticalIncidents: 0,
      statusCounts: {},
      priorityCounts: {},
      severityCounts: {},
    });
    setAnalyticsError("");

    setSelectedIncident(null);

    setShowCreateForm(false);

    setComments([]);

    setResolutions([]);

    setAttachments([]);

    attachmentRequestIdRef.current += 1;

    setSelectedFile(null);

    setAttachmentMessage("");
    setAttachmentMessageType("");
    setAttachmentsLoading(false);
    setAttachmentUploading(false);

    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = "";
    }

    setNewComment("");

    setNewResolution("");

    setEditingIncident(false);
  };

  /* =========================
     CHECK SAVED LOGIN
     ========================= */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (token) {
      setLoggedIn(true);

      loadIncidents(token);
      loadAnalytics();
    }
  }, []);

  /* =========================
     SCROLL TO DETAILS
     ========================= */

  useEffect(() => {
    if (
      selectedIncident &&
      !detailsLoading
    ) {
      incidentDetailsRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );
    }
  }, [
    selectedIncident,
    detailsLoading,
  ]);

  /* =========================
     DASHBOARD
     ========================= */

  if (loggedIn) {
    return (
      <div
        className={`operations-dashboard${selectedIncident ? " incident-command-mode" : ""}`}
        style={styles.dashboard}
      >

        <aside className="operations-sidebar">
          <a
            className="operations-sidebar-brand"
            href="#overview"
            onClick={() => {
              setActiveNav("overview");
              setSelectedIncident(null);
              setEditingIncident(false);
            }}
          >
            <span className="operations-logo">IQ</span>
            <span>
              <strong>IncidentIQ</strong>
              <small>Incident Intelligence</small>
            </span>
          </a>

          <div className="operations-sidebar-label">WORKSPACE</div>
          <nav className="operations-sidebar-nav" aria-label="Workspace navigation">
            <a
              className={activeNav === "overview" ? "active" : ""}
              href="#overview"
              onClick={() => {
                setActiveNav("overview");
                setSelectedIncident(null);
                setEditingIncident(false);
              }}
            >
              <span className="operations-nav-mark">◫</span>
              Overview
            </a>
            <a
              className={activeNav === "incidents" ? "active" : ""}
              href="#incidents"
              onClick={() => {
                setActiveNav("incidents");
                setSelectedIncident(null);
                setEditingIncident(false);
              }}
            >
              <span className="operations-nav-mark">◈</span>
              Incidents
              <span className="operations-sidebar-count">
                {incidentPage.totalElements}
              </span>
            </a>
            <a
              className={activeNav === "analytics" ? "active" : ""}
              href="#analytics"
              onClick={() => {
                setActiveNav("analytics");
                setSelectedIncident(null);
                setEditingIncident(false);
              }}
            >
              <span className="operations-nav-mark">▥</span>
              Analytics
            </a>
          </nav>

          <div className="operations-sidebar-spacer" />
          <div className="operations-sidebar-label">ACCOUNT</div>
          <div className="operations-sidebar-profile">
            <span className="operations-avatar">
              {(localStorage.getItem("userEmail") || "A").slice(0, 1).toUpperCase()}
            </span>
            <span className="operations-profile-copy">
              <strong>Signed in</strong>
              <small>{localStorage.getItem("userEmail") || "Account"}</small>
            </span>
          </div>
        </aside>

        {/* =========================
            NAVBAR
            ========================= */}

        <header className="operations-navbar" style={styles.navbar}>

          <div className="operations-topbar-context">
            <span className="operations-topbar-kicker">INCIDENT COMMAND CENTER</span>
            <strong>
              {selectedIncident
                ? `Incident #${selectedIncident.id}`
                : activeNav === "incidents"
                  ? "Incident register"
                  : activeNav === "analytics"
                    ? "Operational analytics"
                    : "Incident Operations"}
            </strong>
          </div>

          <div className="operations-account">
            {activeNav === "incidents" && (
              <span className="operations-topbar-incident-count">
                <strong>{incidentPage.totalElements}</strong>
                <span>incidents</span>
              </span>
            )}
            <div className="operations-account-copy">
              <span className="operations-account-label">ON DUTY</span>
              <span className="operations-account-email">
                {localStorage.getItem("userEmail") || "Account"}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>

        </header>


        {/* =========================
            MAIN
            ========================= */}

        <main style={styles.main}>
          <div className={`dashboard-content${activeNav === "incidents" ? " incident-list-page" : ""}`}>

          {/* HEADER */}

          <div
            id="overview"
            className={`operations-page-header${activeNav === "incidents" ? " incident-list-page-header" : ""}`}
            style={styles.headerRow}
          >

            <div>

              <div className="operations-eyebrow" style={styles.pageLabel}>
                {activeNav === "incidents"
                  ? "INCIDENT COMMAND CENTER"
                  : "OPERATIONS OVERVIEW"}
              </div>

              <h1 className="operations-title" style={styles.title}>
                {activeNav === "incidents" ? "Incidents" : "Incident Operations"}
              </h1>

              <p className="operations-subtitle" style={styles.subtitle}>
                {activeNav === "incidents"
                  ? "Monitor, investigate and manage operational incidents."
                  : "A clear view of active risk, operational workload, and incident outcomes."}
              </p>

            </div>

            <button
              className="operations-primary-button"
              style={styles.createButton}
              onClick={() =>
                setShowCreateForm(true)
              }
            >
              + Create Incident
            </button>

          </div>


          {/* =========================
              CREATE FORM
              ========================= */}

          {showCreateForm && (

            <section
              style={styles.createSection}
            >

              <div style={styles.formHeader}>

                <div>

                  <h2 style={styles.sectionTitle}>
                    Create Incident
                  </h2>

                  <p style={styles.sectionSubtitle}>
                    Add a new incident to IncidentIQ.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateForm(false)
                  }
                  style={styles.closeButton}
                >
                  ✕
                </button>

              </div>


              <form
                onSubmit={createIncident}
              >

                <label style={styles.label}>
                  Title
                </label>

                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      title: e.target.value,
                    })
                  }
                  required
                  style={styles.input}
                  placeholder="Enter incident title"
                />


                <label style={styles.label}>
                  Description
                </label>

                <textarea
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      description:
                        e.target.value,
                    })
                  }
                  required
                  maxLength={2000}
                  style={styles.textarea}
                  placeholder="Describe the incident"
                />


                <label style={styles.label}>
                  Category
                </label>

                <input
                  type="text"
                  value={newIncident.category}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      category:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="Example: Database"
                />


                <label style={styles.label}>
                  Priority
                </label>

                <select
                  value={newIncident.priority}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      priority:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                >

                  <option value="LOW">
                    LOW
                  </option>

                  <option value="MEDIUM">
                    MEDIUM
                  </option>

                  <option value="HIGH">
                    HIGH
                  </option>

                  <option value="CRITICAL">
                    CRITICAL
                  </option>

                </select>


                <label style={styles.label}>
                  Severity
                </label>

                <select
                  value={newIncident.severity}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      severity:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                >

                  <option value="LOW">
                    LOW
                  </option>

                  <option value="MEDIUM">
                    MEDIUM
                  </option>

                  <option value="HIGH">
                    HIGH
                  </option>

                  <option value="CRITICAL">
                    CRITICAL
                  </option>

                </select>


                <label style={styles.label}>
                  Status
                </label>

                <select
                  value={newIncident.status}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      status:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                >

                  <option value="OPEN">
                    OPEN
                  </option>

                  <option value="IN_PROGRESS">
                    IN_PROGRESS
                  </option>

                  <option value="RESOLVED">
                    RESOLVED
                  </option>

                  <option value="CLOSED">
                    CLOSED
                  </option>

                </select>


                <label style={styles.label}>
                  Reporter
                </label>

                <input
                  type="email"
                  value={newIncident.reporter}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      reporter:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                />


                <label style={styles.label}>
                  Assignee
                </label>

                <input
                  type="text"
                  value={newIncident.assignee}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      assignee:
                        e.target.value,
                    })
                  }
                  style={styles.input}
                  placeholder="Enter assignee"
                />


                <div style={styles.formButtons}>

                  <button
                    type="submit"
                    style={styles.createButton}
                  >
                    Create Incident
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateForm(false)
                    }
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </section>

          )}


          {/* =========================
              STATISTICS
              ========================= */}

          <div className="operations-kpis" style={styles.statsGrid}>
            <div className="operations-kpi total" style={styles.statCard}>
              <div className="operations-kpi-label" style={styles.statLabel}>TOTAL INCIDENTS</div>
              <div className="operations-kpi-number" style={styles.statNumber}>
                {analytics.totalIncidents}
              </div>
              <div className="operations-kpi-description" style={styles.statDescription}>
                All recorded incidents
              </div>
            </div>

            <div className="operations-kpi open" style={styles.statCard}>
              <div className="operations-kpi-label" style={styles.statLabel}>OPEN</div>
              <div className="operations-kpi-number" style={styles.statNumber}>
                {analytics.openIncidents}
              </div>
              <div className="operations-kpi-description" style={styles.statDescription}>
                Currently requiring attention
              </div>
            </div>

            <div className="operations-kpi progress" style={styles.statCard}>
              <div className="operations-kpi-label" style={styles.statLabel}>IN PROGRESS</div>
              <div className="operations-kpi-number" style={styles.statNumber}>
                {analytics.inProgressIncidents}
              </div>
              <div className="operations-kpi-description" style={styles.statDescription}>
                Incidents being investigated
              </div>
            </div>

            <div className="operations-kpi resolved" style={styles.statCard}>
              <div className="operations-kpi-label" style={styles.statLabel}>RESOLVED</div>
              <div className="operations-kpi-number" style={styles.statNumber}>
                {analytics.resolvedIncidents}
              </div>
              <div className="operations-kpi-description" style={styles.statDescription}>
                Incidents that are resolved
              </div>
            </div>

            <div className="operations-kpi critical" style={styles.statCard}>
              <div className="operations-kpi-label" style={styles.statLabel}>CRITICAL</div>
              <div className="operations-kpi-number" style={styles.statNumber}>
                {analytics.criticalIncidents}
              </div>
              <div className="operations-kpi-description" style={styles.statDescription}>
                Critical incidents
              </div>
            </div>
          </div>

          <section id="analytics" className="operations-analytics" style={styles.analyticsSection}>
            <div className="operations-section-heading" style={styles.sectionHeader}>
              <div>
                <h2 className="operations-section-title" style={styles.sectionTitle}>Operational Distribution</h2>
                <p className="operations-section-subtitle" style={styles.sectionSubtitle}>
                  Incident distribution by status, priority, and severity.
                </p>
              </div>
            </div>

            {analyticsLoading && (
              <div style={styles.analyticsMessage}>
                Loading analytics...
              </div>
            )}

            {analyticsError && (
              <div style={styles.analyticsError}>
                {analyticsError}
              </div>
            )}

            <div className="operations-breakdown-grid" style={styles.breakdownGrid}>
              {[
                ["STATUS BREAKDOWN", analytics.statusCounts],
                ["PRIORITY BREAKDOWN", analytics.priorityCounts],
                ["SEVERITY BREAKDOWN", analytics.severityCounts],
              ].map(([title, counts]) => (
                <div className="operations-breakdown-card" key={title} style={styles.breakdownCard}>
                  <h3 className="operations-breakdown-title" style={styles.breakdownTitle}>{title}</h3>
                  {Object.entries(counts).length > 0 ? (
                    Object.entries(counts).map(([label, count]) => {
                      const total = Object.values(counts).reduce(
                        (sum, value) => sum + value,
                        0
                      );
                      const share = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div className="operations-breakdown-row" key={label} style={styles.breakdownRow}>
                          <span className="operations-breakdown-label">{label}</span>
                          <span className="operations-breakdown-count">{count}</span>
                          <span className="operations-breakdown-track" aria-hidden="true">
                            <span style={{ width: `${share}%` }} />
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={styles.breakdownEmpty}>
                      No data available.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>


          {/* =========================
              INCIDENT TABLE
              ========================= */}

          <section
            id="incidents"
            className="operations-incidents"
            style={styles.incidentSection}
          >

            <div className="operations-section-heading operations-incidents-heading">
              {activeNav === "incidents" ? (
                <div className="operations-register-title">
                  <h2 className="operations-section-title">Incident register</h2>
                  <p className="operations-section-subtitle">
                    {incidentPage.totalElements} incidents
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="operations-section-title">Active Incidents</h2>
                  <p className="operations-section-subtitle">
                    {incidentPage.totalElements} incidents in the operational register
                  </p>
                </div>
              )}
              <div className="operations-incidents-heading-actions">
                {activeNav !== "incidents" && (
                  <>
                    <span className="operations-incidents-total">
                      <strong>{incidentPage.totalElements}</strong>
                      <span>Total incidents</span>
                    </span>
                    <button
                      type="button"
                      className="operations-primary-button"
                      onClick={() => setShowCreateForm(true)}
                    >
                      + Create Incident
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="operations-neutral-button"
                  onClick={() => {
                    loadIncidents();
                    loadAnalytics();
                  }}
                  disabled={incidentLoading || analyticsLoading}
                >
                  Refresh
                </button>
              </div>
            </div>

            <form
              onSubmit={applyIncidentFilters}
              style={styles.filterForm}
            >
              <label style={styles.filterField}>
                <span style={styles.label}>
                  {activeNav === "incidents" ? "Search incidents" : "Search"}
                </span>
                <input
                  type="search"
                  value={searchTitle}
                  onChange={(event) =>
                    setSearchTitle(event.target.value)
                  }
                  style={styles.input}
                  placeholder={
                    activeNav === "incidents"
                      ? "Search by title"
                      : "Search incidents"
                  }
                />
              </label>

              <div className="operations-filter-selects" style={styles.filterSelects}>
                <label style={styles.filterField}>
                  <span style={styles.label}>
                    Status
                  </span>
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value)
                    }
                    style={styles.input}
                  >
                    <option value="">All</option>
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">
                      IN_PROGRESS
                    </option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </label>

                <label style={styles.filterField}>
                  <span style={styles.label}>
                    Priority
                  </span>
                  <select
                    value={selectedPriority}
                    onChange={(event) =>
                      setSelectedPriority(event.target.value)
                    }
                    style={styles.input}
                  >
                    <option value="">All</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </label>

                <label style={styles.filterField}>
                  <span style={styles.label}>
                    Severity
                  </span>
                  <select
                    value={selectedSeverity}
                    onChange={(event) =>
                      setSelectedSeverity(event.target.value)
                    }
                    style={styles.input}
                  >
                    <option value="">All</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </label>
              </div>

              <div style={styles.filterActions}>
                <button
                  type="submit"
                  className="operations-primary-button"
                  style={styles.createButton}
                  disabled={incidentLoading}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  className="operations-neutral-button"
                  style={styles.secondaryButton}
                  onClick={clearIncidentFilters}
                  disabled={incidentLoading}
                >
                  Clear Filters
                </button>
              </div>
            </form>

            {incidentLoading ? (

              activeNav === "incidents" ? (
                <div className="operations-incidents-state" role="status">
                  <span className="operations-incidents-spinner" aria-hidden="true" />
                  Loading incidents...
                </div>
              ) : (
                <div style={styles.emptyState}>Loading incidents...</div>
              )

            ) : incidentError ? (

              activeNav === "incidents" ? (
                <div
                  role="alert"
                  className="operations-incidents-state operations-incidents-error"
                >
                  {incidentError}
                </div>
              ) : (
                <div role="alert" style={styles.incidentError}>
                  {incidentError}
                </div>
              )

            ) : incidents.length === 0 ? (

              activeNav === "incidents" ? (
                <div className="operations-incidents-state operations-incidents-empty">
                  <span className="operations-incidents-empty-mark" aria-hidden="true">—</span>
                  <h3>
                    {activeIncidentFilters.title ||
                      activeIncidentFilters.status ||
                      activeIncidentFilters.priority ||
                      activeIncidentFilters.severity
                      ? "No incidents match your current filters."
                      : "No incidents found"}
                  </h3>
                  <p>
                    {activeIncidentFilters.title ||
                      activeIncidentFilters.status ||
                      activeIncidentFilters.priority ||
                      activeIncidentFilters.severity
                      ? "Adjust your search or filters, or clear them to see all incidents."
                      : "There are no incidents to display yet."}
                  </p>
                  {(activeIncidentFilters.title ||
                    activeIncidentFilters.status ||
                    activeIncidentFilters.priority ||
                    activeIncidentFilters.severity) && (
                    <button
                      type="button"
                      className="operations-neutral-button"
                      onClick={clearIncidentFilters}
                      disabled={incidentLoading}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>!</div>
                  <p>
                    {activeIncidentFilters.title ||
                      activeIncidentFilters.status ||
                      activeIncidentFilters.priority ||
                      activeIncidentFilters.severity
                      ? "No incidents match the current search and filters."
                      : "No incidents found."}
                  </p>
                </div>
              )

            ) : (

              <div className="operations-table-wrapper" style={styles.tableWrapper}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>
                        ID
                      </th>

                      <th style={styles.th}>
                        INCIDENT
                      </th>

                      <th style={styles.th}>
                        PRIORITY
                      </th>

                      <th style={styles.th}>
                        SEVERITY
                      </th>

                      <th style={styles.th}>
                        STATUS
                      </th>

                      <th style={styles.th}>
                        ASSIGNEE
                      </th>

                      <th style={styles.th}>
                        UPDATED
                      </th>

                      <th style={styles.th}>
                        ACTION
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {incidents.map(
                      (incident) => (

                        <tr
                          key={incident.id}
                        >

                          <td style={styles.td} data-label="ID">
                            <span className="operations-incident-id">#{incident.id}</span>
                          </td>

                          <td style={styles.td} data-label="Incident">
                            <div className="operations-incident-cell">
                              <strong>{incident.title}</strong>
                              {activeNav === "incidents" && incident.description ? (
                                <span className="operations-incident-preview">
                                  {incident.description}
                                </span>
                              ) : activeNav !== "incidents" ? (
                                <span>Incident #{incident.id}</span>
                              ) : null}
                            </div>
                          </td>

                          <td style={styles.td} data-label="Priority">

                            <span
                              className={`operations-priority priority-${(incident.priority || "unknown").toLowerCase()}`}
                              style={{
                                ...styles.badge,
                                ...getPriorityStyle(
                                  incident.priority
                                ),
                              }}
                            >
                              {incident.priority ||
                                "-"}
                            </span>

                          </td>

                          <td style={styles.td} data-label="Severity">
                            {activeNav === "incidents" ? (
                              <span
                                className={`operations-severity severity-${(incident.severity || "unknown").toLowerCase()}`}
                              >
                                {incident.severity || "-"}
                              </span>
                            ) : (
                              incident.severity || "-"
                            )}
                          </td>

                          <td style={styles.td} data-label="Status">

                            <span
                              className={`operations-status status-${(incident.status || "unknown").toLowerCase()}`}
                              style={
                                styles.statusBadge
                              }
                            >
                              {incident.status ||
                                "-"}
                            </span>

                          </td>

                          <td style={styles.td} data-label="Assignee">
                            {activeNav !== "incidents" ? (
                              incident.assignee || "-"
                            ) : incident.assignee ? (
                              <span className="operations-incident-assignee">
                                {incident.assignee}
                              </span>
                            ) : (
                              <span className="operations-unassigned">Unassigned</span>
                            )}
                          </td>

                          <td style={styles.td} data-label="Updated">
                            {activeNav === "incidents"
                              ? incident.updatedAt || "-"
                              : incident.updatedAt || incident.createdAt || "-"}
                          </td>

                          <td style={styles.td} data-label="Action">

                            <button
                              className="operations-view-button"
                              style={
                                styles.detailsButton
                              }
                              onClick={() =>
                                loadIncidentDetails(
                                  incident.id
                                )
                              }
                            >
                              View Details
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

            <div
              className="operations-pagination"
              style={activeNav === "incidents" ? undefined : styles.pagination}
            >
              <button
                className="operations-neutral-button"
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  loadIncidents(
                    localStorage.getItem("token"),
                    activeIncidentFilters,
                    incidentPage.number - 1
                  )
                }
                disabled={
                  incidentLoading ||
                  incidentPage.first ||
                  incidentPage.number <= 0
                }
              >
                Previous
              </button>

              <span style={styles.paginationLabel}>
                Page{" "}
                {incidentPage.totalPages === 0
                  ? 0
                  : incidentPage.number + 1}{" "}
                of {incidentPage.totalPages}
              </span>

              <button
                className="operations-neutral-button"
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  loadIncidents(
                    localStorage.getItem("token"),
                    activeIncidentFilters,
                    incidentPage.number + 1
                  )
                }
                disabled={
                  incidentLoading ||
                  incidentPage.last ||
                  incidentPage.totalPages === 0
                }
              >
                Next
              </button>
            </div>

          </section>

          </div>


          {/* =========================
              INCIDENT DETAILS
              ========================= */}

          {detailsLoading && (

            <section
              style={styles.detailsSection}
            >

              <div style={styles.emptyState}>
                Loading incident details...
              </div>

            </section>

          )}


          {selectedIncident &&
            !detailsLoading && (

              <section
                ref={incidentDetailsRef}
                className="incident-details-layout"
                style={styles.detailsSection}
              >

                {/* DETAILS HEADER */}

                <div
                  className="incident-details-header"
                  style={styles.detailsHeader}
                >

                  <div>

                    <button
                      type="button"
                      className="incident-back-button"
                      onClick={() => {
                        setSelectedIncident(null);
                        setEditingIncident(false);
                        setActiveNav("incidents");
                      }}
                    >
                      ← Back to Incidents
                    </button>

                    <div
                      className="operations-eyebrow"
                      style={
                        styles.pageLabel
                      }
                    >
                      INCIDENT DETAILS
                    </div>

                    <h2
                      style={styles.detailsTitle}
                    >
                      {selectedIncident.title}
                    </h2>

                    <p className="incident-header-id">
                      INC-{selectedIncident.id}
                    </p>

                    <div className="incident-header-badges">
                      <span
                        className={`operations-status status-${(selectedIncident.status || "unknown").toLowerCase()}`}
                      >
                        {selectedIncident.status || "-"}
                      </span>
                      <span
                        className={`operations-priority priority-${(selectedIncident.priority || "unknown").toLowerCase()}`}
                      >
                        Priority · {selectedIncident.priority || "-"}
                      </span>
                      <span
                        className={`incident-severity-badge severity-${(selectedIncident.severity || "unknown").toLowerCase()}`}
                      >
                        Severity · {selectedIncident.severity || "-"}
                      </span>
                    </div>

                    <p className="incident-header-description">
                      {selectedIncident.description || "No description provided."}
                    </p>

                  </div>


                  <div
                    className="detailHeaderButtons"
                    style={
                      styles.detailHeaderButtons
                    }
                  >

                    <button
                      style={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        setEditingIncident(
                          !editingIncident
                        )
                      }
                    >
                      {editingIncident
                        ? "Cancel Edit"
                        : "Edit Incident"}
                    </button>

                    <button
                      style={
                        styles.dangerButton
                      }
                      onClick={() =>
                        deleteIncident(
                          selectedIncident.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>


                {/* =========================
                    EDIT FORM
                    ========================= */}

                {editingIncident ? (

                  <form
                    className="incident-edit-form"
                    onSubmit={
                      updateIncident
                    }
                    style={
                      styles.editForm
                    }
                  >

                    <label style={styles.label}>
                      Title
                    </label>

                    <input
                      value={
                        selectedIncident.title ||
                        ""
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          title:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                      required
                    />


                    <label style={styles.label}>
                      Description
                    </label>

                    <textarea
                      value={
                        selectedIncident.description ||
                        ""
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          description:
                            e.target.value,
                        })
                      }
                      style={styles.textarea}
                      maxLength={2000}
                      required
                    />


                    <label style={styles.label}>
                      Category
                    </label>

                    <input
                      value={
                        selectedIncident.category ||
                        ""
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          category:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    />


                    <label style={styles.label}>
                      Priority
                    </label>

                    <select
                      value={
                        selectedIncident.priority ||
                        "MEDIUM"
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          priority:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    >

                      <option value="LOW">
                        LOW
                      </option>

                      <option value="MEDIUM">
                        MEDIUM
                      </option>

                      <option value="HIGH">
                        HIGH
                      </option>

                      <option value="CRITICAL">
                        CRITICAL
                      </option>

                    </select>


                    <label style={styles.label}>
                      Severity
                    </label>

                    <select
                      value={
                        selectedIncident.severity ||
                        "MEDIUM"
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          severity:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    >

                      <option value="LOW">
                        LOW
                      </option>

                      <option value="MEDIUM">
                        MEDIUM
                      </option>

                      <option value="HIGH">
                        HIGH
                      </option>

                      <option value="CRITICAL">
                        CRITICAL
                      </option>

                    </select>


                    <label style={styles.label}>
                      Status
                    </label>

                    <select
                      value={
                        selectedIncident.status ||
                        "OPEN"
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          status:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    >

                      <option value="OPEN">
                        OPEN
                      </option>

                      <option value="IN_PROGRESS">
                        IN_PROGRESS
                      </option>

                      <option value="RESOLVED">
                        RESOLVED
                      </option>

                      <option value="CLOSED">
                        CLOSED
                      </option>

                    </select>


                    <label style={styles.label}>
                      Reporter
                    </label>

                    <input
                      value={
                        selectedIncident.reporter ||
                        ""
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          reporter:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    />


                    <label style={styles.label}>
                      Assignee
                    </label>

                    <input
                      value={
                        selectedIncident.assignee ||
                        ""
                      }
                      onChange={(e) =>
                        setSelectedIncident({
                          ...selectedIncident,
                          assignee:
                            e.target.value,
                        })
                      }
                      style={styles.input}
                    />


                    <button
                      type="submit"
                      style={
                        styles.createButton
                      }
                      disabled={
                        updateLoading
                      }
                    >
                      {updateLoading
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                  </form>

                ) : (

                  <div
                    className="incident-workspace-grid"
                    data-active-section={activeIncidentSection}
                  >
                    <div
                      className="incident-workspace-content"
                      role="region"
                      aria-label={`${activeIncidentSection} incident details`}
                    >
                    {/* =========================
                        INCIDENT INFORMATION
                        ========================= */}

                    <section className="incident-overview-card">
                      <h3 className="incident-card-title">Incident Overview</h3>
                      <div
                        className="incident-description"
                        style={
                          styles.descriptionBox
                        }
                      >

                      <div
                        style={
                          styles.detailLabel
                        }
                      >
                        DESCRIPTION
                        </div>

                      <p
                        style={
                          styles.descriptionText
                        }
                      >
                        {selectedIncident.description ||
                          "-"}
                      </p>

                    </div>


                    <div
                      className="incident-metadata-grid"
                      style={
                        styles.detailsGrid
                      }
                    >

                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          CATEGORY
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.category ||
                            "-"}
                        </p>

                      </div>


                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          PRIORITY
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.priority ||
                            "-"}
                        </p>

                      </div>


                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          SEVERITY
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.severity ||
                            "-"}
                        </p>

                      </div>


                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          STATUS
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.status ||
                            "-"}
                        </p>

                      </div>


                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          REPORTER
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.reporter ||
                            "-"}
                        </p>

                      </div>


                      <div
                        style={
                          styles.detailItem
                        }
                      >

                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          ASSIGNEE
                        </span>

                        <p
                          style={
                            styles.detailValue
                          }
                        >
                          {selectedIncident.assignee ||
                            "-"}
                        </p>

                      </div>

                      <div
                        style={
                          styles.detailItem
                        }
                      >
                        <span style={styles.detailLabel}>CREATED</span>
                        <p style={styles.detailValue}>
                          {selectedIncident.createdAt || "-"}
                        </p>
                      </div>

                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>LAST UPDATED</span>
                        <p style={styles.detailValue}>
                          {selectedIncident.updatedAt || "-"}
                        </p>
                      </div>

                    </div>
                    </section>

                    <section className="incident-next-action">
                      <div>
                        <span className="incident-sidebar-label">
                          NEXT ACTION
                        </span>
                        <h3>Run Incident Intelligence</h3>
                        <p>
                          Generate a diagnosis, review related incidents, and get
                          recommended troubleshooting steps.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="incident-primary-action"
                        onClick={() => setActiveIncidentSection("intelligence")}
                      >
                        Open Incident Intelligence
                      </button>
                    </section>

                    <section className="incident-lifecycle-card" style={styles.aiAnalysisSection}>
                      <h3 style={styles.commentFormTitle}>
                        Incident Lifecycle
                      </h3>
                      <ol className="incident-lifecycle-rail">
                        {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(
                          (stage, index) => {
                            const stageOrder = {
                              OPEN: 0,
                              IN_PROGRESS: 1,
                              RESOLVED: 2,
                              CLOSED: 3,
                            };
                            const currentStage =
                              stageOrder[selectedIncident.status] ?? -1;
                            return (
                              <li
                                key={stage}
                                className={
                                  index === currentStage
                                    ? "current"
                                    : index < currentStage
                                      ? "complete"
                                      : ""
                                }
                              >
                                <span>{index + 1}</span>
                                <small>{stage.replace("_", " ")}</small>
                              </li>
                            );
                          }
                        )}
                      </ol>
                      <p style={styles.sectionSubtitle}>
                        Current status: <strong>{selectedIncident.status || "-"}</strong>
                      </p>
                      <div className="lifecycleActions" style={styles.lifecycleActions}>
                        {getAvailableStatusTransitions(
                          selectedIncident.status
                        ).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateIncidentStatus(status)}
                            style={styles.secondaryButton}
                            disabled={statusUpdating}
                          >
                            {statusUpdating
                              ? "Updating..."
                              : status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                      {statusError && (
                        <p role="alert" style={styles.aiAnalysisError}>
                          {statusError}
                        </p>
                      )}
                    </section>

                    <section className="incident-audit-card" style={styles.aiAnalysisSection}>
                      <h3 style={styles.commentFormTitle}>
                        Incident Audit History
                      </h3>
                      {auditLoading && (
                        <p role="status" style={styles.aiAnalysisStatus}>
                          Loading audit history...
                        </p>
                      )}
                      {auditError && (
                        <p role="alert" style={styles.aiAnalysisError}>
                          {auditError}
                        </p>
                      )}
                      {!auditLoading &&
                        !auditError &&
                        auditHistory.length === 0 && (
                          <p style={styles.aiAnalysisStatus}>
                            No audit history is available.
                          </p>
                        )}
                      {auditHistory.length > 0 && (
                        <div className="aiAnalysisResult" style={styles.aiAnalysisResult}>
                          {[...auditHistory]
                            .sort(
                              (left, right) =>
                                new Date(left.changedAt).getTime() -
                                new Date(right.changedAt).getTime()
                            )
                            .map((entry) => {
                            const actionLabel =
                              entry.action === "CREATED"
                                ? "Created"
                                : `${entry.action
                                    .replace("_CHANGED", "")
                                    .toLowerCase()
                                    .replace(/^\w/, (letter) =>
                                      letter.toUpperCase()
                                    )} changed`;
                            return (
                              <div
                                key={entry.id}
                                className="auditHistoryEntry"
                                style={styles.auditHistoryEntry}
                              >
                                <strong>
                                  {new Date(entry.changedAt).toLocaleString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </strong>
                                <span>{actionLabel}</span>
                                <span>Changed by: {entry.changedBy}</span>
                                {entry.oldValue !== null &&
                                  entry.oldValue !== undefined && (
                                  <span>
                                    <b>Old value:</b> {entry.oldValue}
                                  </span>
                                )}
                                {entry.newValue !== null &&
                                  entry.newValue !== undefined && (
                                  <span>
                                    <b>New value:</b> {entry.newValue}
                                  </span>
                                )}
                              </div>
                            );
                            })}
                        </div>
                      )}
                    </section>

                    <section className="incident-analysis-card incident-intelligence-page">
                      <header className="incident-intelligence-header">
                        <div>
                          <span className="incident-intelligence-kicker">AI-ASSISTED INVESTIGATION</span>
                          <h3>Incident Intelligence</h3>
                          <p>
                            AI-assisted diagnosis, historical context and recommended response.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="incident-primary-action"
                          onClick={analyzeIncidentIntelligence}
                          disabled={
                            aiLoading ||
                            troubleshootingLoading ||
                            similarIncidentsLoading
                          }
                        >
                          {aiLoading ||
                          troubleshootingLoading ||
                          similarIncidentsLoading
                            ? "Analyzing..."
                            : "Analyze Incident"}
                        </button>
                      </header>

                      {!aiAnalysis &&
                        !aiError &&
                        !aiLoading &&
                        similarIncidents === null &&
                        !similarIncidentsError &&
                        !similarIncidentsLoading &&
                        !aiTroubleshooting &&
                        !troubleshootingError &&
                        !troubleshootingLoading && (
                          <div className="incident-intelligence-empty">
                            <span aria-hidden="true">01</span>
                            <p>
                              Analyze this incident to generate a diagnosis,
                              find similar incidents, and receive recommended
                              troubleshooting and resolution steps.
                            </p>
                          </div>
                        )}

                      {(aiLoading || similarIncidentsLoading || troubleshootingLoading) && (
                        <div className="incident-intelligence-progress" role="status">
                          {aiLoading && <span>Analyzing incident...</span>}
                          {similarIncidentsLoading && (
                            <span>Checking historical incidents...</span>
                          )}
                          {troubleshootingLoading && (
                            <span>Preparing recommended response...</span>
                          )}
                        </div>
                      )}

                      {(aiAnalysis ||
                        aiError ||
                        aiLoading ||
                        similarIncidents !== null ||
                        similarIncidentsError ||
                        similarIncidentsLoading ||
                        aiTroubleshooting ||
                        troubleshootingError ||
                        troubleshootingLoading) && (
                        <div className="incident-intelligence-results">
                      <section className="intelligence-result-section intelligence-diagnosis">
                        <div className="intelligence-section-heading">
                          <span>01</span>
                          <h4>Diagnosis</h4>
                        </div>
                        {aiError && (
                          <p className="intelligence-error" role="alert">
                            Diagnosis unavailable: {aiError}
                          </p>
                        )}
                        {aiAnalysis && (
                          <>
                            <div className="intelligence-summary">
                              <span>Summary</span>
                              <p>{aiAnalysis.summary}</p>
                            </div>
                            <dl className="intelligence-diagnosis-grid">
                              <div>
                                <dt>Category</dt>
                                <dd>{aiAnalysis.category}</dd>
                              </div>
                              <div>
                                <dt>Severity</dt>
                                <dd>{aiAnalysis.severity}</dd>
                              </div>
                              <div>
                                <dt>Possible Cause</dt>
                                <dd>{aiAnalysis.possibleCause}</dd>
                              </div>
                              <div>
                                <dt>Root Cause</dt>
                                <dd>{aiAnalysis.rootCause}</dd>
                              </div>
                            </dl>
                          </>
                        )}
                      </section>

                      <section className="intelligence-result-section intelligence-history">
                        <div className="intelligence-section-heading">
                          <span>02</span>
                          <h4>Historical Context</h4>
                        </div>
                        {similarIncidentsError && (
                          <p className="intelligence-error" role="alert">
                            Historical context unavailable: {similarIncidentsError}
                          </p>
                        )}
                        {similarIncidents?.length === 0 && (
                          <p className="intelligence-note">No similar incidents were found.</p>
                        )}
                        {similarIncidents?.length > 0 && (
                          <div className="intelligence-incident-list">
                            <div className="intelligence-incident-columns" aria-hidden="true">
                              <span>Incident ID</span>
                              <span>Title</span>
                              <span>Status</span>
                              <span>Priority</span>
                              <span>Similarity</span>
                            </div>
                            {similarIncidents.map((incident) => (
                              <button
                                key={incident.incidentId}
                                type="button"
                                className="intelligence-incident-row"
                                onClick={() => loadIncidentDetails(incident.incidentId)}
                              >
                                <span className="intelligence-incident-id">
                                  Incident #{incident.incidentId}
                                </span>
                                <strong>{incident.title}</strong>
                                <span>{incident.status || "-"}</span>
                                <span>{incident.priority || "-"}</span>
                                <span>{incident.similarityScore}% match</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="intelligence-result-section intelligence-response">
                        <div className="intelligence-section-heading">
                          <span>03</span>
                          <h4>Recommended Response</h4>
                        </div>
                        {aiAnalysis && (
                          <ol className="intelligence-action-list">
                            {aiAnalysis.recommendedActions.map((action, index) => (
                              <li key={`${index}-${action}`}>
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <p>{action}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>

                      <section className="intelligence-result-section intelligence-troubleshooting">
                        <div className="intelligence-section-heading">
                          <span>04</span>
                          <h4>Troubleshooting</h4>
                        </div>
                        {troubleshootingError && (
                          <p className="intelligence-error" role="alert">
                            Troubleshooting unavailable: {troubleshootingError}
                          </p>
                        )}
                        {aiTroubleshooting && (
                          <ol className="intelligence-steps">
                            {aiTroubleshooting.troubleshootingSteps.map((step, index) => (
                              <li key={`${index}-${step}`}>
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <p>{step}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>

                      <section className="intelligence-result-section intelligence-resolution">
                        <div className="intelligence-section-heading">
                          <span>05</span>
                          <h4>Suggested Resolution</h4>
                        </div>
                        {aiTroubleshooting && (
                          <p>{aiTroubleshooting.suggestedResolution}</p>
                        )}
                      </section>

                      <section className="intelligence-result-section intelligence-verification">
                        <div className="intelligence-section-heading">
                          <span>06</span>
                          <h4>Verification</h4>
                        </div>
                        {aiTroubleshooting && (
                          <ul>
                            {aiTroubleshooting.verificationSteps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        )}
                      </section>
                        </div>
                      )}
                    </section>

                    {/* =========================
                        ASSIGN INCIDENT
                        ========================= */}

                    <div
                      className="incident-assign-card"
                      style={
                        styles.assignSection
                      }
                    >

                      <h3
                        style={
                          styles.commentFormTitle
                        }
                      >
                        Assign Incident
                      </h3>

                      <div
                        style={
                          styles.assignRow
                        }
                      >

                        <input
                          type="text"
                          value={
                            assigneeInput
                          }
                          onChange={(e) =>
                            setAssigneeInput(
                              e.target.value
                            )
                          }
                          placeholder="Enter assignee"
                          style={
                            styles.input
                          }
                        />

                        <button
                          type="button"
                          onClick={
                            assignIncident
                          }
                          style={
                            styles.createButton
                          }
                          disabled={
                            assigningIncident
                          }
                        >
                          {assigningIncident
                            ? "Assigning..."
                            : "Assign"}
                        </button>

                      </div>

                    </div>


                    {/* =========================
                        COMMENTS
                        ========================= */}

                    <section
                      className="incident-comments-card"
                      style={
                        styles.commentsSection
                      }
                    >

                      <div
                        className="incident-section-header"
                        style={
                          styles.sectionHeader
                        }
                      >

                        <div>

                          <h2
                            style={
                              styles.sectionTitle
                            }
                          >
                            Comments
                          </h2>

                          <p
                            style={
                              styles.sectionSubtitle
                            }
                          >
                            Discussion and investigation notes for this incident.
                          </p>

                        </div>

                        <button
                          type="button"
                          style={
                            styles.refreshButton
                          }
                          onClick={() =>
                            loadComments(
                              selectedIncident.id
                            )
                          }
                        >
                          Refresh
                        </button>

                      </div>


                      {commentsLoading ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >
                          Loading comments...
                        </div>

                      ) : comments.length ===
                        0 ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >

                          <div
                            style={
                              styles.emptyIcon
                            }
                          >
                            C
                          </div>

                          <p>
                            No comments yet.
                          </p>

                        </div>

                      ) : (

                        <div
                          className="incident-comment-list"
                          style={{
                            padding:
                              "20px",
                          }}
                        >

                          {comments.map(
                            (item) => (

                              <div
                                key={
                                  item.id
                                }
                                className="commentCard"
                                style={
                                  styles.commentCard
                                }
                              >

                                <div
                                  style={
                                    styles.commentHeader
                                  }
                                >

                                  <div>

                                    <div
                                      style={
                                        styles.commentUser
                                      }
                                    >
                                      {item.userEmail ||
                                        "-"}
                                    </div>

                                    <div
                                      style={
                                        styles.commentDate
                                      }
                                    >
                                      {item.createdAt ||
                                        "-"}
                                    </div>

                                  </div>

                                  <button
                                    type="button"
                                    style={
                                      styles.deleteCommentButton
                                    }
                                    onClick={() =>
                                      deleteComment(
                                        item.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>

                                <p
                                  style={
                                    styles.commentText
                                  }
                                >
                                  {item.comment ||
                                    "-"}
                                </p>

                              </div>

                            )
                          )}

                        </div>

                      )}


                      {/* ADD COMMENT */}

                      <div
                        className="addCommentSection"
                        style={
                          styles.addCommentSection
                        }
                      >

                        <h3
                          style={
                            styles.commentFormTitle
                          }
                        >
                          Add Comment
                        </h3>

                        <form
                          onSubmit={
                            addComment
                          }
                        >

                          <textarea
                            value={
                              newComment
                            }
                            onChange={(e) =>
                              setNewComment(
                                e.target.value
                              )
                            }
                            maxLength={2000}
                            placeholder="Write an investigation note or comment..."
                            style={
                              styles.textarea
                            }
                            required
                          />

                          <button
                            type="submit"
                            style={
                              styles.createButton
                            }
                            disabled={
                              commentLoading
                            }
                          >
                            {commentLoading
                              ? "Adding..."
                              : "Add Comment"}
                          </button>

                        </form>

                      </div>

                    </section>


                    {/* =========================
                        RESOLUTION HISTORY
                        ========================= */}

                    <section
                      className="incident-resolutions-card"
                      style={
                        styles.commentsSection
                      }
                    >

                      <div
                        className="incident-section-header"
                        style={
                          styles.sectionHeader
                        }
                      >

                        <div>

                          <h2
                            style={
                              styles.sectionTitle
                            }
                          >
                            Resolution History
                          </h2>

                          <p
                            style={
                              styles.sectionSubtitle
                            }
                          >
                            Track how this incident was resolved.
                          </p>

                        </div>

                        <button
                          type="button"
                          style={
                            styles.refreshButton
                          }
                          onClick={() =>
                            loadResolutions(
                              selectedIncident.id
                            )
                          }
                        >
                          Refresh
                        </button>

                      </div>


                      {/* RESOLUTION LIST */}

                      {resolutionsLoading ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >
                          Loading resolution history...
                        </div>

                      ) : resolutions.length ===
                        0 ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >

                          <div
                            style={
                              styles.emptyIcon
                            }
                          >
                            ✓
                          </div>

                          <p>
                            No resolutions recorded yet.
                          </p>

                          <p
                            style={
                              styles.sectionSubtitle
                            }
                          >
                            Add the first resolution below.
                          </p>

                        </div>

                      ) : (

                        <div
                          className="incident-resolution-list"
                          style={{
                            padding:
                              "20px",
                          }}
                        >

                          {resolutions.map(
                            (item) => (

                              <div
                                key={
                                  item.id
                                }
                                className="resolutionCard"
                                style={
                                  styles.resolutionCard
                                }
                              >

                                <div
                                  style={
                                    styles.resolutionHeader
                                  }
                                >

                                  <div>

                                    <div
                                      style={
                                        styles.resolutionLabel
                                      }
                                    >
                                      RESOLVED BY
                                    </div>

                                    <div
                                      style={
                                        styles.resolutionUser
                                      }
                                    >
                                      {item.resolvedBy ||
                                        "-"}
                                    </div>

                                  </div>

                                  <div
                                    style={
                                      styles.resolutionDate
                                    }
                                  >
                                    {item.resolvedAt ||
                                      "-"}
                                  </div>

                                </div>


                                <div
                                  style={
                                    styles.resolutionLabel
                                  }
                                >
                                  RESOLUTION
                                </div>

                                <p
                                  style={
                                    styles.resolutionText
                                  }
                                >
                                  {item.resolution ||
                                    "-"}
                                </p>


                                <button
                                  type="button"
                                  style={
                                    styles.deleteResolutionButton
                                  }
                                  onClick={() =>
                                    deleteResolution(
                                      item.id
                                    )
                                  }
                                >
                                  Delete Resolution
                                </button>

                              </div>

                            )
                          )}

                        </div>

                      )}


                      {/* ADD RESOLUTION */}

                      <div
                        className="addCommentSection"
                        style={
                          styles.addCommentSection
                        }
                      >

                        <h3
                          style={
                            styles.commentFormTitle
                          }
                        >
                          Add Resolution
                        </h3>

                        <form
                          onSubmit={
                            addResolution
                          }
                        >

                          <textarea
                            value={
                              newResolution
                            }
                            onChange={(e) =>
                              setNewResolution(
                                e.target.value
                              )
                            }
                            maxLength={3000}
                            placeholder="Describe how the incident was resolved..."
                            style={
                              styles.textarea
                            }
                            required
                          />

                          <button
                            type="submit"
                            style={
                              styles.createButton
                            }
                            disabled={
                              resolutionLoading
                            }
                          >
                            {resolutionLoading
                              ? "Saving..."
                              : "Add Resolution"}
                          </button>

                        </form>

                      </div>

                    </section>

                    {/* ATTACHMENTS */}

                    <section
                      className="incident-attachments-card"
                      style={
                        styles.commentsSection
                      }
                    >

                      <div
                        className="incident-section-header"
                        style={
                          styles.sectionHeader
                        }
                      >

                        <div>

                          <h2
                            style={
                              styles.sectionTitle
                            }
                          >
                            Attachments
                          </h2>

                          <p
                            style={
                              styles.sectionSubtitle
                            }
                          >
                            Files attached to this incident.
                          </p>

                        </div>

                        <button
                          type="button"
                          style={
                            styles.refreshButton
                          }
                          onClick={() =>
                            loadAttachments(
                              selectedIncident.id
                            )
                          }
                          disabled={
                            attachmentsLoading
                          }
                        >
                          {attachmentsLoading
                            ? "Refreshing..."
                            : "Refresh"}
                        </button>

                      </div>


                      <form
                        className="addCommentSection"
                        onSubmit={
                          uploadAttachment
                        }
                        style={
                          styles.addCommentSection
                        }
                      >

                        <input
                          ref={
                            attachmentFileInputRef
                          }
                          type="file"
                          onChange={(event) => {
                            setSelectedFile(
                              event.target.files?.[0] ||
                                null
                            );
                            setAttachmentMessage("");
                            setAttachmentMessageType("");
                          }}
                          style={
                            styles.input
                          }
                          disabled={
                            attachmentUploading
                          }
                        />

                        {selectedFile && (
                          <p
                            style={
                              styles.sectionSubtitle
                            }
                          >
                            Selected file: {selectedFile.name}
                          </p>
                        )}

                        <button
                          type="submit"
                          style={
                            styles.createButton
                          }
                          disabled={
                            attachmentUploading ||
                            !selectedFile
                          }
                        >
                          {attachmentUploading
                            ? "Uploading..."
                            : "Upload Attachment"}
                        </button>

                        {attachmentMessage && (
                          <p
                            role="status"
                            style={{
                              ...styles.attachmentMessage,
                              color:
                                attachmentMessageType ===
                                "success"
                                  ? "#287a55"
                                  : "#b43c32",
                            }}
                          >
                            {attachmentMessage}
                          </p>
                        )}

                      </form>


                      {attachmentsLoading ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >
                          Loading attachments...
                        </div>

                      ) : attachments.length === 0 ? (

                        <div
                          style={
                            styles.emptyState
                          }
                        >
                          No attachments uploaded yet.
                        </div>

                      ) : (

                        <div
                          className="attachmentList"
                          style={
                            styles.attachmentList
                          }
                        >
                          {attachments.map(
                            (attachment) => (
                              <div
                                key={
                                  attachment.id
                                }
                                className="attachmentCard"
                                style={
                                  styles.attachmentCard
                                }
                              >
                                <div
                                  style={
                                    styles.attachmentInfo
                                  }
                                >
                                  <div
                                    style={
                                      styles.attachmentFileName
                                    }
                                  >
                                    <span aria-hidden="true">
                                      📎
                                    </span>{" "}
                                    {attachment.fileName ||
                                      "Unnamed file"}
                                  </div>

                                  <div
                                    style={
                                      styles.attachmentMeta
                                    }
                                  >
                                    {attachment.fileType ||
                                      "application/octet-stream"}
                                  </div>

                                  <div
                                    style={
                                      styles.attachmentMeta
                                    }
                                  >
                                    Uploaded by:{" "}
                                    {attachment.uploadedBy ||
                                      "-"}
                                  </div>
                                  <div className="attachment-timestamp">
                                    {attachment.uploadedAt ||
                                      attachment.createdAt ||
                                      "-"}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  style={
                                    styles.deleteCommentButton
                                  }
                                  onClick={() =>
                                    deleteAttachment(
                                      attachment.id
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            )
                          )}
                        </div>

                      )}

                    </section>

                    </div>

                    <aside className="incident-workspace-sidebar">
                      <div className="incident-sidebar-heading">
                        <span>INCIDENT WORKSPACE</span>
                        <strong>Sections</strong>
                      </div>

                      <nav aria-label="Incident sections">
                        {[
                          ["overview", "Overview"],
                          ["intelligence", "Incident Intelligence"],
                          ["comments", "Comments"],
                          ["attachments", "Attachments"],
                          ["resolution", "Resolution"],
                          ["audit", "Audit History"],
                        ].map(([section, label]) => (
                          <button
                            key={section}
                            type="button"
                            className={
                              activeIncidentSection === section ? "active" : ""
                            }
                            aria-current={
                              activeIncidentSection === section
                                ? "page"
                                : undefined
                            }
                            onClick={() => setActiveIncidentSection(section)}
                          >
                            <span>{label}</span>
                            {section === "comments" && comments.length > 0 && (
                              <small>{comments.length}</small>
                            )}
                            {section === "attachments" &&
                              attachments.length > 0 && (
                                <small>{attachments.length}</small>
                              )}
                          </button>
                        ))}
                      </nav>

                      <div className="incident-sidebar-facts">
                        <span className="incident-sidebar-label">CURRENT STATUS</span>
                        <span
                          className={`operations-status status-${(selectedIncident.status || "unknown").toLowerCase()}`}
                        >
                          {selectedIncident.status || "-"}
                        </span>

                        <div>
                          <span className="incident-sidebar-label">PRIORITY</span>
                          <span
                            className={`operations-priority priority-${(selectedIncident.priority || "unknown").toLowerCase()}`}
                          >
                            {selectedIncident.priority || "-"}
                          </span>
                        </div>

                        <div>
                          <span className="incident-sidebar-label">SEVERITY</span>
                          <span
                            className={`incident-severity-badge severity-${(selectedIncident.severity || "unknown").toLowerCase()}`}
                          >
                            {selectedIncident.severity || "-"}
                          </span>
                        </div>

                        <div>
                          <span className="incident-sidebar-label">ASSIGNEE</span>
                          <strong>{selectedIncident.assignee || "Unassigned"}</strong>
                        </div>
                      </div>
                    </aside>
                  </div>

                )}

              </section>

            )}

        </main>

      </div>
    );
  }


  return (
    <main className="operations-auth-page">
      <section className="operations-auth-brand-panel" aria-label="IncidentIQ">
        <div className="operations-auth-brand">
          <span className="operations-auth-logo" aria-hidden="true">IQ</span>
          <div>
            <h1>IncidentIQ</h1>
            <p>Incident Intelligence</p>
          </div>
        </div>

        <div className="operations-auth-message">
          <span className="operations-auth-eyebrow">INCIDENT OPERATIONS</span>
          <h2>Monitor incidents. Understand root causes. Resolve faster.</h2>
          <p>
            A clearer view of your incident response, from first signal to
            resolution.
          </p>
        </div>

        <div className="operations-auth-workflow" aria-hidden="true">
          <span className="operations-auth-workflow-line" />
          <div><span>01</span><strong>Monitor</strong></div>
          <div><span>02</span><strong>Understand</strong></div>
          <div><span>03</span><strong>Resolve</strong></div>
        </div>
        <div className="operations-auth-brand-footer">
          <span className="operations-auth-footer-mark" />
          <span>Built for clear, confident incident response</span>
        </div>
      </section>

      <section className="operations-auth-form-panel">
        <div className="operations-auth-card">
          <div className="operations-auth-card-kicker">
            {authPage === "login" ? "WELCOME BACK" : "GET STARTED"}
          </div>
          <h2>
            {authPage === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="operations-auth-subtitle">
            {authPage === "login"
              ? "Sign in to continue to your incident workspace."
              : "Join IncidentIQ and manage incidents with intelligence."}
          </p>

          <form
            className="operations-auth-form"
            onSubmit={authPage === "login" ? login : register}
          >
            {authPage === "register" && (
              <div className="operations-auth-field">
                <label htmlFor="auth-name">Name</label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="operations-auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="operations-auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="operations-auth-password">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    authPage === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="operations-auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              className="operations-auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? authPage === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : authPage === "login"
                  ? "Sign In"
                  : "Register"}
            </button>
          </form>

          {message && (
            <div
              className={`operations-auth-feedback ${
                messageType === "success" ? "is-success" : "is-error"
              }`}
              role={messageType === "success" ? "status" : "alert"}
              aria-live={messageType === "success" ? "polite" : "assertive"}
            >
              <span className="operations-auth-feedback-icon" aria-hidden="true">
                {messageType === "success" ? "✓" : "!"}
              </span>
              <span>{message}</span>
            </div>
          )}

          <p className="operations-auth-switch">
            {authPage === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setAuthPage(authPage === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {authPage === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}


/* =========================
   PRIORITY STYLE
   ========================= */

function getPriorityStyle(
  priority
) {
  if (!priority) {
    return {};
  }

  const value =
    priority.toLowerCase();

  if (
    value === "high" ||
    value === "critical"
  ) {
    return {
      background: "#f9e2df",
      color: "#b43c32",
    };
  }

  if (value === "medium") {
    return {
      background: "#f6edd8",
      color: "#92702c",
    };
  }

  return {
    background: "#e5f1e9",
    color: "#287a55",
  };
}


/* =========================
   STYLES
   ========================= */

const styles = {

  dashboard: {
    minHeight: "100vh",
    background: "#f8f5ef",
    color: "#29251f",
    fontFamily:
      "Arial, sans-serif",
  },

  navbar: {
    height: "76px",
    background: "#fff",
    borderBottom:
      "1px solid #e0d9cf",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 45px",
    boxSizing: "border-box",
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  navLogo: {
    width: "40px",
    height: "40px",
    borderRadius: "9px",
    background: "#df5a36",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
  },

  navSubtitle: {
    fontSize: "11px",
    color: "#888078",
    marginTop: "2px",
  },

  logoutButton: {
    border: "1px solid #d2cbc0",
    background: "#fff",
    color: "#29251f",
    borderRadius: "7px",
    padding: "9px 15px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  main: {
    maxWidth: "1250px",
    margin: "0 auto",
    padding: "45px 30px 80px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "30px",
  },

  pageLabel: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
    color: "#df5a36",
    marginBottom: "8px",
  },

  title: {
    fontSize: "36px",
    margin: 0,
    letterSpacing: "-1px",
  },

  subtitle: {
    color: "#888078",
    marginTop: "8px",
    fontSize: "14px",
  },

  createButton: {
    background: "#df5a36",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px 20px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#fff",
    color: "#29251f",
    border: "1px solid #d2cbc0",
    borderRadius: "7px",
    padding: "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  dangerButton: {
    background: "#fff",
    color: "#b43c32",
    border: "1px solid #d9a49b",
    borderRadius: "7px",
    padding: "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  detailHeaderButtons: {
    display: "flex",
    gap: "10px",
  },

  /* FORMS */

  createSection: {
    background: "#fff",
    border: "1px solid #e0d9cf",
    borderRadius: "12px",
    padding: "30px",
    marginBottom: "30px",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "25px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
    color: "#777067",
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#625b52",
    marginTop: "18px",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d8d1c7",
    borderRadius: "7px",
    padding: "11px 13px",
    background: "#fff",
    color: "#29251f",
    fontSize: "14px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    border: "1px solid #d8d1c7",
    borderRadius: "7px",
    padding: "12px 13px",
    background: "#fff",
    color: "#29251f",
    fontSize: "14px",
    resize: "vertical",
    fontFamily:
      "Arial, sans-serif",
    outline: "none",
  },

  formButtons: {
    display: "flex",
    alignItems: "center",
    marginTop: "25px",
  },

  cancelButton: {
    marginLeft: "10px",
    padding: "13px 20px",
    border:
      "1px solid #d2cbc0",
    borderRadius: "8px",
    background: "#fff",
    color: "#29251f",
    fontWeight: "bold",
    cursor: "pointer",
  },

  /* STATS */

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "40px",
  },

  analyticsSection: {
    background: "#fff",
    border: "1px solid #e0d9cf",
    borderRadius: "12px",
    marginBottom: "30px",
    overflow: "hidden",
  },

  analyticsMessage: {
    padding: "16px 25px 0",
    color: "#625b52",
    fontSize: "13px",
  },

  analyticsError: {
    padding: "16px 25px 0",
    color: "#b43c32",
    fontSize: "13px",
  },

  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    padding: "25px",
  },

  breakdownCard: {
    border: "1px solid #e7e0d7",
    borderRadius: "8px",
    padding: "18px",
  },

  breakdownTitle: {
    margin: "0 0 14px",
    fontSize: "11px",
    letterSpacing: "1px",
    color: "#888078",
  },

  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "8px 0",
    borderTop: "1px solid #eee9e2",
    color: "#29251f",
    fontSize: "13px",
  },

  breakdownEmpty: {
    color: "#8a837a",
    fontSize: "13px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e0d9cf",
    borderRadius: "12px",
    padding: "25px",
  },

  statLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1.5px",
    color: "#888078",
  },

  statNumber: {
    fontSize: "38px",
    fontWeight: "bold",
    margin: "12px 0 6px",
  },

  statDescription: {
    fontSize: "13px",
    color: "#8a837a",
  },

  /* INCIDENT TABLE */

  incidentSection: {
    background: "#fff",
    border:
      "1px solid #e0d9cf",
    borderRadius: "12px",
    overflow: "hidden",
  },

  sectionHeader: {
    padding: "25px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid #e7e0d7",
  },

  filterForm: {
    padding: "0 25px 25px",
    borderBottom: "1px solid #e7e0d7",
  },

  filterField: {
    display: "block",
    minWidth: 0,
  },

  filterSelects: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  filterActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },

  incidentError: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#b43c32",
    fontSize: "14px",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    padding: "20px",
    borderTop: "1px solid #e7e0d7",
  },

  paginationLabel: {
    color: "#625b52",
    fontSize: "14px",
    fontWeight: "bold",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#888078",
    fontSize: "13px",
  },

  refreshButton: {
    border:
      "1px solid #d2cbc0",
    background: "#fff",
    borderRadius: "7px",
    padding: "8px 14px",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "15px 20px",
    fontSize: "10px",
    letterSpacing: "1px",
    color: "#888078",
    background: "#faf8f4",
    borderBottom:
      "1px solid #e7e0d7",
  },

  td: {
    padding: "17px 20px",
    fontSize: "14px",
    borderBottom:
      "1px solid #eee9e2",
  },

  detailsButton: {
    border:
      "1px solid #df5a36",
    background: "#fff",
    color: "#df5a36",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  statusBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    background: "#eee9e2",
    color: "#625b52",
    fontSize: "11px",
    fontWeight: "bold",
  },

  emptyState: {
    padding: "70px 20px",
    textAlign: "center",
    color: "#777067",
  },

  emptyIcon: {
    width: "45px",
    height: "45px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#df5a36",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  /* DETAILS */

  detailsSection: {
    background: "#fff",
    border:
      "1px solid #e0d9cf",
    borderRadius: "12px",
    marginTop: "30px",
    overflow: "hidden",
  },

  detailsHeader: {
    padding: "28px 30px",
    borderBottom:
      "1px solid #e7e0d7",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  detailsTitle: {
    margin: 0,
    fontSize: "28px",
  },

  descriptionBox: {
    margin: "25px 30px",
    padding: "20px",
    background: "#faf8f4",
    borderRadius: "9px",
    border:
      "1px solid #e7e0d7",
  },

  aiAnalysisSection: {
    margin: "25px 30px",
    padding: "20px",
    background: "#faf8f4",
    border: "1px solid #e7e0d7",
    borderRadius: "9px",
  },

  aiAnalysisHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  lifecycleActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
  },

  auditHistoryEntry: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px 0",
    borderBottom: "1px solid #e7e0d7",
  },

  aiAnalysisStatus: {
    margin: "16px 0 0",
    color: "#625b52",
    fontSize: "14px",
  },

  aiAnalysisError: {
    margin: "16px 0 0",
    color: "#b43c32",
    fontSize: "14px",
  },

  aiAnalysisResult: {
    margin: "18px 0 0",
    padding: "16px",
    background: "#fff",
    border: "1px solid #e0d9cf",
    borderRadius: "7px",
    color: "#49433c",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },

  aiAnalysisField: {
    marginBottom: "14px",
  },

  aiAnalysisLabel: {
    marginBottom: "4px",
    color: "#625b52",
    fontSize: "12px",
    fontWeight: "bold",
  },

  aiAnalysisActions: {
    margin: "6px 0 0",
    paddingLeft: "22px",
  },

  similarIncidentItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
    padding: "12px 0",
    borderBottom: "1px solid #e7e0d7",
    color: "#49433c",
    fontSize: "14px",
    lineHeight: "1.5",
    textAlign: "left",
  },

  similarIncidentButton: {
    width: "100%",
    borderTop: "none",
    borderRight: "none",
    borderLeft: "none",
    background: "transparent",
    cursor: "pointer",
    font: "inherit",
  },

  descriptionText: {
    margin: "10px 0 0",
    lineHeight: "1.6",
    fontSize: "14px",
    color: "#49433c",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "1px",
    background: "#e7e0d7",
    margin: "0 30px 30px",
    border:
      "1px solid #e7e0d7",
  },

  detailItem: {
    background: "#fff",
    padding: "18px",
  },

  detailLabel: {
    fontSize: "10px",
    letterSpacing: "1.2px",
    fontWeight: "bold",
    color: "#888078",
  },

  detailValue: {
    margin: "7px 0 0",
    fontSize: "14px",
    fontWeight: "bold",
  },

  editForm: {
    padding: "30px",
  },

  assignSection: {
    padding: "25px 30px",
    borderTop:
      "1px solid #e7e0d7",
    borderBottom:
      "1px solid #e7e0d7",
  },

  assignRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  /* COMMENTS */

  commentsSection: {
    borderTop:
      "1px solid #e7e0d7",
  },

  addCommentSection: {
    padding: "25px",
    borderTop:
      "1px solid #e7e0d7",
  },

  attachmentMessage: {
    margin: "12px 0 0",
    fontSize: "13px",
    fontWeight: "bold",
  },

  attachmentList: {
    padding: "20px",
  },

  attachmentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e0d9cf",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
    background: "#faf8f4",
  },

  attachmentInfo: {
    minWidth: 0,
  },

  attachmentFileName: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#29251f",
    overflowWrap: "anywhere",
  },

  attachmentMeta: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#777067",
  },

  commentFormTitle: {
    margin: "0 0 15px",
    fontSize: "16px",
  },

  commentCard: {
    border:
      "1px solid #e0d9cf",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "12px",
    background: "#faf8f4",
  },

  commentHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  commentUser: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#29251f",
  },

  commentDate: {
    fontSize: "11px",
    color: "#888078",
    marginTop: "4px",
  },

  commentText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#49433c",
    margin:
      "14px 0 0",
  },

  deleteCommentButton: {
    border:
      "1px solid #d9a49b",
    background: "#fff",
    color: "#b43c32",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  /* =========================
     RESOLUTION HISTORY
     ========================= */

  resolutionCard: {
    border:
      "1px solid #e0d9cf",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "15px",
    background: "#faf8f4",
  },

  resolutionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },

  resolutionLabel: {
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1.2px",
    color: "#888078",
    marginBottom: "5px",
  },

  resolutionUser: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#29251f",
  },

  resolutionDate: {
    fontSize: "12px",
    color: "#777067",
  },

  resolutionText: {
    margin: "8px 0 15px",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#49433c",
  },

  deleteResolutionButton: {
    border:
      "1px solid #d9a49b",
    background: "#fff",
    color: "#b43c32",
    borderRadius: "6px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default App;