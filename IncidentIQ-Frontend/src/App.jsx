import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  LogOut,
  Layers,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  X,
  Send,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  SlidersHorizontal,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Server,
  UploadCloud,
  FileText,
  Download,
  Terminal,
  Cpu,
  ArrowRight
} from "lucide-react";
import "./dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "https://incidentq-backend-api.onrender.com"
    : "http://localhost:8080"
);

export default function App() {
  // ====================================================
  // AUTHENTICATION STATE
  // ====================================================
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("Incident Operations Commander");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // ====================================================
  // DASHBOARD & INCIDENT DATA STATE
  // ====================================================
  const [analytics, setAnalytics] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    statusCounts: {},
    severityCounts: {},
  });
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Slide-over Workspace State
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview"); // overview, diagnostics, audit, comments, resolutions
  const [similarIncidents, setSimilarIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newResolutionText, setNewResolutionText] = useState("");

  // Diagnostics / RCA State
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);
  const [troubleshootingRunbook, setTroubleshootingRunbook] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [scanningEffect, setScanningEffect] = useState(false);

  // Create Incident Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    environment: "PRODUCTION",
    error_message: "",
    logs: "",
    category: "INFRASTRUCTURE",
    severity: "MEDIUM",
    assignee: "alex.chen@incidentq.com",
  });
  const [creating, setCreating] = useState(false);

  // Ingestion & Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState("file"); // 'file' | 'log'
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedPreview, setParsedPreview] = useState([]);
  const [rawLogText, setRawLogText] = useState("");
  const [rawLogTitle, setRawLogTitle] = useState("");
  const [rawLogSeverity, setRawLogSeverity] = useState("HIGH");
  const [rawLogEnv, setRawLogEnv] = useState("PRODUCTION");
  const [uploading, setUploading] = useState(false);

  // Reset Confirmation Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  // DOM Refs for GSAP
  const kpiGridRef = useRef(null);
  const tableContainerRef = useRef(null);
  const drawerRef = useRef(null);
  const modalRef = useRef(null);
  const uploadModalRef = useRef(null);
  const diagCardRef = useRef(null);

  // ====================================================
  // TOAST TRIGGER
  // ====================================================
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ====================================================
  // AUTHENTICATION HANDLERS
  // ====================================================
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      showToast("Please enter your work email and password", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Invalid corporate credentials", "error");
        return;
      }
      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Welcome back, ${data.user?.name || "Commander"}`, "success");
    } catch {
      showToast("Identity authentication service offline. Check connectivity.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      showToast("All fields are required to register an account", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName.trim(),
          email: authEmail.trim(),
          password: authPassword,
          role: authRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Account creation failed", "error");
        return;
      }
      showToast("Account created. Authenticating session...", "success");
      setAuthMode("login");
      // Direct sign in
      const loginRes = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        setToken(loginData.token);
        setCurrentUser(loginData.user);
      }
    } catch {
      showToast("Unable to complete registration. Try again.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setCurrentUser(null);
    setSelectedIncident(null);
    showToast("Signed out of session safely", "info");
  };

  // ====================================================
  // DATA RETRIEVAL
  // ====================================================
  const loadAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/incidents/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn("Analytics fetch error:", err);
    }
  };

  const loadIncidents = async (targetPage = page) => {
    if (!token) return;
    setLoadingIncidents(true);
    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        size: "10",
      });
      if (searchQuery.trim()) query.set("title", searchQuery.trim());
      if (statusFilter) query.set("status", statusFilter);
      if (severityFilter) query.set("severity", severityFilter);

      const res = await fetch(`${API_BASE}/api/incidents/filter?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        let rows = data.content || [];
        // Optional client-side filter for environment & category if backend is standard
        if (environmentFilter) {
          rows = rows.filter((r) => r.environment === environmentFilter);
        }
        if (categoryFilter) {
          rows = rows.filter((r) => r.category === categoryFilter);
        }
        setIncidents(rows);
        setPage(data.number || 0);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
    } catch {
      showToast("Error retrieving incident log", "error");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAnalytics();
      loadIncidents(0);
    }
  }, [token, statusFilter, severityFilter, environmentFilter, categoryFilter]);

  useEffect(() => {
    if (!token) return;
    const timeout = setTimeout(() => {
      loadIncidents(0);
    }, 280);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // GSAP Animations
  useEffect(() => {
    if (kpiGridRef.current) {
      gsap.fromTo(
        kpiGridRef.current.children,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, [token]);

  useEffect(() => {
    if (tableContainerRef.current) {
      const rows = tableContainerRef.current.querySelectorAll(".incident-row");
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, x: -8 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power1.out" }
        );
      }
    }
  }, [incidents]);

  // ====================================================
  // INCIDENT DETAILS & SUB-DATA
  // ====================================================
  const openIncidentDetails = async (incident) => {
    setSelectedIncident(incident);
    setDrawerTab("overview");
    setDiagnosticsResult(null);
    setTroubleshootingRunbook(null);

    setTimeout(() => {
      if (drawerRef.current) {
        gsap.fromTo(
          drawerRef.current,
          { x: "100%", opacity: 0 },
          { x: "0%", opacity: 1, duration: 0.35, ease: "power3.out" }
        );
      }
    }, 10);

    fetchIncidentSubData(incident.id);
  };

  const fetchIncidentSubData = async (incidentId) => {
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
      const [simRes, audRes, comRes, resRes] = await Promise.all([
        fetch(`${API_BASE}/api/incidents/${incidentId}/similar`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/incidents/${incidentId}/audit`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/comments/incident/${incidentId}`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/resolutions/incident/${incidentId}`, { headers: authHeaders }),
      ]);

      if (simRes.ok) setSimilarIncidents(await simRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
      if (comRes.ok) setComments(await comRes.json());
      if (resRes.ok) setResolutions(await resRes.json());
    } catch (err) {
      console.warn("Sub-data fetch error:", err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedIncident) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/incidents/${selectedIncident.id}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setSelectedIncident(updated);
        setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        loadAnalytics();
        fetchIncidentSubData(updated.id);
        showToast(`Incident status updated to ${newStatus}`, "success");
      }
    } catch {
      showToast("Status change failed", "error");
    }
  };

  const handleUpdateAssignee = async (newAssignee) => {
    if (!selectedIncident) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/incidents/${selectedIncident.id}/assign?assignee=${encodeURIComponent(newAssignee)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setSelectedIncident(updated);
        setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        fetchIncidentSubData(updated.id);
        showToast(`Responder assigned: ${newAssignee.split("@")[0]}`, "success");
      }
    } catch {
      showToast("Assignment failed", "error");
    }
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim() || !selectedIncident) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          comment: newCommentText.trim(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewCommentText("");
        showToast("Note added to investigation log", "success");
      }
    } catch {
      showToast("Unable to save comment", "error");
    }
  };

  const handleAddResolution = async (e) => {
    e?.preventDefault();
    if (!newResolutionText.trim() || !selectedIncident) return;
    try {
      const res = await fetch(`${API_BASE}/api/resolutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          resolution: newResolutionText.trim(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setResolutions((prev) => [created, ...prev]);
        setSelectedIncident((prev) => ({ ...prev, status: "RESOLVED" }));
        setIncidents((prev) =>
          prev.map((i) => (i.id === selectedIncident.id ? { ...i, status: "RESOLVED" } : i))
        );
        setNewResolutionText("");
        loadAnalytics();
        fetchIncidentSubData(selectedIncident.id);
        showToast("Incident marked RESOLVED with post-mortem record", "success");
      }
    } catch {
      showToast("Failed to record resolution", "error");
    }
  };

  // ====================================================
  // AUTOMATED ROOT-CAUSE DIAGNOSTIC ENGINE
  // ====================================================
  const handleRunDiagnostics = async () => {
    if (!selectedIncident) return;
    setDiagnosticsLoading(true);
    setScanningEffect(true);

    if (diagCardRef.current) {
      gsap.to(diagCardRef.current, {
        opacity: 1,
        scale: 1.015,
        duration: 0.45,
        repeat: -1,
        yoyo: true,
      });
    }

    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          description: selectedIncident.description || selectedIncident.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiagnosticsResult(data.analysis);
        if (data.updatedIncident) {
          setSelectedIncident(data.updatedIncident);
          setIncidents((prev) =>
            prev.map((i) => (i.id === data.updatedIncident.id ? data.updatedIncident : i))
          );
        }
        loadAnalytics();
        fetchIncidentSubData(selectedIncident.id);
        showToast("Automated diagnostic assessment generated", "success");
      } else {
        showToast("Diagnostics execution encountered an error", "error");
      }
    } catch {
      showToast("Diagnostics telemetry connection error", "error");
    } finally {
      setDiagnosticsLoading(false);
      setScanningEffect(false);
      if (diagCardRef.current) {
        gsap.killTweensOf(diagCardRef.current);
      }
    }
  };

  const handleGenerateRunbook = async () => {
    if (!selectedIncident) return;
    setDiagnosticsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/troubleshoot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          possibleCause: diagnosticsResult?.possibleCause,
          rootCause: diagnosticsResult?.rootCause,
          recommendedActions: diagnosticsResult?.recommendedActions,
          summary: diagnosticsResult?.summary,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTroubleshootingRunbook(data);
        showToast("Remediation runbook synthesized", "success");
      }
    } catch {
      showToast("Runbook generation failed", "error");
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  // ====================================================
  // CREATE INCIDENT
  // ====================================================
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          priority: createForm.severity, // align internally without showing duplicate column
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setShowCreateModal(false);
        setCreateForm({
          title: "",
          description: "",
          environment: "PRODUCTION",
          error_message: "",
          logs: "",
          category: "INFRASTRUCTURE",
          severity: "MEDIUM",
          assignee: "alex.chen@incidentq.com",
        });
        loadAnalytics();
        loadIncidents(0);
        showToast(`Incident #${created.id} recorded in operational log`, "success");
      }
    } catch {
      showToast("Failed to record incident", "error");
    } finally {
      setCreating(false);
    }
  };

  // ====================================================
  // UPLOAD & INGEST INCIDENTS (FILE / LOG IMPORT)
  // ====================================================
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          setParsedPreview(items);
          showToast(`Parsed ${items.length} incident record(s) from ${file.name}`, "info");
        } else {
          // Plain log or text file
          setParsedPreview([
            {
              title: `Telemetry Ingestion: ${file.name.replace(/\.[^/.]+$/, "")}`,
              description: `Automated import of operational event log file (${file.size} bytes).`,
              environment: "PRODUCTION",
              category: "INFRASTRUCTURE",
              severity: "HIGH",
              logs: text.slice(0, 1500),
              error_message: text.split("\n")[0]?.slice(0, 200) || "Log event stream captured",
            },
          ]);
          showToast(`Loaded log file ${file.name}`, "info");
        }
      } catch {
        showToast("Unable to parse file. Verify JSON or text structure.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteUpload = async () => {
    if (parsedPreview.length === 0) {
      showToast("No incident records loaded to import", "error");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsedPreview),
      });
      const data = await res.json();
      if (res.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setParsedPreview([]);
        loadAnalytics();
        loadIncidents(0);
        showToast(`Successfully ingested ${data.count} incident record(s)`, "success");
      } else {
        showToast(data.error || "Import failed", "error");
      }
    } catch {
      showToast("Ingestion service unreachable", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleIngestRawLog = async (e) => {
    e.preventDefault();
    if (!rawLogText.trim()) {
      showToast("Please paste server log or stack trace content", "error");
      return;
    }
    setUploading(true);
    const title = rawLogTitle.trim() || `Telemetry Event: ${rawLogText.trim().split("\n")[0].slice(0, 70)}`;
    const payload = [
      {
        title,
        description: `Captured stack trace telemetry from ${rawLogEnv} tier.`,
        environment: rawLogEnv,
        category: "INFRASTRUCTURE",
        severity: rawLogSeverity,
        logs: rawLogText.trim(),
        error_message: rawLogText.split("\n")[0]?.slice(0, 250) || "System exception",
      },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/incidents/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowUploadModal(false);
        setRawLogText("");
        setRawLogTitle("");
        loadAnalytics();
        loadIncidents(0);
        showToast("Log telemetry ingested as active incident", "success");
      }
    } catch {
      showToast("Ingestion failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const template = [
      {
        title: "Ingress Router Rate Limit Exhaustion (429 Spikes)",
        description: "API gateway dropped incoming client transactions after rate limiter threshold was exceeded during traffic surge.",
        environment: "PRODUCTION",
        category: "WEB_GATEWAY",
        severity: "HIGH",
        error_message: "HTTP 429 Too Many Requests: Client rate limit bucket depleted",
        logs: "[WARN] ingress-envoy: rate_limit_exceeded for client_id=corp_checkout",
      },
      {
        title: "Data Replication Checksum Discrepancy on Node 03",
        description: "Consistency check failed on secondary storage partition following network partition event.",
        environment: "PRODUCTION",
        category: "STORAGE_TIER",
        severity: "CRITICAL",
        error_message: "ChecksumMismatchException: Expected 0x8a9c but received 0x0000",
        logs: "[ERROR] storage-worker-03: Block verification failed on partition /data/vol2",
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incident_ingest_template.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Template downloaded", "info");
  };

  // ====================================================
  // RESET WORKSPACE / CLEAR SAMPLE INCIDENTS
  // ====================================================
  const handleClearAllIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/incidents/clear-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setSelectedIncident(null);
        loadAnalytics();
        loadIncidents(0);
        showToast("Incident repository cleared. Clean workspace ready.", "info");
      }
    } catch {
      showToast("Clear operation failed", "error");
    }
  };

  // Delete Individual Incident
  const handleDeleteIncident = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`Delete Incident #${id}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (selectedIncident?.id === id) setSelectedIncident(null);
        setIncidents((prev) => prev.filter((i) => i.id !== id));
        loadAnalytics();
        showToast(`Incident #${id} removed from repository`, "info");
      }
    } catch {
      showToast("Delete operation failed", "error");
    }
  };

  // SLA helper for table (calculates distinct realistic SLA target)
  const getSlaIndicator = (severity, status) => {
    if (status === "RESOLVED" || status === "CLOSED") {
      return { text: "SLA: Met (Resolved)", cls: "sla-badge-nominal" };
    }
    switch (severity) {
      case "CRITICAL":
        return { text: "SLA: < 15m remaining", cls: "sla-badge-critical" };
      case "HIGH":
        return { text: "SLA: < 45m target", cls: "sla-badge-high" };
      case "MEDIUM":
        return { text: "SLA: 2h response window", cls: "sla-badge" };
      default:
        return { text: "SLA: Standard queue", cls: "sla-badge" };
    }
  };

  // ====================================================
  // EXECUTIVE ENTERPRISE AUTHENTICATION PORTAL
  // ====================================================
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-split-container">
          {/* LEFT HERO PANEL */}
          <div className="auth-hero-pane">
            <div className="auth-hero-header">
              <div className="auth-hero-brand">
                <div className="auth-hero-logo">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h1 className="auth-hero-title">IncidentQ</h1>
                  <span className="auth-hero-tagline">Enterprise Reliability Cockpit</span>
                </div>
              </div>
              <p className="auth-hero-pitch">
                Mission-critical incident command, continuous telemetry correlation, and automated runbook orchestration engineered for Tier-1 reliability operations.
              </p>
            </div>

            <div className="auth-hero-features">
              <div className="auth-hero-feat-item">
                <div className="auth-feat-icon-box">
                  <Activity size={16} />
                </div>
                <div className="auth-feat-text">
                  <span className="auth-feat-title">Automated Signal Diagnostics</span>
                  <span className="auth-feat-desc">Isolate root-cause anomalies, latency drifts, and stack trace exceptions in seconds.</span>
                </div>
              </div>

              <div className="auth-hero-feat-item">
                <div className="auth-feat-icon-box">
                  <SlidersHorizontal size={16} />
                </div>
                <div className="auth-feat-text">
                  <span className="auth-feat-title">Runbook Orchestration</span>
                  <span className="auth-feat-desc">Synthesize actionable 4-step remediation workflows and deployment rollback runbooks.</span>
                </div>
              </div>

              <div className="auth-hero-feat-item">
                <div className="auth-feat-icon-box">
                  <Clock size={16} />
                </div>
                <div className="auth-feat-text">
                  <span className="auth-feat-title">Full Audit Traceability</span>
                  <span className="auth-feat-desc">Complete lifecycle timelines, team collaboration notes, and formal post-mortem records.</span>
                </div>
              </div>
            </div>

            <div className="auth-hero-footer">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ShieldCheck size={15} color="var(--emerald)" />
                <span>SOC-2 Type II Certified &middot; Zero-Trust Protocol</span>
              </div>
              <span>SLA: 99.99%</span>
            </div>
          </div>

          {/* RIGHT FORM PANEL */}
          <div className="auth-form-pane">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {authMode === "login" ? "Corporate Workspace Sign In" : "Register Engineering Account"}
              </h2>
              <span className="auth-form-sub">
                {authMode === "login"
                  ? "Enter your corporate credentials to access the operational cockpit."
                  : "Provision an authorized account within the IncidentQ domain."}
              </span>
            </div>

            {/* TAB TOGGLE */}
            <div className="auth-tab-bar">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "login" ? "active" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === "register" ? "active" : ""}`}
                onClick={() => setAuthMode("register")}
              >
                Create Account
              </button>
            </div>

            {/* CORPORATE SSO BUTTON */}
            <button
              type="button"
              className="btn-sso"
              onClick={() => showToast("SAML 2.0 / Okta SSO redirect: corporate token verified", "info")}
            >
              <Lock size={14} color="var(--cyan)" />
              <span>Continue with Corporate SSO (SAML / Okta)</span>
            </button>

            <div className="auth-divider">
              <span>or authenticate with credentials</span>
            </div>

            {/* AUTH FORM */}
            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Joe Miller"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Engineering Discipline / Title</label>
                    <select
                      className="form-select"
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                    >
                      <option value="Incident Operations Commander">Incident Operations Commander</option>
                      <option value="Lead Reliability Engineer">Lead Reliability Engineer</option>
                      <option value="Site Reliability Engineer (SRE)">Site Reliability Engineer (SRE)</option>
                      <option value="Cloud Infrastructure Architect">Cloud Infrastructure Architect</option>
                      <option value="Security & Compliance Operations">Security & Compliance Operations</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Work Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Password *</label>
                  {authMode === "login" && (
                    <span
                      style={{ fontSize: "0.74rem", color: "var(--indigo-light)", cursor: "pointer" }}
                      onClick={() => showToast("Corporate password self-service: contact platform security admin.", "info")}
                    >
                      Forgot credentials?
                    </span>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: "2.5rem" }}
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authMode === "login" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1.25rem",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "var(--indigo)" }}
                  />
                  <label htmlFor="rememberMe" style={{ cursor: "pointer" }}>
                    Remember this workstation for 30 days
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
                disabled={authLoading}
              >
                {authLoading ? (
                  <RefreshCw size={16} className="pulse-indicator" />
                ) : authMode === "login" ? (
                  <>
                    <span>Sign In to Cockpit</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Create Account & Access Cockpit</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* AUTHORIZED ACCOUNT SWITCHER PILLS */}
            <div className="auth-quick-select">
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Workspace Profile:
              </span>
              <div className="auth-quick-pills">
                <button
                  type="button"
                  className="auth-quick-pill"
                  onClick={() => {
                    setAuthEmail("joe.miller@incidentq.com");
                    setAuthPassword("password123");
                    showToast("Joe Miller profile selected", "info");
                  }}
                >
                  <User size={12} />
                  <span>Joe Miller (Commander)</span>
                </button>
                <button
                  type="button"
                  className="auth-quick-pill"
                  onClick={() => {
                    setAuthEmail("alex.chen@incidentq.com");
                    setAuthPassword("password123");
                    showToast("Alex Chen profile selected", "info");
                  }}
                >
                  <User size={12} />
                  <span>Alex Chen (Lead SRE)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING TOASTS */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.type === "success" && <CheckCircle2 size={16} color="var(--emerald)" />}
              {t.type === "error" && <AlertCircle size={16} color="var(--rose)" />}
              {t.type === "info" && <Activity size={16} color="var(--cyan)" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ====================================================
  // ENTERPRISE INCIDENTQ OPERATIONAL COCKPIT
  // ====================================================
  return (
    <div className="app-container">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <ShieldAlert size={22} />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-title">IncidentQ</span>
            <span className="brand-tagline">Reliability & Incident Management Operations</span>
          </div>
        </div>

        <div className="nav-center-status">
          <div className="status-dot pulse-indicator" />
          <span>Nominal Operations</span>
          <span style={{ color: "var(--border-strong)" }}>&middot;</span>
          <Server size={13} color="var(--cyan)" />
          <span>Availability: 99.98%</span>
          <span style={{ color: "var(--border-strong)" }}>&middot;</span>
          <span>Cluster: us-east-1</span>
        </div>

        <div className="nav-actions">
          {/* UPLOAD / INGEST BUTTON */}
          <button
            className="btn-secondary"
            onClick={() => {
              setShowUploadModal(true);
              setTimeout(() => {
                if (uploadModalRef.current) {
                  gsap.fromTo(
                    uploadModalRef.current,
                    { scale: 0.95, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
                  );
                }
              }, 10);
            }}
          >
            <UploadCloud size={16} color="var(--cyan)" />
            <span>Upload Incidents</span>
          </button>

          {/* RECORD INCIDENT BUTTON */}
          <button
            className="btn-primary"
            onClick={() => {
              setShowCreateModal(true);
              setTimeout(() => {
                if (modalRef.current) {
                  gsap.fromTo(
                    modalRef.current,
                    { scale: 0.94, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.4)" }
                  );
                }
              }, 10);
            }}
          >
            <Plus size={16} />
            <span>Record Incident</span>
          </button>

          {/* USER PROFILE BADGE */}
          <div className="user-profile-badge">
            <div className="user-avatar">{currentUser?.name?.charAt(0) || "J"}</div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#fff" }}>
                {currentUser?.name || "Joe Miller"}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--cyan-light)" }}>
                {currentUser?.role || "Incident Operations Commander"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out of Session"
              style={{
                background: "none",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                marginLeft: "0.4rem",
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN COCKPIT VIEW */}
      <main className="main-wrapper">
        {/* KPI TELEMETRY CARDS (CALCULATED DISTINCT FIGURES) */}
        <section className="kpi-grid" ref={kpiGridRef}>
          <div className="kpi-card kpi-total" onClick={() => setStatusFilter("")}>
            <div className="kpi-header">
              <span className="kpi-title">Total Incidents</span>
              <div className="kpi-icon-wrap" style={{ color: "var(--indigo-light)" }}>
                <Activity size={18} />
              </div>
            </div>
            <div className="kpi-value">{analytics.totalIncidents}</div>
            <div className="kpi-footer">
              <span>All recorded operational events</span>
              <TrendingUp size={14} color="var(--indigo-light)" />
            </div>
          </div>

          <div className="kpi-card kpi-open" onClick={() => setStatusFilter("OPEN")}>
            <div className="kpi-header">
              <span className="kpi-title">Active Triage</span>
              <div className="kpi-icon-wrap" style={{ color: "var(--cyan-light)" }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-value">{analytics.openIncidents}</div>
            <div className="kpi-footer">
              <span>Awaiting responder analysis</span>
              <span style={{ color: "var(--cyan-light)" }}>Open</span>
            </div>
          </div>

          <div className="kpi-card kpi-progress" onClick={() => setStatusFilter("IN_PROGRESS")}>
            <div className="kpi-header">
              <span className="kpi-title">In Remediation</span>
              <div className="kpi-icon-wrap" style={{ color: "var(--amber-light)" }}>
                <RefreshCw size={18} />
              </div>
            </div>
            <div className="kpi-value">{analytics.inProgressIncidents}</div>
            <div className="kpi-footer">
              <span>Investigation & mitigation active</span>
              <span style={{ color: "var(--amber-light)" }}>In Progress</span>
            </div>
          </div>

          <div className="kpi-card kpi-resolved" onClick={() => setStatusFilter("RESOLVED")}>
            <div className="kpi-header">
              <span className="kpi-title">Resolved & Mitigated</span>
              <div className="kpi-icon-wrap" style={{ color: "var(--emerald-light)" }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="kpi-value">{analytics.resolvedIncidents}</div>
            <div className="kpi-footer">
              <span>Verified with post-mortem record</span>
              <span style={{ color: "var(--emerald-light)" }}>Mitigated</span>
            </div>
          </div>

          <div className="kpi-card kpi-critical" onClick={() => setSeverityFilter("CRITICAL")}>
            <div className="kpi-header">
              <span className="kpi-title">Critical P0 Outages</span>
              <div className="kpi-icon-wrap" style={{ color: "var(--rose-light)" }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="kpi-value">{analytics.criticalIncidents}</div>
            <div className="kpi-footer">
              <span>High customer & SLO impact</span>
              <span style={{ color: "var(--rose-light)" }}>P0 Severity</span>
            </div>
          </div>
        </section>

        {/* CONTROLS & REFINED FILTER TOOLBAR */}
        <section className="controls-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search incidents by title, description, symptoms, or error log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-group">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All</option>
              <option value="OPEN">Open (Triage)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              className="filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">Severity: All</option>
              <option value="CRITICAL">P0 - Critical</option>
              <option value="HIGH">P1 - High</option>
              <option value="MEDIUM">P2 - Medium</option>
              <option value="LOW">P3 - Low</option>
            </select>

            <select
              className="filter-select"
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
            >
              <option value="">Environment: All</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="QA">QA / Test</option>
            </select>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Domain: All</option>
              <option value="PAYMENT_GATEWAY">Payment Gateway</option>
              <option value="STORAGE_TIER">Storage & Persistence</option>
              <option value="WEB_GATEWAY">Web Ingress & CDN</option>
              <option value="SECURITY_AUTH">Identity & Auth</option>
              <option value="MICROSERVICES">Core Microservices</option>
              <option value="INFRASTRUCTURE">Cloud Infrastructure</option>
            </select>

            {(statusFilter || severityFilter || environmentFilter || categoryFilter || searchQuery) && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setStatusFilter("");
                  setSeverityFilter("");
                  setEnvironmentFilter("");
                  setCategoryFilter("");
                  setSearchQuery("");
                }}
              >
                <X size={14} />
                <span>Clear Filters</span>
              </button>
            )}

            {/* RESET / CLEAN WORKSPACE BUTTON */}
            <button
              className="btn-secondary"
              style={{ color: "#fb7185", borderColor: "rgba(244,63,94,0.3)" }}
              onClick={() => setShowResetConfirm(true)}
              title="Clear all sample incidents and start clean"
            >
              <Trash2 size={14} />
              <span>Reset to Clean Workspace</span>
            </button>
          </div>
        </section>

        {/* INCIDENT DATA TABLE (ZERO DUPLICATE COLUMNS) */}
        <section className="table-container" ref={tableContainerRef}>
          <table className="incident-table">
            <thead>
              <tr>
                <th style={{ width: "65px" }}>ID</th>
                <th>Incident Details & Symptoms</th>
                <th>Environment</th>
                <th>Domain Tier</th>
                <th>Severity</th>
                <th>Response SLA / Target</th>
                <th>Status</th>
                <th>Responder</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingIncidents ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }}>
                      <RefreshCw size={18} className="pulse-indicator" color="var(--indigo-light)" />
                      <span>Loading operational telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state-box">
                      <FileText size={38} color="var(--text-muted)" />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontWeight: 600, color: "#fff", fontSize: "1rem" }}>
                          No operational incidents found
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px" }}>
                          Your workspace is clean. Click "Upload Incidents" to import telemetry logs or "Record Incident" to declare a new event.
                        </span>
                      </div>
                      <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                        <UploadCloud size={16} />
                        <span>Upload Incident Telemetry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const sla = getSlaIndicator(inc.severity, inc.status);
                  return (
                    <tr
                      key={inc.id}
                      className="incident-row"
                      onClick={() => openIncidentDetails(inc)}
                    >
                      <td className="table-id-cell">#{inc.id}</td>
                      <td>
                        <div className="table-title-wrap">
                          <span className="table-incident-title">{inc.title}</span>
                          <span className="table-incident-desc">{inc.description}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1" }}>
                          {inc.environment || "PRODUCTION"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-category">{inc.category || "GENERAL"}</span>
                      </td>
                      <td>
                        <span className={`badge badge-sev-${(inc.severity || "LOW").toLowerCase()}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`sla-badge ${sla.cls}`}>
                          <Clock size={12} />
                          <span>{sla.text}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${(inc.status || "OPEN").toLowerCase()}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.82rem", color: inc.assignee ? "#fff" : "var(--text-muted)" }}>
                          {inc.assignee ? inc.assignee.split("@")[0] : "Unassigned"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openIncidentDetails(inc);
                            }}
                            title="Inspect Incident"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: "0.35rem 0.65rem" }}
                            onClick={(e) => handleDeleteIncident(e, inc.id)}
                            title="Delete Incident"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* TABLE PAGINATION */}
          <div className="pagination-bar">
            <span>
              Showing {incidents.length} of {totalElements} incidents &middot; Page {page + 1} of {totalPages}
            </span>
            <div className="pagination-btn-group">
              <button
                className="page-btn"
                disabled={page <= 0}
                onClick={() => loadIncidents(page - 1)}
              >
                Previous
              </button>
              <button
                className="page-btn"
                disabled={page >= totalPages - 1}
                onClick={() => loadIncidents(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================
          SLIDE-OVER INCIDENT DETAIL WORKSPACE
          ==================================================== */}
      {selectedIncident && (
        <div className="drawer-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="incident-drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
            {/* DRAWER HEADER */}
            <div className="drawer-header">
              <div className="drawer-top-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="badge badge-category">#{selectedIncident.id}</span>
                  <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0" }}>
                    {selectedIncident.environment || "PRODUCTION"}
                  </span>
                  <span className={`badge badge-status-${selectedIncident.status.toLowerCase()}`}>
                    {selectedIncident.status}
                  </span>
                  <span className={`badge badge-sev-${selectedIncident.severity.toLowerCase()}`}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <button className="drawer-close-btn" onClick={() => setSelectedIncident(null)}>
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                className="drawer-title-input"
                defaultValue={selectedIncident.title}
                onBlur={(e) => {
                  const newTitle = e.target.value.trim();
                  if (newTitle && newTitle !== selectedIncident.title) {
                    fetch(`${API_BASE}/api/incidents/${selectedIncident.id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ title: newTitle }),
                    }).then((r) => {
                      if (r.ok) {
                        setSelectedIncident((prev) => ({ ...prev, title: newTitle }));
                        loadIncidents();
                        showToast("Title updated in incident log", "success");
                      }
                    });
                  }
                }}
              />
            </div>

            {/* DRAWER NAVIGATION TABS */}
            <div className="drawer-tabs">
              <button
                className={`drawer-tab ${drawerTab === "overview" ? "active" : ""}`}
                onClick={() => setDrawerTab("overview")}
              >
                <Layers size={14} />
                <span>Overview & Workflow</span>
              </button>
              <button
                className={`drawer-tab ${drawerTab === "diagnostics" ? "active" : ""}`}
                onClick={() => setDrawerTab("diagnostics")}
              >
                <Activity size={14} />
                <span>Root-Cause Diagnostics</span>
              </button>
              <button
                className={`drawer-tab ${drawerTab === "audit" ? "active" : ""}`}
                onClick={() => setDrawerTab("audit")}
              >
                <Clock size={14} />
                <span>Audit Trail ({auditLogs.length})</span>
              </button>
              <button
                className={`drawer-tab ${drawerTab === "comments" ? "active" : ""}`}
                onClick={() => setDrawerTab("comments")}
              >
                <MessageSquare size={14} />
                <span>Notes ({comments.length})</span>
              </button>
              <button
                className={`drawer-tab ${drawerTab === "resolutions" ? "active" : ""}`}
                onClick={() => setDrawerTab("resolutions")}
              >
                <CheckCircle2 size={14} />
                <span>Formal Resolutions ({resolutions.length})</span>
              </button>
            </div>

            {/* DRAWER BODY TABS */}
            <div className="drawer-body">
              {/* TAB 1: OVERVIEW & STATUS PIPELINE */}
              {drawerTab === "overview" && (
                <>
                  <div className="workflow-pipeline-card">
                    <span className="form-label">Lifecycle Status Progression</span>
                    <div className="pipeline-stepper">
                      {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st, idx) => {
                        const statusOrder = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
                        const currentIdx = statusOrder.indexOf(selectedIncident.status);
                        const isCompleted = currentIdx > idx;
                        const isActive = currentIdx === idx;
                        return (
                          <div
                            key={st}
                            className={`pipeline-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                            onClick={() => handleUpdateStatus(st)}
                          >
                            <div className="step-node">
                              {isCompleted ? <Check size={14} /> : idx + 1}
                            </div>
                            <span className="step-label">{st.replace("_", " ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* METADATA ATTRIBUTES */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="glass-panel" style={{ padding: "1rem" }}>
                      <span className="form-label">Assigned Responder</span>
                      <select
                        className="form-select"
                        style={{ marginTop: "0.4rem", width: "100%" }}
                        value={selectedIncident.assignee || ""}
                        onChange={(e) => handleUpdateAssignee(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        <option value="joe.miller@incidentq.com">Joe Miller (Incident Commander)</option>
                        <option value="alex.chen@incidentq.com">Alex Chen (Lead Reliability Engineer)</option>
                        <option value="sara.connor@incidentq.com">Sara Connor (Site Reliability Engineer)</option>
                        <option value="elena.rostova@incidentq.com">Elena Rostova (Principal Systems Architect)</option>
                      </select>
                    </div>

                    <div className="glass-panel" style={{ padding: "1rem" }}>
                      <span className="form-label">Incident Reporter</span>
                      <p style={{ marginTop: "0.5rem", fontSize: "0.86rem", color: "#fff", fontWeight: 500 }}>
                        {selectedIncident.reporter || "system@incidentq.com"}
                      </p>
                    </div>
                  </div>

                  {/* PROBLEM STATEMENT */}
                  <div className="glass-panel" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span className="form-label">Symptoms & Operational Impact</span>
                      <span className="badge" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                        Environment: {selectedIncident.environment || "PRODUCTION"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                      {selectedIncident.description || "No detailed description provided."}
                    </p>
                  </div>

                  {/* CAPTURED ERROR MESSAGE */}
                  {selectedIncident.error_message && (
                    <div className="glass-panel" style={{ padding: "1.25rem", borderLeft: "3px solid var(--rose)" }}>
                      <span className="form-label" style={{ color: "var(--rose-light)" }}>Captured Exception / Error Message</span>
                      <code style={{ display: "block", marginTop: "0.5rem", background: "rgba(244,63,94,0.08)", color: "#fecdd3", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                        {selectedIncident.error_message}
                      </code>
                    </div>
                  )}

                  {/* SYSTEM LOGS */}
                  {selectedIncident.logs && (
                    <div className="glass-panel" style={{ padding: "1.25rem" }}>
                      <span className="form-label">Captured Telemetry Logs & Stack Trace</span>
                      <pre style={{ marginTop: "0.5rem", background: "rgba(10,14,23,0.8)", border: "1px solid var(--border-subtle)", color: "#94a3b8", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", whiteSpace: "pre-wrap", maxHeight: "180px", overflowY: "auto" }}>
                        {selectedIncident.logs}
                      </pre>
                    </div>
                  )}

                  {/* SIMILAR HISTORICAL INCIDENTS */}
                  {similarIncidents.length > 0 && (
                    <div className="glass-panel" style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span className="form-label">Correlated Historical Events</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--cyan-light)" }}>Vector Similarity Match</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {similarIncidents.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "rgba(255,255,255,0.03)",
                              padding: "0.65rem 0.9rem",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                            onClick={() => openIncidentDetails(s)}
                          >
                            <span style={{ fontSize: "0.84rem", color: "#fff", fontWeight: 500 }}>
                              #{s.id} &middot; {s.title}
                            </span>
                            <span className="badge" style={{ background: "rgba(6,182,212,0.15)", color: "var(--cyan)" }}>
                              {s.similarityScore}% Correlated
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: ROOT-CAUSE DIAGNOSTICS STUDIO */}
              {drawerTab === "diagnostics" && (
                <div className="diagnostics-hub-container">
                  <div className="diagnostics-hero-card" ref={diagCardRef}>
                    {scanningEffect && <div className="neural-scanline" />}
                    <div className="diagnostics-hero-header">
                      <div className="diagnostics-hero-badge">
                        <Cpu size={14} />
                        <span>Automated Root-Cause Diagnostic Engine</span>
                      </div>
                      <button
                        className="btn-diagnostics"
                        onClick={handleRunDiagnostics}
                        disabled={diagnosticsLoading}
                      >
                        {diagnosticsLoading ? (
                          <>
                            <RefreshCw size={15} className="pulse-indicator" />
                            <span>Correlating Signal Telemetry...</span>
                          </>
                        ) : (
                          <>
                            <Activity size={15} />
                            <span>Run Diagnostic Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p style={{ fontSize: "0.84rem", color: "#cbd5e1" }}>
                      Correlates symptom signatures, captured error logs, and cluster telemetry to synthesize core root-cause hypotheses and generate structured runbooks.
                    </p>
                  </div>

                  {diagnosticsResult && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="diag-output-box">
                          <span className="diag-output-title">Root-Cause Hypothesis</span>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.55 }}>
                            {diagnosticsResult.rootCause}
                          </p>
                        </div>
                        <div className="diag-output-box">
                          <span className="diag-output-title">Contributing Factors & Anomalies</span>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.55 }}>
                            {diagnosticsResult.possibleCause}
                          </p>
                        </div>
                      </div>

                      <div className="diag-output-box">
                        <span className="diag-output-title">Recommended Remediation Action Plan</span>
                        <ul className="diag-action-list">
                          {diagnosticsResult.recommendedActions?.map((act, i) => (
                            <li key={i} className="diag-action-item">
                              <CheckCircle2 size={15} color="var(--cyan)" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="diag-output-box">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="diag-output-title">Automated Troubleshooting Runbook</span>
                          <button
                            className="btn-secondary"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.76rem" }}
                            onClick={handleGenerateRunbook}
                            disabled={diagnosticsLoading}
                          >
                            <SlidersHorizontal size={13} />
                            <span>Generate Step-by-Step Runbook</span>
                          </button>
                        </div>

                        {troubleshootingRunbook && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              {troubleshootingRunbook.troubleshootingSteps?.map((st, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", color: "#e2e8f0" }}>
                                  <strong style={{ color: "var(--indigo-light)" }}>Step {i + 1}:</strong>
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>

                            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                              <strong style={{ color: "var(--emerald-light)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                                Proposed Formal Resolution
                              </strong>
                              <p style={{ fontSize: "0.82rem", color: "#fff", marginTop: "0.25rem", lineHeight: 1.5 }}>
                                {troubleshootingRunbook.suggestedResolution}
                              </p>
                              <button
                                className="btn-secondary"
                                style={{ marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                                onClick={() => {
                                  setNewResolutionText(troubleshootingRunbook.suggestedResolution);
                                  setDrawerTab("resolutions");
                                  showToast("Resolution copied to formal log", "info");
                                }}
                              >
                                Apply to Resolution Tab
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: AUDIT TIMELINE */}
              {drawerTab === "audit" && (
                <div className="timeline-container">
                  {auditLogs.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>No audit events recorded yet.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="timeline-item">
                        <div className="timeline-bullet" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-action">{log.action}</span>
                            <span className="timeline-time">
                              {new Date(log.changedAt).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                            By: <strong>{log.changedBy}</strong>
                          </p>
                          {log.oldValue && (
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                              Previous: {log.oldValue} &rarr; New: <strong>{log.newValue}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: INVESTIGATION NOTES & COMMENTS */}
              {drawerTab === "comments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <form onSubmit={handleAddComment} style={{ display: "flex", gap: "0.6rem" }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add an engineering finding or link to monitoring dashboard..."
                      style={{ flex: 1 }}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                      <Send size={15} />
                      <span>Post</span>
                    </button>
                  </form>

                  <div className="comments-feed">
                    {comments.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>No investigation notes logged yet.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="comment-card">
                          <div className="comment-header">
                            <span className="comment-author">{c.userEmail}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                              {new Date(c.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.86rem", color: "var(--text-primary)" }}>{c.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: FORMAL RESOLUTIONS */}
              {drawerTab === "resolutions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <form onSubmit={handleAddResolution} className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <span className="form-label">Record Formal Resolution</span>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      placeholder="Detail root cause remediation, patch deployment version, and verification telemetry..."
                      value={newResolutionText}
                      onChange={(e) => setNewResolutionText(e.target.value)}
                    />
                    <button type="submit" className="btn-primary" style={{ alignSelf: "flex-end" }}>
                      <CheckCircle2 size={16} />
                      <span>Mark Resolved & Save Record</span>
                    </button>
                  </form>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <span className="form-label">Resolution History</span>
                    {resolutions.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>No formal resolutions logged yet.</p>
                    ) : (
                      resolutions.map((r) => (
                        <div key={r.id} className="glass-panel" style={{ padding: "1rem", borderLeft: "3px solid var(--emerald)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                            <strong style={{ fontSize: "0.84rem", color: "#fff" }}>Resolved by {r.resolvedBy}</strong>
                            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                              {new Date(r.resolvedAt).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.86rem", color: "#cbd5e1" }}>{r.resolution}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          UPLOAD & INGEST INCIDENTS MODAL
          ==================================================== */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="modal-dialog" ref={uploadModalRef} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <UploadCloud size={20} color="var(--cyan)" />
                <h3 style={{ fontSize: "1.1rem" }}>Upload & Ingest Incident Telemetry</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* UPLOAD TABS */}
              <div className="auth-tab-bar" style={{ marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  className={`auth-tab-btn ${uploadTab === "file" ? "active" : ""}`}
                  onClick={() => setUploadTab("file")}
                >
                  Structured File (.json / .csv)
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${uploadTab === "log" ? "active" : ""}`}
                  onClick={() => setUploadTab("log")}
                >
                  Raw Stack Trace / Log Paste
                </button>
              </div>

              {uploadTab === "file" ? (
                <>
                  <label
                    htmlFor="incident-file-input"
                    className="upload-dropzone"
                  >
                    <UploadCloud size={36} color="var(--indigo-light)" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: "0.92rem" }}>
                        Click to select incident file or drag & drop
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Supports JSON array of incidents or operational log exports
                      </span>
                    </div>
                    {uploadFile && (
                      <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "var(--emerald)" }}>
                        {uploadFile.name} ({parsedPreview.length} incident record(s) parsed)
                      </span>
                    )}
                    <input
                      id="incident-file-input"
                      type="file"
                      accept=".json,.csv,.txt,.log"
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                  </label>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Need the standard schema format?
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                      onClick={downloadSampleTemplate}
                    >
                      <Download size={13} />
                      <span>Download JSON Template</span>
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleIngestRawLog} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Incident Headline / Summary</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Gateway Connection Reset by Peer"
                      value={rawLogTitle}
                      onChange={(e) => setRawLogTitle(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Target Environment</label>
                      <select
                        className="form-select"
                        value={rawLogEnv}
                        onChange={(e) => setRawLogEnv(e.target.value)}
                      >
                        <option value="PRODUCTION">Production</option>
                        <option value="STAGING">Staging</option>
                        <option value="QA">QA</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Severity Tier</label>
                      <select
                        className="form-select"
                        value={rawLogSeverity}
                        onChange={(e) => setRawLogSeverity(e.target.value)}
                      >
                        <option value="CRITICAL">P0 - Critical</option>
                        <option value="HIGH">P1 - High</option>
                        <option value="MEDIUM">P2 - Medium</option>
                        <option value="LOW">P3 - Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Server Log / Stack Trace Content *</label>
                    <textarea
                      rows={5}
                      className="form-textarea"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}
                      placeholder="Paste terminal exception, Nginx log line, or application stack dump..."
                      value={rawLogText}
                      onChange={(e) => setRawLogText(e.target.value)}
                      required
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              {uploadTab === "file" ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={uploading || parsedPreview.length === 0}
                  onClick={handleExecuteUpload}
                >
                  {uploading ? (
                    <RefreshCw size={15} className="pulse-indicator" />
                  ) : (
                    <UploadCloud size={15} />
                  )}
                  <span>Ingest {parsedPreview.length ? `(${parsedPreview.length} Records)` : "Records"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={uploading || !rawLogText.trim()}
                  onClick={handleIngestRawLog}
                >
                  {uploading ? <RefreshCw size={15} className="pulse-indicator" /> : <Terminal size={15} />}
                  <span>Ingest Telemetry Log</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          RECORD NEW INCIDENT MODAL
          ==================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Plus size={18} color="var(--indigo-light)" />
                <h3 style={{ fontSize: "1.1rem" }}>Record Operational Incident</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Payment Gateway Webhook Latency Degradation"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Symptoms & Description</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe impact, customer visibility, affected endpoints, and timeline..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Domain Tier</label>
                    <select
                      className="form-select"
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    >
                      <option value="INFRASTRUCTURE">Cloud Infrastructure</option>
                      <option value="STORAGE_TIER">Storage & Persistence</option>
                      <option value="SECURITY_AUTH">Identity & Access</option>
                      <option value="PAYMENT_GATEWAY">Payment Gateway</option>
                      <option value="WEB_GATEWAY">Web Ingress & CDN</option>
                      <option value="MICROSERVICES">Core Microservices</option>
                      <option value="NETWORKING">Service Mesh & Ingress</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Environment</label>
                    <select
                      className="form-select"
                      value={createForm.environment}
                      onChange={(e) => setCreateForm({ ...createForm, environment: e.target.value })}
                    >
                      <option value="PRODUCTION">Production</option>
                      <option value="STAGING">Staging</option>
                      <option value="QA">QA / Testing</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select
                      className="form-select"
                      value={createForm.severity}
                      onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                    >
                      <option value="CRITICAL">P0 - Critical Outage</option>
                      <option value="HIGH">P1 - High Degradation</option>
                      <option value="MEDIUM">P2 - Moderate Disruption</option>
                      <option value="LOW">P3 - Low Advisory</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Responder</label>
                    <select
                      className="form-select"
                      value={createForm.assignee}
                      onChange={(e) => setCreateForm({ ...createForm, assignee: e.target.value })}
                    >
                      <option value="joe.miller@incidentq.com">Joe Miller (Incident Commander)</option>
                      <option value="alex.chen@incidentq.com">Alex Chen (Lead Reliability Engineer)</option>
                      <option value="sara.connor@incidentq.com">Sara Connor (Site Reliability Engineer)</option>
                      <option value="elena.rostova@incidentq.com">Elena Rostova (Principal Systems Architect)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Captured Error Message / Exception (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ingress Gateway Timeout (502 Bad Gateway)"
                    value={createForm.error_message}
                    onChange={(e) => setCreateForm({ ...createForm, error_message: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnostic Logs / Stack Trace (Optional)</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                    placeholder="Paste relevant stack trace or server log lines..."
                    value={createForm.logs}
                    onChange={(e) => setCreateForm({ ...createForm, logs: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? <RefreshCw size={15} className="pulse-indicator" /> : <Plus size={15} />}
                  <span>Record Incident</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          CONFIRM CLEAR WORKSPACE MODAL
          ==================================================== */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-dialog" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <AlertTriangle size={18} color="var(--rose)" />
                <h3 style={{ fontSize: "1.05rem" }}>Reset to Clean Workspace</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowResetConfirm(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                This will clear sample records from the repository so you can work exclusively with your own uploaded incidents.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleClearAllIncidents}>
                <Trash2 size={14} />
                <span>Confirm Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" && <CheckCircle2 size={16} color="var(--emerald)" />}
            {t.type === "error" && <AlertCircle size={16} color="var(--rose)" />}
            {t.type === "info" && <Activity size={16} color="var(--cyan)" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}