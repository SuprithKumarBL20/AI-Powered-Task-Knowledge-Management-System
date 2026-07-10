import React, { useState } from "react";
import { LayoutDashboard, FileText, CheckSquare, Search, ClipboardList, LogOut, Shield, User as UserIcon } from "lucide-react";
import Overview from "./Overview";
import Tasks from "./Tasks";
import Documents from "./Documents";
import SearchComponent from "./Search";
import Logs from "./Logs";

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const username = localStorage.getItem("username") || "User";
  const userRole = localStorage.getItem("user_role") || "User";
  const isAdmin = userRole === "Admin";

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview isAdmin={isAdmin} />;
      case "tasks":
        return <Tasks isAdmin={isAdmin} />;
      case "documents":
        return <Documents isAdmin={isAdmin} />;
      case "search":
        return <SearchComponent />;
      case "logs":
        return <Logs />;
      default:
        return <Overview isAdmin={isAdmin} />;
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "search", label: "AI Search", icon: Search },
  ];

  // Admin gets access to audit logs tab
  if (isAdmin) {
    navItems.push({ id: "logs", label: "Activity Logs", icon: ClipboardList });
  }

  return (
    <div className="app-container" style={styles.container}>
      {/* Sidebar */}
      <aside className="glass-panel" style={styles.sidebar}>
        <div style={styles.logoArea}>
          <Shield size={24} color="#00f2fe" />
          <h2 style={styles.logoText}>
            Aether<span style={styles.logoTextAccent}>Mind</span>
          </h2>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                style={{
                  ...styles.navBtn,
                  ...(isActive ? styles.navBtnActive : {}),
                }}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} color={isActive ? "#00f2fe" : "#94a3b8"} />
                <span>{item.label}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              <UserIcon size={16} color="#00f2fe" />
            </div>
            <div style={styles.userText}>
              <span style={styles.username}>{username}</span>
              <span style={styles.roleBadge} className={isAdmin ? "badge badge-admin" : "badge badge-user"}>
                {userRole}
              </span>
            </div>
          </div>
          
          <button style={styles.logoutBtn} onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>
            {navItems.find((item) => item.id === activeTab)?.label || "Dashboard"}
          </h1>
          <div style={styles.dateArea}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div style={styles.contentBody}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    minHeight: "100vh",
  },
  sidebar: {
    width: "var(--sidebar-width)",
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    borderRadius: 0,
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    padding: "30px 20px",
    background: "rgba(8, 11, 17, 0.8)",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "40px",
    paddingLeft: "10px",
  },
  logoText: {
    fontSize: "1.3rem",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  logoTextAccent: {
    background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    padding: "12px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    fontWeight: "500",
    fontSize: "0.95rem",
    position: "relative",
    transition: "var(--transition-smooth)",
    width: "100%",
  },
  navBtnActive: {
    color: "var(--text-primary)",
    background: "rgba(255, 255, 255, 0.03)",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "25%",
    height: "50%",
    width: "3px",
    background: "var(--accent-cyan)",
    borderRadius: "0 4px 4px 0",
    boxShadow: "0 0 10px var(--accent-cyan)",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "5px 10px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(0, 242, 254, 0.1)",
    border: "1px solid rgba(0, 242, 254, 0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  userText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  username: {
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  roleBadge: {
    padding: "2px 6px",
    fontSize: "0.6rem",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "8px",
    color: "#fca5a5",
    padding: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "500",
    fontSize: "0.85rem",
    transition: "var(--transition-smooth)",
    width: "100%",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: "8px",
    color: "#fca5a5",
    padding: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "500",
    fontSize: "0.85rem",
    transition: "var(--transition-smooth)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
    paddingBottom: "15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
  },
  headerTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
  },
  dateArea: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
  },
  contentBody: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
};
