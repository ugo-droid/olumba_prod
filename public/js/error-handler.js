// Centralized error handling utility for Olumba
class ErrorHandler {
  static show(message, container) {
    if (!container) {
      console.error('No container provided for error display');
      return;
    }
    
    container.innerHTML = `
      <div class="error-message bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <span class="material-symbols-outlined text-red-500">error</span>
        <div>
          <h3 class="text-red-800 font-medium">Error</h3>
          <p class="text-red-700 mt-1">${this.escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }
  
  static showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === 'error' ? 'bg-red-500 text-white' : 
      type === 'success' ? 'bg-green-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // User-friendly message
    const message = error.message || 'An unexpected error occurred';
    this.showToast(message, 'error');
    
    // Log to monitoring service (implement if needed)
    // this.logToService(error, context);
  }
  
  static escapeHtml(text) {
    if (!text && text !== 0) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
  
  static showLoading(container, message = 'Loading...') {
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading-state flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-3 text-text-color/60">${message}</span>
      </div>
    `;
  }
  
  static showEmpty(container, message = 'No data available') {
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-state text-center p-8">
        <span class="material-symbols-outlined text-4xl text-text-color/40 mb-4">inbox</span>
        <p class="text-text-color/60">${message}</p>
      </div>
    `;
  }
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  ErrorHandler.showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  ErrorHandler.showToast('An unexpected error occurred', 'error');
});

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
