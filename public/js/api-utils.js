// Standardized API utility for Olumba
class ApiUtils {
  static async request(endpoint, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(endpoint, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  static async get(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return this.request(url.toString());
  }
  
  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
  
  static async loadData(resource, params = {}, container = null) {
    if (container) {
      ErrorHandler.showLoading(container);
    }
    
    try {
      const result = await this.get(`/api/${resource}`, params);
      return result.data;
    } catch (error) {
      if (container) {
        ErrorHandler.show(error.message, container);
      }
      throw error;
    }
  }
  
  static async createData(resource, data) {
    try {
      const result = await this.post(`/api/${resource}`, data);
      ErrorHandler.showToast(result.message || 'Created successfully', 'success');
      return result.data;
    } catch (error) {
      ErrorHandler.handle(error, `create${resource}`);
      throw error;
    }
  }
  
  static async updateData(resource, id, data) {
    try {
      const result = await this.put(`/api/${resource}?id=${id}`, data);
      ErrorHandler.showToast(result.message || 'Updated successfully', 'success');
      return result.data;
    } catch (error) {
      ErrorHandler.handle(error, `update${resource}`);
      throw error;
    }
  }
  
  static async deleteData(resource, id) {
    try {
      const result = await this.delete(`/api/${resource}?id=${id}`);
      ErrorHandler.showToast(result.message || 'Deleted successfully', 'success');
      return result;
    } catch (error) {
      ErrorHandler.handle(error, `delete${resource}`);
      throw error;
    }
  }
  
  static formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  static formatDateTime(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  static escapeHtml(text) {
    if (!text && text !== 0) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
}

// Export for use in other modules
window.ApiUtils = ApiUtils;
