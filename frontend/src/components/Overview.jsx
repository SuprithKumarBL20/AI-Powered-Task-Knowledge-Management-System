import React, { useState, useEffect } from "react";
import { api } from "../api";
import { CheckSquare, FileText, BarChart3, Search, Activity, AlertCircle } from "lucide-react";

export default function Overview({ isAdmin }) {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const metricsData = await api.getAnalytics();
      setMetrics(metricsData);
      
      // If admin, fetch recent activity logs for dashboard feed
      if (isAdmin) {
        const logsData = await api.getLogs();
        // Just show top 5 logs on dashboard
        setLogs(logsData.slice(0, 5));
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Generating analytics stream...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        <AlertCircle size={20} color="#ef4444" />
        <span>{error}</span>
        <button style={styles.retryBtn} onClick={fetchData}>Retry</button>
      </div>
    );
  }

  // Calculate percentage completion
  const total = metrics?.total_tasks || 0;
  const completed = metrics?.completed_tasks || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Total Tasks</span>
            <CheckSquare size={20} color="#4facfe" />
          </div>
          <span style={styles.metricValue}>{metrics?.total_tasks}</span>
          <div style={styles.metricSub}>
            <span style={{ color: "var(--accent-green)" }}>{metrics?.completed_tasks} completed</span>
            {" • "}
            <span style={{ color: "var(--accent-yellow)" }}>{metrics?.pending_tasks} pending</span>
          </div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Knowledge Library</span>
            <FileText size={20} color="#8a2be2" />
          </div>
          <span style={styles.metricValue}>{metrics?.total_documents}</span>
          <div style={styles.metricSub}>Uploaded research & docs</div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Task Progress</span>
            <BarChart3 size={20} color="#00f2fe" />
          </div>
          <span style={styles.metricValue}>{completionRate}%</span>
          {/* Custom animated progress bar */}
          <div style={styles.progressBarBg}>
            <div 
              style={{ 
                ...styles.progressBarFill, 
                width: `${completionRate}%`,
                boxShadow: `0 0 10px rgba(0, 242, 254, 0.4)`
              }} 
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Top Queries, Right = Activity Log (Admin) */}
      <div style={styles.splitGrid}>
        {/* Top Queries */}
        <div className="glass-card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <Search size={18} color="#00f2fe" />
            <h3 style={styles.panelTitle}>Top AI Search Queries</h3>
          </div>
          
          {metrics?.top_queries && metrics.top_queries.length > 0 ? (
            <div style={styles.queryList}>
              {metrics.top_queries.map((q, idx) => (
                <div key={idx} style={styles.queryRow}>
                  <div style={styles.queryTextContainer}>
                    <span style={styles.queryRank}>#{idx + 1}</span>
                    <span style={styles.queryText}>"{q.query}"</span>
                  </div>
                  <span className="badge badge-user" style={styles.queryCount}>
                    {q.count} searches
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No search metrics recorded yet.</div>
          )}
        </div>

        {/* Recent Activity Log (Admin only) */}
        {isAdmin && (
          <div className="glass-card" style={styles.panel}>
            <div style={styles.panelHeader}>
              <Activity size={18} color="#8a2be2" />
              <h3 style={styles.panelTitle}>System Activity Stream</h3>
            </div>
            
            {logs.length > 0 ? (
              <div style={styles.logList}>
                {logs.map((log) => (
                  <div key={log.id} style={styles.logRow}>
                    <div style={styles.logMeta}>
                      <span style={styles.logUser}>{log.username}</span>
                      <span style={styles.logTime}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={styles.logDetails}>
                      <span style={styles.logAction}>{log.action}: </span>
                      <span style={styles.logText}>{log.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No system logs registered.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "var(--text-secondary)",
    fontSize: "1.1rem",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    color: "#fca5a5",
  },
  retryBtn: {
    marginLeft: "auto",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-glass)",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--text-primary)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "relative",
  },
  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  metricValue: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  metricSub: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "10px",
    overflow: "hidden",
    marginTop: "6px",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))",
    borderRadius: "10px",
    transition: "width 1s ease-in-out",
  },
  splitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "25px",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minHeight: "350px",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  panelTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 0",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  queryList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  queryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.03)",
  },
  queryTextContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  queryRank: {
    color: "var(--accent-cyan)",
    fontWeight: "600",
    fontSize: "0.85rem",
  },
  queryText: {
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  queryCount: {
    fontSize: "0.75rem",
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  logRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(0, 0, 0, 0.15)",
    borderLeft: "2px solid rgba(138, 43, 226, 0.5)",
  },
  logMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
  },
  logUser: {
    color: "var(--text-secondary)",
    fontWeight: "600",
  },
  logTime: {
    color: "var(--text-muted)",
  },
  logDetails: {
    fontSize: "0.85rem",
  },
  logAction: {
    color: "#c084fc",
    fontWeight: "600",
  },
  logText: {
    color: "var(--text-primary)",
  },
};
