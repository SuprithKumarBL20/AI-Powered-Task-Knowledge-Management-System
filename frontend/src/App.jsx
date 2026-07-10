import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { api } from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <span style={styles.loaderText}>Powering up AetherMind...</span>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    width: "100vw",
  },
  loader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#080b11",
    color: "#f8fafc",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(0, 242, 254, 0.15)",
    borderTopColor: "#00f2fe",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "15px",
  },
  loaderText: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#94a3b8",
  },
};

export default App;
