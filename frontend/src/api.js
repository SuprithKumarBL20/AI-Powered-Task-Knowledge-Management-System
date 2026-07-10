const API_BASE_URL = "http://127.0.0.1:8000";

// Helper to get auth headers
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("access_token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Handle response errors
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // JSON parsing failed, use status text
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return response.json();
};

export const api = {
  // Auth APIs
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    
    // Save to local storage
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_role", data.role);
    localStorage.setItem("username", data.username);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
  },

  register: async (username, password, roleId) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password, role_id: roleId }),
    });
    return handleResponse(response);
  },

  // Task APIs
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.assigned_to) params.append("assigned_to", filters.assigned_to);

    const url = `${API_BASE_URL}/tasks?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },

  createTask: async (title, description, assignedTo, priority) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        description,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
        priority: priority || "Medium"
      }),
    });
    return handleResponse(response);
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Document APIs
  getDocuments: async () => {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },

  getDocumentFile: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to load document file");
    }
    return response.blob();
  },

  uploadDocument: async (title, file) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  // Search APIs
  search: async (query) => {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },

  // Analytics & Log APIs
  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },

  getLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/logs`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },
  
  // Helper to fetch standard users (needed for assigning tasks in Admin form)
  // Let's write a route or query all users
  // Wait, let's look at if we have an endpoint for users.
  // Ah! We don't have a specific GET /users endpoint in our backend router checklist,
  // but it would be super helpful for the Admin to assign tasks to users from a dropdown list!
  // Let's write a simple GET /auth/users endpoint so the Admin can populate their select menu.
  // Yes! This is a great addition that completes the user experience.
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    return handleResponse(response);
  },

  deleteTask: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(response.statusText || "Failed to delete task");
    }
    return true;
  }
};
