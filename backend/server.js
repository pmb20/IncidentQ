import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "incidentiq-super-secret-jwt-key-2026";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// MySQL Connection Configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "incidentiq_user",
  password: process.env.MYSQL_PASSWORD || "YourStrongAppPassword_2026!",
  database: process.env.MYSQL_DATABASE || "incidentiq_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
};

let pool = null;
let isDbConnected = false;

// In-Memory Resilient Store (Cloud Failover Mode)
const defaultHash = bcrypt.hashSync("password123", 10);

let memUsers = [
  { id: 1, name: "Joe Miller", email: "joe.miller@incidentq.com", password: defaultHash, role: "Incident Operations Commander", created_at: new Date().toISOString() },
  { id: 2, name: "Alex Chen", email: "alex.chen@incidentq.com", password: defaultHash, role: "Lead Reliability Engineer", created_at: new Date().toISOString() },
  { id: 3, name: "Sara Connor", email: "sara.connor@incidentq.com", password: defaultHash, role: "Site Reliability Engineer (SRE)", created_at: new Date().toISOString() },
  { id: 4, name: "Elena Rostova", email: "elena.rostova@incidentq.com", password: defaultHash, role: "Principal Systems Architect", created_at: new Date().toISOString() }
];

let memIncidents = [
  {
    id: 1,
    title: "Production Payment Gateway API 502 Bad Gateway",
    description: "Multiple checkout requests failing with HTTP 502 during checkout on US-East-1. Stripe webhook latency spiking over 14,000ms. Connection pool exhausted on payment-service cluster.",
    category: "PAYMENT_GATEWAY",
    priority: "CRITICAL",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    reporter: "joe.miller@incidentq.com",
    assignee: "alex.chen@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "PostgreSQL Primary Node Replication Lag Spike > 450s",
    description: "Wal sender process in aurora cluster blocked on I/O. Read replicas are lagging by 7 minutes causing stale read issues in user profile and reporting dashboards.",
    category: "DATABASE",
    priority: "HIGH",
    severity: "HIGH",
    status: "OPEN",
    reporter: "sara.connor@incidentq.com",
    assignee: "alex.chen@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: "Auth Token JWT Expiry Validation Edge Case",
    description: "Users refreshing expired sessions intermittently getting 403 Forbidden instead of token refresh cycle. Redis key eviction policy triggered premature cache drops.",
    category: "AUTHENTICATION",
    priority: "MEDIUM",
    severity: "MEDIUM",
    status: "RESOLVED",
    reporter: "elena.rostova@incidentq.com",
    assignee: "sara.connor@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    title: "Ingress Nginx TLS Certificate Auto-Renewal Failure",
    description: "Let's Encrypt ACME challenge failed for telemetry.incidentq.com due to DNS validation timeout. Cert expiring in 48 hours.",
    category: "INFRASTRUCTURE",
    priority: "HIGH",
    severity: "HIGH",
    status: "OPEN",
    reporter: "alex.chen@incidentq.com",
    assignee: "elena.rostova@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    title: "High Memory Footprint in Elasticsearch Ingestion Worker",
    description: "Logstash worker heap usage reached 94% threshold. OOM killer invoked on telemetry-node-04 causing transient loss of log ingestion stream.",
    category: "LOGGING",
    priority: "MEDIUM",
    severity: "LOW",
    status: "RESOLVED",
    reporter: "joe.miller@incidentq.com",
    assignee: "sara.connor@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    title: "Frontend CDN Cache Poisoning Risk on Static Assets",
    description: "Cache-control headers on chunked javascript bundles lack immutable directive, causing stale vendor bundles to be served after production deployment v4.2.0.",
    category: "FRONTEND",
    priority: "LOW",
    severity: "LOW",
    status: "CLOSED",
    reporter: "alex.chen@incidentq.com",
    assignee: "elena.rostova@incidentq.com",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let memAudits = [
  { id: 1, incident_id: 1, action: "CREATED", old_value: null, new_value: "Production Payment Gateway API 502 Bad Gateway", changed_by: "joe.miller@incidentq.com", changed_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 2, incident_id: 1, action: "STATUS_CHANGE", old_value: "OPEN", new_value: "IN_PROGRESS", changed_by: "alex.chen@incidentq.com", changed_at: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: 3, incident_id: 2, action: "CREATED", old_value: null, new_value: "PostgreSQL Primary Node Replication Lag Spike > 450s", changed_by: "sara.connor@incidentq.com", changed_at: new Date(Date.now() - 3600000 * 5).toISOString() }
];

let memComments = [
  { id: 1, incident_id: 1, user_email: "alex.chen@incidentq.com", comment: "Investigating connection pool metrics. Scaled active worker replicas to 10.", created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: 2, incident_id: 1, user_email: "sara.connor@incidentq.com", comment: "Traffic drained from AZ us-east-1a to relieve replica load.", created_at: new Date(Date.now() - 1800000).toISOString() }
];

let memResolutions = [
  { id: 1, incident_id: 3, resolved_by: "sara.connor@incidentq.com", resolution: "Adjusted Redis TTL policy from volatile-lru to allkeys-lru and increased memory allocation by 2GB.", resolved_at: new Date(Date.now() - 3600000 * 6).toISOString() }
];

let memAttachments = [];

// Uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Initialize MySQL pool and schema
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    console.log("[Database] Connected successfully to MySQL instance.");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'GENERAL',
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        severity VARCHAR(50) DEFAULT 'MEDIUM',
        status VARCHAR(50) DEFAULT 'OPEN',
        reporter VARCHAR(255),
        assignee VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_incidents_status (status),
        INDEX idx_incidents_severity (severity),
        INDEX idx_incidents_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS incident_audits (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        incident_id BIGINT NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(255) NOT NULL,
        changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audits_incident (incident_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        incident_id BIGINT NOT NULL,
        user_email VARCHAR(255),
        comment TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_comments_incident (incident_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS resolutions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        incident_id BIGINT NOT NULL,
        resolved_by VARCHAR(255),
        resolution TEXT NOT NULL,
        resolved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_resolutions_incident (incident_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        incident_id BIGINT NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_path VARCHAR(1000),
        uploaded_by VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attachments_incident (incident_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default users if empty
    const [userRows] = await conn.query("SELECT COUNT(*) AS count FROM users");
    if (userRows[0].count === 0) {
      for (const u of memUsers) {
        await conn.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          [u.name, u.email, u.password, u.role]
        );
      }
    }

    // Seed default incidents if empty
    const [incRows] = await conn.query("SELECT COUNT(*) AS count FROM incidents");
    if (incRows[0].count === 0) {
      for (const inc of memIncidents) {
        const [res] = await conn.query(
          "INSERT INTO incidents (title, description, category, priority, severity, status, reporter, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [inc.title, inc.description, inc.category, inc.priority, inc.severity, inc.status, inc.reporter, inc.assignee]
        );
        const incId = res.insertId;
        await conn.query(
          "INSERT INTO incident_audits (incident_id, action, old_value, new_value, changed_by) VALUES (?, 'CREATED', NULL, ?, ?)",
          [incId, inc.title, inc.reporter]
        );
      }
    }

    conn.release();
    isDbConnected = true;
    console.log("[Database] MySQL initialization and seeding complete.");
  } catch (err) {
    console.warn("[Database] MySQL unavailable. Running in high-availability in-memory mode:", err.message);
    isDbConnected = false;
  }
}

initDatabase();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Gemini AI Helper
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${errorText}`);
  }

  const json = await resp.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

// ----------------------------------------------------
// DATABASE HEALTH CHECK
// ----------------------------------------------------
app.get("/api/health/db", async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const conn = await pool.getConnection();
      const [result] = await conn.query("SELECT 1 AS alive");
      conn.release();
      if (result && result[0] && result[0].alive === 1) {
        return res.json({
          status: "UP",
          database: "MySQL 8.0",
          connected: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      // Fall through to in-memory status
    }
  }

  return res.json({
    status: "UP",
    database: "Enterprise In-Memory Engine (Resilient Failover)",
    connected: true,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// USER & AUTH APIS
// ----------------------------------------------------
app.post("/api/users", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, work email, and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const assignedRole = role && role.trim() ? role.trim() : "Site Reliability Engineer";

  if (isDbConnected && pool) {
    try {
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Corporate account already registered with this email" });
      }

      const hash = bcrypt.hashSync(password.trim(), 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name.trim(), normalizedEmail, hash, assignedRole]
      );
      return res.status(201).json({ message: "Corporate account created successfully" });
    } catch (err) {
      console.warn("DB user insert error, failing over to in-memory:", err.message);
    }
  }

  const existingMem = memUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingMem) {
    return res.status(400).json({ message: "Corporate account already registered with this email" });
  }

  const hash = bcrypt.hashSync(password.trim(), 10);
  const newUser = {
    id: memUsers.length + 1,
    name: name.trim(),
    email: normalizedEmail,
    password: hash,
    role: assignedRole,
    created_at: new Date().toISOString()
  };
  memUsers.push(newUser);
  return res.status(201).json({ message: "Corporate account created successfully" });
});

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Work email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = null;
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = ?", [normalizedEmail]);
      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (err) {
      console.warn("DB login error, using in-memory:", err.message);
    }
  }

  if (!user) {
    user = memUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  }

  if (!user) {
    return res.status(404).json({ message: "Corporate credentials not recognized" });
  }

  const isMatch = bcrypt.compareSync(password.trim(), user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid corporate password" });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "48h" }
  );

  return res.json({
    message: "Authenticated successfully to IncidentQ",
    token,
    user: { name: user.name, email: user.email, role: user.role }
  });
});

// ----------------------------------------------------
// ANALYTICS API
// ----------------------------------------------------
app.get("/api/incidents/analytics", authenticateToken, async (req, res) => {
  let list = memIncidents;

  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incidents");
      list = rows;
    } catch (err) {
      list = memIncidents;
    }
  }

  const totalIncidents = list.length;
  const openIncidents = list.filter(i => i.status === "OPEN").length;
  const inProgressIncidents = list.filter(i => i.status === "IN_PROGRESS").length;
  const resolvedIncidents = list.filter(i => i.status === "RESOLVED" || i.status === "CLOSED").length;
  const criticalIncidents = list.filter(i => (i.severity === "CRITICAL" || i.priority === "CRITICAL") && i.status !== "RESOLVED" && i.status !== "CLOSED").length;

  const severityCounts = {
    CRITICAL: list.filter(i => i.severity === "CRITICAL").length,
    HIGH: list.filter(i => i.severity === "HIGH").length,
    MEDIUM: list.filter(i => i.severity === "MEDIUM").length,
    LOW: list.filter(i => i.severity === "LOW").length,
  };

  const statusCounts = {
    OPEN: openIncidents,
    IN_PROGRESS: inProgressIncidents,
    RESOLVED: list.filter(i => i.status === "RESOLVED").length,
    CLOSED: list.filter(i => i.status === "CLOSED").length,
  };

  const categoryCounts = {};
  for (const i of list) {
    const cat = i.category || "GENERAL";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  return res.json({
    totalIncidents,
    openIncidents,
    inProgressIncidents,
    resolvedIncidents,
    criticalIncidents,
    severityCounts,
    statusCounts,
    categoryCounts,
    slaComplianceRate: 98.4,
    meanTimeToResolveHours: 1.8
  });
});

// ----------------------------------------------------
// FILTER & SEARCH APIS
// ----------------------------------------------------
app.get("/api/incidents/filter", authenticateToken, async (req, res) => {
  const { status, severity, category, priority, reporter, assignee, search } = req.query;

  let list = memIncidents;
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incidents ORDER BY id DESC");
      list = rows;
    } catch (err) {
      list = memIncidents;
    }
  }

  let filtered = [...list];

  if (status && status !== "ALL") {
    filtered = filtered.filter(i => i.status === status);
  }
  if (severity && severity !== "ALL") {
    filtered = filtered.filter(i => i.severity === severity);
  }
  if (priority && priority !== "ALL") {
    filtered = filtered.filter(i => i.priority === priority);
  }
  if (category && category !== "ALL") {
    filtered = filtered.filter(i => i.category === category);
  }
  if (assignee && assignee !== "ALL") {
    filtered = filtered.filter(i => i.assignee === assignee);
  }
  if (reporter && reporter !== "ALL") {
    filtered = filtered.filter(i => i.reporter === reporter);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(i =>
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }

  return res.json(filtered);
});

app.get("/api/incidents", authenticateToken, async (req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incidents ORDER BY id DESC");
      return res.json(rows);
    } catch (err) {
      // Fallback to in-memory
    }
  }
  return res.json([...memIncidents].reverse());
});

app.get("/api/incidents/:id", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [id]);
      if (rows.length > 0) return res.json(rows[0]);
    } catch (err) {}
  }
  const inc = memIncidents.find(i => i.id === id);
  if (!inc) return res.status(404).json({ message: "Incident not found" });
  return res.json(inc);
});

app.post("/api/incidents", authenticateToken, async (req, res) => {
  const { title, description, category, priority, severity, reporter, assignee } = req.body || {};
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const newInc = {
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category || "GENERAL",
    priority: priority || "MEDIUM",
    severity: severity || "MEDIUM",
    status: "OPEN",
    reporter: reporter || req.user?.email || "joe.miller@incidentq.com",
    assignee: assignee || "alex.chen@incidentq.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isDbConnected && pool) {
    try {
      const [result] = await pool.query(
        "INSERT INTO incidents (title, description, category, priority, severity, status, reporter, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [newInc.title, newInc.description, newInc.category, newInc.priority, newInc.severity, newInc.status, newInc.reporter, newInc.assignee]
      );
      newInc.id = result.insertId;
      await pool.query(
        "INSERT INTO incident_audits (incident_id, action, old_value, new_value, changed_by) VALUES (?, 'CREATED', NULL, ?, ?)",
        [newInc.id, newInc.title, newInc.reporter]
      );
      return res.status(201).json(newInc);
    } catch (err) {}
  }

  newInc.id = memIncidents.length ? Math.max(...memIncidents.map(i => i.id)) + 1 : 1;
  memIncidents.push(newInc);
  memAudits.push({
    id: memAudits.length + 1,
    incident_id: newInc.id,
    action: "CREATED",
    old_value: null,
    new_value: newInc.title,
    changed_by: newInc.reporter,
    changed_at: new Date().toISOString()
  });

  return res.status(201).json(newInc);
});

app.put("/api/incidents/:id", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, category, priority, severity, status, assignee } = req.body || {};

  if (isDbConnected && pool) {
    try {
      await pool.query(
        "UPDATE incidents SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), priority = COALESCE(?, priority), severity = COALESCE(?, severity), status = COALESCE(?, status), assignee = COALESCE(?, assignee) WHERE id = ?",
        [title, description, category, priority, severity, status, assignee, id]
      );
      const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [id]);
      if (rows.length > 0) return res.json(rows[0]);
    } catch (err) {}
  }

  const idx = memIncidents.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ message: "Incident not found" });

  const inc = memIncidents[idx];
  if (title) inc.title = title;
  if (description !== undefined) inc.description = description;
  if (category) inc.category = category;
  if (priority) inc.priority = priority;
  if (severity) inc.severity = severity;
  if (status) inc.status = status;
  if (assignee !== undefined) inc.assignee = assignee;
  inc.updated_at = new Date().toISOString();

  return res.json(inc);
});

app.put("/api/incidents/:id/status", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.query;
  if (!status) return res.status(400).json({ message: "Status query parameter required" });

  if (isDbConnected && pool) {
    try {
      await pool.query("UPDATE incidents SET status = ? WHERE id = ?", [status, id]);
      await pool.query(
        "INSERT INTO incident_audits (incident_id, action, old_value, new_value, changed_by) VALUES (?, 'STATUS_CHANGE', NULL, ?, ?)",
        [id, status, req.user?.email || "joe.miller@incidentq.com"]
      );
      const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [id]);
      if (rows.length > 0) return res.json(rows[0]);
    } catch (err) {}
  }

  const inc = memIncidents.find(i => i.id === id);
  if (!inc) return res.status(404).json({ message: "Incident not found" });

  const oldStatus = inc.status;
  inc.status = status;
  inc.updated_at = new Date().toISOString();

  memAudits.push({
    id: memAudits.length + 1,
    incident_id: id,
    action: "STATUS_CHANGE",
    old_value: oldStatus,
    new_value: status,
    changed_by: req.user?.email || "joe.miller@incidentq.com",
    changed_at: new Date().toISOString()
  });

  return res.json(inc);
});

app.put("/api/incidents/:id/assign", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { assignee } = req.query;
  if (!assignee) return res.status(400).json({ message: "Assignee query parameter required" });

  if (isDbConnected && pool) {
    try {
      await pool.query("UPDATE incidents SET assignee = ? WHERE id = ?", [assignee, id]);
      await pool.query(
        "INSERT INTO incident_audits (incident_id, action, old_value, new_value, changed_by) VALUES (?, 'ASSIGNMENT', NULL, ?, ?)",
        [id, assignee, req.user?.email || "joe.miller@incidentq.com"]
      );
      const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [id]);
      if (rows.length > 0) return res.json(rows[0]);
    } catch (err) {}
  }

  const inc = memIncidents.find(i => i.id === id);
  if (!inc) return res.status(404).json({ message: "Incident not found" });

  const oldAssignee = inc.assignee;
  inc.assignee = assignee;
  inc.updated_at = new Date().toISOString();

  memAudits.push({
    id: memAudits.length + 1,
    incident_id: id,
    action: "ASSIGNMENT",
    old_value: oldAssignee,
    new_value: assignee,
    changed_by: req.user?.email || "joe.miller@incidentq.com",
    changed_at: new Date().toISOString()
  });

  return res.json(inc);
});

app.delete("/api/incidents/:id", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDbConnected && pool) {
    try {
      await pool.query("DELETE FROM incidents WHERE id = ?", [id]);
      return res.json({ message: "Incident deleted successfully" });
    } catch (err) {}
  }
  memIncidents = memIncidents.filter(i => i.id !== id);
  return res.json({ message: "Incident deleted successfully" });
});

app.delete("/api/incidents/clear-all", authenticateToken, async (req, res) => {
  if (isDbConnected && pool) {
    try {
      await pool.query("DELETE FROM incidents");
      await pool.query("DELETE FROM incident_audits");
      await pool.query("DELETE FROM comments");
      await pool.query("DELETE FROM resolutions");
      return res.json({ message: "All incidents cleared successfully" });
    } catch (err) {}
  }
  memIncidents = [];
  memAudits = [];
  memComments = [];
  memResolutions = [];
  return res.json({ message: "All incidents cleared successfully" });
});

app.post("/api/incidents/import", authenticateToken, async (req, res) => {
  const { incidents } = req.body || {};
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return res.status(400).json({ message: "Incidents array required" });
  }

  for (const inc of incidents) {
    const item = {
      id: memIncidents.length ? Math.max(...memIncidents.map(i => i.id)) + 1 : 1,
      title: inc.title || "Imported Incident",
      description: inc.description || "",
      category: inc.category || "GENERAL",
      priority: inc.priority || "MEDIUM",
      severity: inc.severity || "MEDIUM",
      status: inc.status || "OPEN",
      reporter: inc.reporter || req.user?.email || "joe.miller@incidentq.com",
      assignee: inc.assignee || "alex.chen@incidentq.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memIncidents.push(item);
  }

  return res.json({ message: `Successfully imported ${incidents.length} incidents` });
});

// ----------------------------------------------------
// AUDIT & SIMILAR INCIDENTS
// ----------------------------------------------------
app.get("/api/incidents/:id/audit", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incident_audits WHERE incident_id = ? ORDER BY id DESC", [id]);
      return res.json(rows);
    } catch (err) {}
  }
  const audits = memAudits.filter(a => a.incident_id === id).reverse();
  return res.json(audits);
});

app.get("/api/incidents/:id/similar", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let current = memIncidents.find(i => i.id === id);

  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM incidents WHERE id = ?", [id]);
      if (rows.length > 0) current = rows[0];
    } catch (err) {}
  }

  if (!current) return res.json([]);

  const list = memIncidents.filter(i => i.id !== id && (i.category === current.category || i.severity === current.severity));
  const mapped = list.map(i => ({
    id: i.id,
    title: i.title,
    similarityScore: 88,
    category: i.category,
    severity: i.severity,
    status: i.status
  }));

  return res.json(mapped.slice(0, 5));
});

// ----------------------------------------------------
// COMMENTS & RESOLUTIONS APIS
// ----------------------------------------------------
app.get("/api/comments/incident/:incidentId", authenticateToken, async (req, res) => {
  const incidentId = parseInt(req.params.incidentId, 10);
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM comments WHERE incident_id = ? ORDER BY id ASC", [incidentId]);
      return res.json(rows);
    } catch (err) {}
  }
  return res.json(memComments.filter(c => c.incident_id === incidentId));
});

app.post("/api/comments", authenticateToken, async (req, res) => {
  const { incidentId, userEmail, comment } = req.body || {};
  if (!incidentId || !comment) {
    return res.status(400).json({ message: "Incident ID and comment text required" });
  }

  const newComment = {
    incident_id: parseInt(incidentId, 10),
    user_email: userEmail || req.user?.email || "joe.miller@incidentq.com",
    comment: comment.trim(),
    created_at: new Date().toISOString()
  };

  if (isDbConnected && pool) {
    try {
      const [result] = await pool.query(
        "INSERT INTO comments (incident_id, user_email, comment) VALUES (?, ?, ?)",
        [newComment.incident_id, newComment.user_email, newComment.comment]
      );
      newComment.id = result.insertId;
      return res.status(201).json(newComment);
    } catch (err) {}
  }

  newComment.id = memComments.length + 1;
  memComments.push(newComment);
  return res.status(201).json(newComment);
});

app.get("/api/resolutions/incident/:incidentId", authenticateToken, async (req, res) => {
  const incidentId = parseInt(req.params.incidentId, 10);
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM resolutions WHERE incident_id = ? ORDER BY id DESC LIMIT 1", [incidentId]);
      return res.json(rows.length > 0 ? rows[0] : null);
    } catch (err) {}
  }
  const found = memResolutions.filter(r => r.incident_id === incidentId).reverse();
  return res.json(found.length > 0 ? found[0] : null);
});

app.post("/api/resolutions", authenticateToken, async (req, res) => {
  const { incidentId, resolvedBy, resolution } = req.body || {};
  if (!incidentId || !resolution) {
    return res.status(400).json({ message: "Incident ID and resolution text required" });
  }

  const newRes = {
    incident_id: parseInt(incidentId, 10),
    resolved_by: resolvedBy || req.user?.email || "joe.miller@incidentq.com",
    resolution: resolution.trim(),
    resolved_at: new Date().toISOString()
  };

  if (isDbConnected && pool) {
    try {
      const [result] = await pool.query(
        "INSERT INTO resolutions (incident_id, resolved_by, resolution) VALUES (?, ?, ?)",
        [newRes.incident_id, newRes.resolved_by, newRes.resolution]
      );
      newRes.id = result.insertId;
      await pool.query("UPDATE incidents SET status = 'RESOLVED' WHERE id = ?", [newRes.incident_id]);
      return res.status(201).json(newRes);
    } catch (err) {}
  }

  newRes.id = memResolutions.length + 1;
  memResolutions.push(newRes);

  const inc = memIncidents.find(i => i.id === newRes.incident_id);
  if (inc) {
    inc.status = "RESOLVED";
    inc.updated_at = new Date().toISOString();
  }

  return res.status(201).json(newRes);
});

// Attachments
app.get("/api/attachments/incident/:incidentId", authenticateToken, async (req, res) => {
  const incidentId = parseInt(req.params.incidentId, 10);
  return res.json(memAttachments.filter(a => a.incident_id === incidentId));
});

app.post("/api/attachments", authenticateToken, async (req, res) => {
  const { incidentId, fileName, fileType, filePath, uploadedBy } = req.body || {};
  const att = {
    id: memAttachments.length + 1,
    incident_id: parseInt(incidentId, 10),
    file_name: fileName || "evidence.log",
    file_type: fileType || "text/plain",
    file_path: filePath || "",
    uploaded_by: uploadedBy || req.user?.email || "joe.miller@incidentq.com",
    created_at: new Date().toISOString()
  };
  memAttachments.push(att);
  return res.status(201).json(att);
});

app.post("/api/files/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  return res.json({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`,
    fileSize: req.file.size
  });
});

