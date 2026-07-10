import React, { useState, useEffect } from "react";
import { api } from "../api";
import { FileText, Upload, Plus, File, Trash, AlertCircle, RefreshCw } from "lucide-react";

export default function Documents({ isAdmin }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const docsData = await api.getDocuments();
      setDocuments(docsData);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf("."));
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleOpenDocument = async (doc) => {
    try {
      const blob = await api.getDocumentFile(doc.id);
      
      // Map file extensions to correct mime-types for inline browser rendering
      let mimeType = "text/plain";
      if (doc.file_type.toLowerCase() === "pdf") {
        mimeType = "application/pdf";
      }
      
      const fileBlob = new Blob([blob], { type: mimeType });
      const objectUrl = URL.createObjectURL(fileBlob);
      
      // Open in a new window or trigger local download if popup blocker stops it
      const newWindow = window.open();
      if (newWindow) {
        newWindow.location.href = objectUrl;
      } else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = doc.title + (doc.file_type.toLowerCase() === "pdf" ? ".pdf" : ".txt");
        a.click();
      }
    } catch (err) {
      alert("Failed to retrieve document file: " + err.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setUploadProgress("Extracting text and generating vectors...");
    try {
      await api.uploadDocument(title, file);
      setTitle("");
      setFile(null);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      alert("Failed to upload document: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div style={styles.container}>
      {/* Header Panel */}
      <div className="glass-card" style={styles.headerPanel}>
        <div style={styles.headerInfo}>
          <FileText size={20} color="var(--accent-cyan)" />
          <div style={styles.headerText}>
            <h3 style={styles.headerTitle}>Knowledge Repository</h3>
            <p style={styles.headerDesc}>
              This is the knowledge base that powers the AI semantic search.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={fetchDocuments} title="Refresh documents">
            <RefreshCw size={16} />
          </button>
          
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div style={styles.loading}>Scanning knowledge repository...</div>
      ) : documents.length > 0 ? (
        <div style={styles.docGrid}>
          {documents.map((doc) => {
            const dateStr = new Date(doc.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const fileExt = doc.file_type.toLowerCase();
            return (
              <div key={doc.id} className="glass-card" style={styles.docCard}>
                <div style={styles.docIconWrapper}>
                  <File size={36} color={fileExt === "pdf" ? "#ff4500" : "#4facfe"} />
                  <span style={styles.docExtBadge}>{doc.file_type}</span>
                </div>
                
                <div style={styles.docInfo}>
                  <h4 style={styles.docTitle} title={doc.title}>
                    {doc.title}
                  </h4>
                  <div style={styles.docMeta}>
                    <span>Uploaded: <strong>{dateStr}</strong></span>
                  </div>
                  
                  <button 
                    className="btn-secondary" 
                    style={styles.openBtn}
                    onClick={() => handleOpenDocument(doc)}
                  >
                    Open & Read
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={styles.emptyState}>
          No documents in the knowledge base. {isAdmin && "Please upload some .txt or .pdf files to index them."}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Ingest Document to AI Vector DB</h3>
              <button style={styles.closeBtn} onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter custom title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={uploading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>File Source (.txt or .pdf only)</label>
                <div style={styles.fileUploadArea}>
                  <Upload size={32} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                    id="file-picker"
                    required
                    disabled={uploading}
                  />
                  <label htmlFor="file-picker" style={styles.filePickerLabel}>
                    {file ? file.name : "Choose PDF or Text File"}
                  </label>
                  {file && <span style={styles.fileSize}>{formatBytes(file.size)}</span>}
                </div>
              </div>

              {uploading && (
                <div style={styles.progressArea}>
                  <div style={styles.spinner}></div>
                  <span style={styles.progressText}>{uploadProgress}</span>
                </div>
              )}

              <div style={styles.formActions}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading || !file}>
                  {uploading ? "Ingesting..." : "Ingest & Index"}
                </button>
              </div>
            </form>
          </div>
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
  headerPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 30px",
    flexWrap: "wrap",
    gap: "15px",
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  docGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  docCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "30px 20px",
    cursor: "default",
  },
  docIconWrapper: {
    position: "relative",
    marginBottom: "16px",
  },
  docExtBadge: {
    position: "absolute",
    bottom: "-4px",
    right: "-12px",
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.6rem",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  docInfo: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  docTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  docMeta: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  openBtn: {
    marginTop: "16px",
    padding: "8px 16px",
    fontSize: "0.8rem",
    width: "100%",
    justifyContent: "center",
  },
  emptyState: {
    padding: "80px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "100%",
    maxWidth: "500px",
    padding: "30px",
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "1.8rem",
    cursor: "pointer",
    lineHeight: 1,
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
  },
  fileUploadArea: {
    border: "2px dashed var(--border-glass)",
    borderRadius: "10px",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(0, 0, 0, 0.1)",
    transition: "var(--transition-smooth)",
    position: "relative",
  },
  fileInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  filePickerLabel: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--accent-cyan)",
    pointerEvents: "none",
  },
  fileSize: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "5px",
    pointerEvents: "none",
  },
  progressArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    background: "rgba(0, 242, 254, 0.05)",
    border: "1px solid rgba(0, 242, 254, 0.15)",
    borderRadius: "8px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(0, 242, 254, 0.2)",
    borderTopColor: "var(--accent-cyan)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  progressText: {
    fontSize: "0.8rem",
    color: "var(--accent-cyan)",
    fontWeight: "500",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
};

// Add CSS animation for spinner inside the React environment
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
