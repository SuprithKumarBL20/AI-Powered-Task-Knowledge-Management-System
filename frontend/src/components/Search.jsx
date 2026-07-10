import React, { useState } from "react";
import { api } from "../api";
import { Search as SearchIcon, FileText, Compass, AlertCircle, Sparkles } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const searchData = await api.search(query);
      setResults(searchData.results);
    } catch (err) {
      setError(err.message || "Failed to complete search.");
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, queryText) => {
    if (!queryText || !queryText.trim()) return text;
    // Split query into terms of length >= 3 to avoid highlighting single characters
    const terms = queryText
      .split(/\s+/)
      .filter((t) => t.length >= 3)
      .map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")); // Escape regex characters

    if (terms.length === 0) return text;

    const pattern = terms.join("|");
    const regex = new RegExp(`(${pattern})`, "gi");

    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div style={styles.container}>
      {/* Search Input Panel */}
      <div className="glass-card" style={styles.searchPanel}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={styles.inputWrapper}>
            <SearchIcon size={20} style={styles.searchIcon} />
            <input
              type="text"
              className="form-input"
              style={styles.searchInput}
              placeholder="Ask a question or enter keywords to search knowledge base semantically..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={styles.searchBtn} disabled={loading}>
            <Sparkles size={16} />
            <span>{loading ? "Searching..." : "AI Query"}</span>
          </button>
        </form>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {loading ? (
        <div style={styles.loading}>
          <Compass size={32} style={styles.spinningIcon} />
          <span style={{ marginTop: "15px" }}>Processing semantic embeddings & similarity query...</span>
        </div>
      ) : searched ? (
        results.length > 0 ? (
          <div style={styles.resultsList}>
            <p style={styles.resultsSummary}>
              Retrieved {results.length} relevant sections from index:
            </p>
            {results.map((result, idx) => {
              // Convert score to percentage relevance
              // For flat inner product of normalized vectors, cosine similarity sits in [-1, 1]
              // Standard scale is normalized to % [0, 100]%
              const relevance = Math.round(Math.max(0, result.score) * 100);
              
              return (
                <div key={idx} className="glass-card" style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <div style={styles.resultDocInfo}>
                      <FileText size={16} color="var(--accent-cyan)" />
                      <span style={styles.docTitle}>{result.document_title}</span>
                      <span style={styles.chunkIndex}>Section {result.chunk_index + 1}</span>
                    </div>

                    <div style={styles.scoreArea}>
                      <span style={styles.scoreText}>Relevance:</span>
                      <span 
                        style={{
                          ...styles.scoreBadge,
                          color: relevance > 70 ? "var(--accent-green)" : "var(--accent-cyan)"
                        }}
                      >
                        {relevance}%
                      </span>
                    </div>
                  </div>

                  <p style={styles.chunkText}>
                    {highlightText(result.chunk_text, query)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card" style={styles.emptyState}>
            No matching documents found. Try rephrasing your search query.
          </div>
        )
      ) : (
        <div className="glass-card" style={styles.introState}>
          <Sparkles size={48} color="var(--accent-cyan)" style={{ marginBottom: "20px", opacity: 0.8 }} />
          <h4 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "8px" }}>Semantic Intelligence</h4>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "450px" }}>
            Type any question above. The system will encode your query into a vector representation, query the local FAISS index, and retrieve the most relevant sections of your documents.
          </p>
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
  searchPanel: {
    padding: "20px 24px",
  },
  searchForm: {
    display: "flex",
    gap: "15px",
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flex: 1,
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    color: "var(--text-muted)",
  },
  searchInput: {
    paddingLeft: "46px",
    fontSize: "0.95rem",
  },
  searchBtn: {
    padding: "10px 24px",
    fontSize: "0.95rem",
    flexShrink: 0,
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  spinningIcon: {
    animation: "spin 3s linear infinite",
    color: "var(--accent-cyan)",
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  resultsSummary: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: "500",
    paddingLeft: "5px",
  },
  resultCard: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "24px",
    background: "rgba(17, 24, 39, 0.35)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  resultDocInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  docTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  chunkIndex: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    background: "rgba(255, 255, 255, 0.03)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  scoreArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
  },
  scoreText: {
    color: "var(--text-muted)",
  },
  scoreBadge: {
    fontWeight: "700",
  },
  chunkText: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  highlight: {
    background: "rgba(0, 242, 254, 0.25)",
    color: "var(--text-primary)",
    padding: "1px 4px",
    borderRadius: "3px",
    borderBottom: "1px solid var(--accent-cyan)",
    textShadow: "0 0 4px rgba(0, 242, 254, 0.4)",
  },
  emptyState: {
    padding: "80px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  introState: {
    padding: "80px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
};