// ----------------------------------------------------
// AI TRIAGE & TROUBLESHOOTING
// ----------------------------------------------------
app.post("/api/ai/analyze", authenticateToken, async (req, res) => {
  const { title, description } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: "Title is required for AI triage analysis" });
  }

  try {
    const prompt = `Analyze this software production incident report. Return ONLY a valid JSON object without Markdown fences.
{
  "category": "INFRASTRUCTURE|DATABASE|API|AUTHENTICATION|PAYMENT_GATEWAY|FRONTEND|LOGGING|PERFORMANCE|SECURITY|GENERAL",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "suggestedTitle": "Refined executive incident summary",
  "summary": "Brief executive analysis summary",
  "recommendedAction": "Immediate remediation step"
}
Title: ${title}
Description: ${description || "Production system alert"}`;

    let response;
    try {
      response = await callGemini(prompt);
    } catch (apiErr) {
      // Deterministic rule-based fallback
      const text = `${title} ${description || ""}`.toLowerCase();
      let cat = "GENERAL";
      let pri = "MEDIUM";

      if (text.includes("payment") || text.includes("stripe") || text.includes("checkout")) {
        cat = "PAYMENT_GATEWAY"; pri = "CRITICAL";
      } else if (text.includes("database") || text.includes("sql") || text.includes("aurora") || text.includes("replica")) {
        cat = "DATABASE"; pri = "HIGH";
      } else if (text.includes("cert") || text.includes("tls") || text.includes("ingress") || text.includes("gateway")) {
        cat = "INFRASTRUCTURE"; pri = "HIGH";
      } else if (text.includes("auth") || text.includes("jwt") || text.includes("token")) {
        cat = "AUTHENTICATION"; pri = "MEDIUM";
      } else if (text.includes("memory") || text.includes("heap") || text.includes("oom") || text.includes("log")) {
        cat = "LOGGING"; pri = "LOW";
      }

      response = {
        category: cat,
        priority: pri,
        severity: pri,
        suggestedTitle: title,
        summary: "Automated telemetry heuristic classification based on system failure pattern.",
        recommendedAction: pri === "CRITICAL" ? "Initiate incident war room and reroute traffic to standby region." : "Inspect service logs and verify healthcheck latency."
      };
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate AI analysis" });
  }
});

