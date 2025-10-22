// Global Search functionality for Olumba
class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('global-search');
        this.searchResults = document.getElementById('search-results');
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        if (!this.searchInput) {
            console.log('Global search input not found');
            return;
        }
        
        console.log('🔍 Initializing global search...');
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });
        
        // Close results on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
            }
        });
    }
    
    async performSearch(query) {
        if (query.length < 2) {
            this.hideResults();
            return;
        }
        
        console.log('🔍 Searching for:', query);
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayResults(result.data);
            } else {
                console.error('Search error:', result.error);
                this.showError('Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed');
        }
    }
    
    displayResults(results) {
        if (!this.searchResults) return;
        
        const { projects, tasks, documents, clients } = results;
        
        let html = '';
        let hasResults = false;
        
        if (projects && projects.length > 0) {
            html += '<div class="search-section"><h4 class="search-section-title">Projects</h4>';
            projects.forEach(p => {
                html += `<a href="/project-detail.html?id=${p.id}" class="search-result-item">
                    <div class="search-result-content">
                        <strong>${this.escapeHtml(p.name)}</strong>
                        <small>${this.escapeHtml(p.description || '')}</small>
                    </div>
                    <span class="material-symbols-outlined">folder</span>
                </a>`;
            });
            html += '</div>';
            hasResults = true;
        }
        
        if (tasks && tasks.length > 0) {
            html += '<div class="search-section"><h4 class="search-section-title">Tasks</h4>';
            tasks.forEach(t => {
                html += `<a href="/task-detail.html?id=${t.id}" class="search-result-item">
                    <div class="search-result-content">
                        <strong>${this.escapeHtml(t.title || t.name)}</strong>
                        <small>${this.escapeHtml(t.description || '')}</small>
                    </div>
                    <span class="material-symbols-outlined">task_alt</span>
                </a>`;
            });
            html += '</div>';
            hasResults = true;
        }
        
        if (documents && documents.length > 0) {
            html += '<div class="search-section"><h4 class="search-section-title">Documents</h4>';
            documents.forEach(d => {
                html += `<div class="search-result-item" onclick="downloadDocument('${d.id}', '${d.url}', '${d.name}')">
                    <div class="search-result-content">
                        <strong>${this.escapeHtml(d.name)}</strong>
                        <small>${this.escapeHtml(d.mime_type || '')}</small>
                    </div>
                    <span class="material-symbols-outlined">description</span>
                </div>`;
            });
            html += '</div>';
            hasResults = true;
        }
        
        if (clients && clients.length > 0) {
            html += '<div class="search-section"><h4 class="search-section-title">Clients</h4>';
            clients.forEach(c => {
                html += `<div class="search-result-item" onclick="viewClient('${c.id}')">
                    <div class="search-result-content">
                        <strong>${this.escapeHtml(c.name)}</strong>
                        <small>${this.escapeHtml(c.contact_person || '')}</small>
                    </div>
                    <span class="material-symbols-outlined">business</span>
                </div>`;
            });
            html += '</div>';
            hasResults = true;
        }
        
        if (!hasResults) {
            html = '<div class="search-no-results">No results found</div>';
        }
        
        this.searchResults.innerHTML = html;
        this.searchResults.style.display = 'block';
    }
    
    showError(message) {
        if (!this.searchResults) return;
        
        this.searchResults.innerHTML = `
            <div class="search-error">
                <span class="material-symbols-outlined">error</span>
                ${message}
            </div>
        `;
        this.searchResults.style.display = 'block';
    }
    
    hideResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        if (!text && text !== 0) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
}

// Initialize global search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GlobalSearch();
});

// Global functions for search results
window.downloadDocument = function(id, url, name) {
    console.log('Downloading document:', name);
    if (!url || url === '#') {
        alert('Download URL not available');
        return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.viewClient = function(id) {
    console.log('Viewing client:', id);
    // For now, just show an alert
    // In a full implementation, this would open a client details page
    alert('Client details would open here');
};
