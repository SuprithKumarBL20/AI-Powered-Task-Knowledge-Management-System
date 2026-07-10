import React, { useState, useEffect } from "react";
import { api } from "../api";
import { CheckSquare, AlertCircle, Plus, Check, Clock, User, Filter, RefreshCw, Trash2 } from "lucide-react";

export default function Tasks({ isAdmin }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // Create Task Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (assigneeFilter) filters.assigned_to = assigneeFilter;
      
      const tasksData = await api.getTasks(filters);
      setTasks(tasksData);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load users for assignment:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "Pending" ? "Completed" : "Pending";
    try {
      await api.updateTaskStatus(task.id, newStatus);
      // Refetch to refresh layout and synchronize filters
      fetchTasks();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !title.trim()) return;

    setSubmitting(true);
    try {
      await api.createTask(title, description, assignedTo || null, priority);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("Medium");
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      alert("Failed to create task: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Filters Toolbar */}
      <div className="glass-card" style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={styles.filterLabel}>Filters</span>
          
          <select 
            style={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>

          <select 
            style={styles.select}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {isAdmin && (
            <select 
              style={styles.select}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role.name})
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.toolbarActions}>
          <button style={styles.iconBtn} onClick={fetchTasks} title="Refresh tasks">
            <RefreshCw size={16} />
          </button>
          
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>Create Task</span>
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

      {/* Task List */}
      {loading ? (
        <div style={styles.loading}>Retrieving task board...</div>
      ) : tasks.length > 0 ? (
        <div style={styles.taskList}>
          {tasks.map((task) => {
            const isCompleted = task.status === "Completed";
            return (
              <div 
                key={task.id} 
                className="glass-card" 
                style={{
                  ...styles.taskCard,
                  ...(isCompleted ? styles.taskCardCompleted : {})
                }}
              >
                {/* Status Toggle Box */}
                <button 
                  onClick={() => handleToggleStatus(task)} 
                  style={{
                    ...styles.checkboxBtn,
                    ...(isCompleted ? styles.checkboxBtnChecked : {})
                  }}
                  title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                >
                  {isCompleted && <Check size={14} color="#05070c" />}
                </button>

                <div style={styles.taskContent}>
                  <h4 style={{
                    ...styles.taskTitle,
                    ...(isCompleted ? styles.taskTitleCompleted : {})
                  }}>
                    {task.title}
                  </h4>
                  <p style={{
                    ...styles.taskDesc,
                    ...(isCompleted ? styles.taskDescCompleted : {})
                  }}>
                    {task.description || "No description provided."}
                  </p>
                  
                  <div style={styles.taskMeta}>
                    <div style={styles.metaItem}>
                      <User size={14} color="var(--text-muted)" />
                      <span>
                        Assignee: <strong>{task.assignee?.username || "Unassigned"}</strong>
                      </span>
                    </div>
                    <div style={styles.metaItem}>
                      <span className={`badge badge-${(task.priority || "Medium").toLowerCase()}-priority`}>
                        {task.priority || "Medium"} Priority
                      </span>
                    </div>
                    <div style={styles.metaItem}>
                      {isCompleted ? (
                        <Check size={14} color="var(--accent-green)" />
                      ) : (
                        <Clock size={14} color="var(--accent-yellow)" />
                      )}
                      <span className={isCompleted ? "badge badge-completed" : "badge badge-pending"}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    style={styles.deleteBtn}
                    title="Delete Task"
                    className="delete-task-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={styles.emptyState}>
          No tasks found matching your filters.
        </div>
      )}

      {/* Create Task Modal Overlay */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign New System Task</h3>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateTask} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Task Description</label>
                <textarea
                  className="form-input"
                  style={styles.textarea}
                  placeholder="Provide step-by-step instructions or requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Assignee</label>
                <select
                  className="form-input"
                  style={styles.selectInput}
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Unassigned (Open Pool)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role.name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Task Priority</label>
                <select
                  className="form-input"
                  style={styles.selectInput}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div style={styles.formActions}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create & Assign"}
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
    gap: "20px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    flexWrap: "wrap",
    gap: "15px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  filterLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: "500",
    marginRight: "5px",
  },
  select: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-glass)",
    borderRadius: "6px",
    color: "var(--text-primary)",
    padding: "8px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    outline: "none",
  },
  toolbarActions: {
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
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  taskCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px",
    borderLeft: "4px solid var(--accent-cyan)",
  },
  taskCardCompleted: {
    borderLeftColor: "var(--accent-green)",
    opacity: 0.7,
  },
  checkboxBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: "2px solid var(--accent-cyan)",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "2px",
    flexShrink: 0,
    transition: "var(--transition-smooth)",
  },
  checkboxBtnChecked: {
    background: "var(--accent-green)",
    borderColor: "var(--accent-green)",
  },
  taskContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  taskTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  taskTitleCompleted: {
    textDecoration: "line-through",
    color: "var(--text-secondary)",
  },
  taskDesc: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    whiteSpace: "pre-line",
  },
  taskDescCompleted: {
    color: "var(--text-muted)",
  },
  taskMeta: {
    display: "flex",
    gap: "25px",
    marginTop: "12px",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyState: {
    padding: "80px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "6px",
    color: "var(--accent-red)",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginLeft: "auto",
    transition: "var(--transition-smooth)",
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
    gap: "18px",
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
  textarea: {
    resize: "vertical",
    fontFamily: "inherit",
  },
  selectInput: {
    appearance: "none",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
};