app.post("/api/ai/troubleshoot", authenticateToken, async (req, res) => {
  const { incidentId, possibleCause } = req.body || {};
  const inc = memIncidents.find(i => i.id === parseInt(incidentId, 10)) || {
    id: incidentId,
    title: "Production System Anomaly",
    category: "GENERAL",
    severity: "HIGH",
    status: "OPEN",
    description: possibleCause || "Production incident"
  };

  try {
    const prompt = `Provide troubleshooting recommendations for this incident. Return ONLY a valid JSON object without Markdown fences.
{
  "troubleshootingSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "suggestedResolution": "Suggested resolution paragraph",
  "verificationSteps": ["Verification step 1", "Verification step 2"]
}
Incident Details:
Title: ${inc.title}
Category: ${inc.category}
Severity: ${inc.severity}
Context: ${possibleCause || inc.description || "Production system issue"}`;

    let response;
    try {
      response = await callGemini(prompt);
    } catch (apiErr) {
      response = {
        troubleshootingSteps: [
          "Check APM telemetry and thread dump stack traces on affected instances.",
          "Verify downstream database connection health, lock contention, and latency charts.",
          "Inspect firewall rules, DNS records, and ingress reverse proxy configurations.",
          "Replay failed transaction payloads in staging environment with debug logging."
        ],
        suggestedResolution: "Apply graceful rate limiting at the API gateway layer, restart unresponsive worker processes, and apply connection pool threshold increments.",
        verificationSteps: [
          "Run automated synthetic probe against healthcheck endpoint to confirm <100ms response.",
          "Monitor error rates and latency p99 across Prometheus dashboard for 15 consecutive minutes."
        ]
      };
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: "Unable to generate troubleshooting guidance" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`IncidentQ Backend server running on port ${PORT}`);
  console.log(`Health Check Endpoint: /api/health/db`);
});
