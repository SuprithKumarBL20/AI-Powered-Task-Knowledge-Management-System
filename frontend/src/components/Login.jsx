import React, { useState } from "react";
import { api } from "../api";
import { LogIn, UserPlus, Shield, User as UserIcon, Key, AlertCircle } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("2"); // Default to standard User
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(username, password);
        onLoginSuccess(data);
      } else {
        await api.register(username, password, parseInt(roleId));
        setSuccessMsg("Registration successful! Please log in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.meshBg}></div>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoGlow}></div>
          <Shield size={32} color="#00f2fe" style={styles.logoIcon} />
          <h2 style={styles.title}>
            Aether<span style={styles.titleAccent}>Mind</span>
          </h2>
          <p style={styles.subtitle}>AI-Powered Task & Knowledge Management</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.successBox}>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <UserIcon size={18} style={styles.inputIcon} />
              <input
                type="text"
                className="form-input"
                style={styles.input}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Key size={18} style={styles.inputIcon} />
              <input
                type="password"
                className="form-input"
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Assign System Role</label>
              <div style={styles.inputWrapper}>
                <Shield size={18} style={styles.inputIcon} />
                <select
                  className="form-input"
                  style={styles.select}
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="2">User (Standard Access)</option>
                  <option value="1">Admin (Full Control)</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div style={styles.toggleText}>
          {isLogin ? "Need a new account? " : "Already have an account? "}
          <span
            style={styles.toggleLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMsg("");
            }}
          >
            {isLogin ? "Register here" : "Sign in here"}
          </span>
        </div>

        <div style={styles.demoCredentials}>
          <p style={styles.demoTitle}>Default Accounts:</p>
          <div style={styles.demoItem}>
            <strong>Admin:</strong> <code>admin</code> / <code>admin123</code>
          </div>
          <div style={styles.demoItem}>
            <strong>User:</strong> <code>user</code> / <code>user123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    position: "relative",
    overflow: "hidden",
  },
  meshBg: {
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle, rgba(138,43,226,0.08) 0%, rgba(0,242,254,0.04) 50%, rgba(0,0,0,0) 100%)",
    zIndex: -1,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
    position: "relative",
  },
  logoGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60px",
    height: "60px",
    background: "var(--accent-cyan)",
    filter: "blur(40px)",
    opacity: 0.6,
    zIndex: -1,
  },
  logoIcon: {
    marginBottom: "12px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginBottom: "4px",
  },
  titleAccent: {
    background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    fontWeight: "400",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: "500",
    paddingLeft: "4px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-muted)",
  },
  input: {
    paddingLeft: "42px",
  },
  select: {
    paddingLeft: "42px",
    appearance: "none",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "10px",
    width: "100%",
    justifyContent: "center",
    padding: "12px",
    fontSize: "0.95rem",
  },
  toggleText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  toggleLink: {
    color: "var(--accent-cyan)",
    fontWeight: "600",
    cursor: "pointer",
    borderBottom: "1px solid transparent",
    transition: "var(--transition-smooth)",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.85rem",
    color: "#fca5a5",
  },
  successBox: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "20px",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#a7f3d0",
  },
  demoCredentials: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    fontSize: "0.80rem",
    color: "var(--text-muted)",
    textAlign: "left",
  },
  demoTitle: {
    fontWeight: "600",
    marginBottom: "6px",
    color: "var(--text-secondary)",
  },
  demoItem: {
    marginBottom: "4px",
  },
};
