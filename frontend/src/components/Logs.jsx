import React, { useState, useEffect } from "react";
import { api } from "../api";
import { ClipboardList, Shield, RefreshCw, AlertCircle, Calendar } from "lucide-react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const logsData = await api.getLogs();
      setLogs(logsData);
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case "login":
        return "#10b981"; // green
      case "document upload":
        return "#8a2be2"; // purple
      case "task update":
      case "task create":
        return "#4facfe"; // blue
      case "search":
        return "#00f2fe"; // cyan
      default:
        return "var(--text-primary)";
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Info Panel */}
      <div className="glass-card" style={styles.headerCard}>
        <div style={styles.headerInfo}>
          <ClipboardList size={22} color="var(--accent-purple)" />
          <div style={styles.headerText}>
            <h3 style={styles.headerTitle}>System Activity Auditing Feed</h3>
            <p style={styles.headerDesc}>
              A read-only log of all operations performed within the AetherMind ecosystem.
            </p>
          </div>
        </div>

        <button style={styles.iconBtn} onClick={fetchLogs} title="Refresh log feed">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table / List */}
      {loading ? (
        <div style={styles.loading}>Accessing system audit trail...</div>
      ) : logs.length > 0 ? (
        <div className="glass-card" style={styles.logList}>
          <div style={styles.tableHeader}>
            <span style={styles.thCol}>Timestamp</span>
            <span style={styles.thCol}>Operator</span>
            <span style={styles.thCol}>Operation</span>
            <span style={styles.thColDetails}>Details</span>
          </div>

          <div style={styles.tableBody}>
            {logs.map((log) => {
              const dateStr = new Date(log.created_at).toLocaleString();
              return (
                <div key={log.id} style={styles.logRow}>
                  <span style={styles.tdColTime}>
                    <Calendar size={12} color="var(--text-muted)" style={{ marginRight: "6px" }} />
                    {dateStr}
                  </span>
                  <span style={styles.tdColUser}>
                    <Shield size={12} color="var(--text-muted)" style={{ marginRight: "6px" }} />
                    {log.username}
                  </span>
                  <span 
                    style={{
                      ...styles.tdColAction,
                      color: getActionColor(log.action),
                      textShadow: `0 0 5px ${getActionColor(log.action)}33`
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={styles.tdColDetails}>{log.details}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={styles.emptyState}>
          No activities have been logged yet.
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 30px",
  },
  headerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  headerTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  headerDesc: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  iconBtn: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border-glass)",
    color: "var(--text-secondary)",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "var(--transition-smooth)",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#fca5a5",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-secondary)",
  },
  logList: {
    padding: 0,
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "180px 150px 150px 1fr",
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "16px 24px",
    fontWeight: "600",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  thCol: {
    textAlign: "left",
  },
  thColDetails: {
    textAlign: "left",
    paddingLeft: "10px",
  },
  tableBody: {
    display: "flex",
    flexDirection: "column",
  },
  logRow: {
    display: "grid",
    gridTemplateColumns: "180px 150px 150px 1fr",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.02)",
    fontSize: "0.85rem",
    alignItems: "center",
    transition: "var(--transition-smooth)",
  },
  tdColTime: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-secondary)",
  },
  tdColUser: {
    display: "flex",
    alignItems: "center",
    fontWeight: "500",
  },
  tdColAction: {
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "0.5px",
  },
  tdColDetails: {
    color: "var(--text-primary)",
    paddingLeft: "10px",
  },
  emptyState: {
    padding: "80px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
};
