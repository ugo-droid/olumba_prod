// API utility functions
const API_BASE_URL = '/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Set auth token
function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

// Remove auth token
function clearAuthToken() {
    localStorage.removeItem('auth_token');
}

// Get current user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('current_user', JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
    localStorage.removeItem('current_user');
}

// Make API request
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Token expired or invalid
        clearAuthToken();
        clearCurrentUser();
        window.location.href = '/login.html';
        return;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    
    return data;
}

// Auth API
const auth = {
    async validateInvitation(token) {
        const response = await fetch(`${API_BASE_URL}/auth/validate-invitation/${token}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Invalid invitation');
        }
        
        return data;
    },
    
    async login(email, password, mfaCode = null) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, mfa_code: mfaCode })
        });
        
        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }
        
        return data;
    },
    
    async register(userData) {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }
        
        return data;
    },
    
    async logout() {
        await apiRequest('/auth/logout', { method: 'POST' });
        clearAuthToken();
        clearCurrentUser();
    },
    
    async getMe() {
        return await apiRequest('/auth/me');
    }
};

// Projects API
const projects = {
    async getAll() {
        return await apiRequest('/projects');
    },
    
    async getById(id) {
        return await apiRequest(`/projects/${id}`);
    },
    
    async create(projectData) {
        return await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },
    
    async update(id, updates) {
        return await apiRequest(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async delete(id) {
        return await apiRequest(`/projects/${id}`, {
            method: 'DELETE'
        });
    },
    
    async addMember(projectId, userId, role) {
        return await apiRequest(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, role })
        });
    },
    
    async adminCompanyProjects() {
        return await apiRequest('/projects/company');
    }
};

// Tasks API
const tasks = {
    async getByProject(projectId) {
        return await apiRequest(`/tasks/project/${projectId}`);
    },
    
    async addSubtask(taskId, subtaskData) {
        return await apiRequest(`/tasks/${taskId}/subtasks`, {
            method: 'POST',
            body: JSON.stringify(subtaskData)
        });
    },
    
    async toggleSubtask(subtaskId) {
        return await apiRequest(`/tasks/subtasks/${subtaskId}/toggle`, {
            method: 'PUT'
        });
    },
    
    async getMyTasks() {
        return await apiRequest('/tasks/my-tasks');
    },
    
    async getById(id) {
        return await apiRequest(`/tasks/${id}`);
    },
    
    async create(taskData) {
        return await apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },
    
    async update(id, updates) {
        return await apiRequest(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async delete(id) {
        return await apiRequest(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }
};

// Users API
const users = {
    async getAll() {
        return await apiRequest('/users');
    },
    
    async invite(email, role, projectId = null) {
        return await apiRequest('/users/invite', {
            method: 'POST',
            body: JSON.stringify({ email, role, project_id: projectId })
        });
    },
    
    async inviteConsultant(email, projectId, message = null) {
        return await apiRequest('/users/invite-consultant', {
            method: 'POST',
            body: JSON.stringify({ email, project_id: projectId, message })
        });
    },
    
    async updateProfile(updates) {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async getNotificationPreferences() {
        return await apiRequest('/users/notifications/preferences');
    },
    
    async updateNotificationPreferences(prefs) {
        return await apiRequest('/users/notifications/preferences', {
            method: 'PUT',
            body: JSON.stringify(prefs)
        });
    }
};

// Notifications API
const notifications = {
    async getAll(read = undefined, limit = 50) {
        const params = new URLSearchParams();
        if (read !== undefined) params.append('read', read);
        params.append('limit', limit);
        
        return await apiRequest(`/notifications?${params}`);
    },
    
    async getUnreadCount() {
        return await apiRequest('/notifications/unread-count');
    },
    
    async markAsRead(id) {
        return await apiRequest(`/notifications/${id}/read`, {
            method: 'PUT'
        });
    },
    
    async markAllAsRead() {
        return await apiRequest('/notifications/read-all', {
            method: 'PUT'
        });
    }
};

// Documents API
const documents = {
    async getByProject(projectId, latestOnly = false) {
        const params = latestOnly ? '?latest_only=true' : '';
        return await apiRequest(`/documents/project/${projectId}${params}`);
    },
    
    async getHistory(documentId) {
        return await apiRequest(`/documents/${documentId}/history`);
    },
    
    async create(documentData) {
        return await apiRequest('/documents', {
            method: 'POST',
            body: JSON.stringify(documentData)
        });
    },
    
    async logAccess(documentId, action) {
        return await apiRequest(`/documents/${documentId}/log-access`, {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    },
    
    async delete(documentId) {
        return await apiRequest(`/documents/${documentId}`, {
            method: 'DELETE'
        });
    }
};

// City Approvals API
const cityApprovals = {
    async getAll() {
        return await apiRequest('/city-approvals');
    },
    
    async getById(id) {
        return await apiRequest(`/city-approvals/${id}`);
    },
    
    async create(approvalData) {
        return await apiRequest('/city-approvals', {
            method: 'POST',
            body: JSON.stringify(approvalData)
        });
    },
    
    async updateStatus(id, status, cityOfficial = null, notes = null) {
        return await apiRequest(`/city-approvals/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, city_official: cityOfficial, notes })
        });
    },
    
    async addCorrection(approvalId, correctionData) {
        return await apiRequest(`/city-approvals/${approvalId}/corrections`, {
            method: 'POST',
            body: JSON.stringify(correctionData)
        });
    },
    
    async updateCorrection(correctionId, status) {
        return await apiRequest(`/city-approvals/corrections/${correctionId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    async delete(id) {
        return await apiRequest(`/city-approvals/${id}`, {
            method: 'DELETE'
        });
    }
};

// Messages API
const messages = {
    async getByProject(projectId) {
        return await apiRequest(`/messages/project/${projectId}`);
    },
    
    async getActivity(projectId) {
        return await apiRequest(`/messages/activity/${projectId}`);
    },
    
    async post(messageData) {
        return await apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    },
    
    async update(messageId, content) {
        return await apiRequest(`/messages/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });
    },
    
    async delete(messageId) {
        return await apiRequest(`/messages/${messageId}`, {
            method: 'DELETE'
        });
    }
};

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Require authentication for page
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, projects, tasks, users, notifications, cityApprovals, isAuthenticated, requireAuth, getCurrentUser };
}
