// Navigation component - reusable across all pages

function createSidebar(activePage = 'dashboard') {
    const currentUser = getCurrentUser();
    const userName = currentUser?.full_name || 'User';
    const userRole = currentUser?.role || 'member';
    
    return `
    <aside id="sidebar" class="fixed md:relative inset-y-0 left-0 z-50 w-64 bg-background flex flex-col border-r border-footer-border/20 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
        <!-- User Info -->
        <div class="p-6 border-b border-footer-border/20">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="text-primary font-bold text-lg">${userName.charAt(0)}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h2 class="text-sm font-bold text-text-color truncate">${userName}</h2>
                    <p class="text-xs text-text-color/60 capitalize">${userRole}</p>
                </div>
            </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-1">
            <a href="/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
                <span class="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
            </a>
            <a href="/projects.html" class="nav-link ${activePage === 'projects' ? 'active' : ''}">
                <span class="material-symbols-outlined">folder</span>
                <span>Projects</span>
            </a>
            <a href="/tasks.html" class="nav-link ${activePage === 'tasks' ? 'active' : ''}">
                <span class="material-symbols-outlined">task_alt</span>
                <span>My Tasks</span>
            </a>
            <a href="/city-approvals.html" class="nav-link ${activePage === 'city-approvals' ? 'active' : ''}">
                <span class="material-symbols-outlined">apartment</span>
                <span>City Plan Check</span>
            </a>
            <a href="/communication-hub.html" class="nav-link ${activePage === 'communication' ? 'active' : ''}">
                <span class="material-symbols-outlined">forum</span>
                <span>Communication Hub</span>
            </a>
            ${userRole === 'admin' ? `
            <a href="/admin-overview.html" class="nav-link ${activePage === 'admin' ? 'active' : ''}">
                <span class="material-symbols-outlined">monitoring</span>
                <span>Admin Overview</span>
            </a>
            ` : ''}
            ${userRole === 'admin' ? `
            <a href="/team.html" class="nav-link ${activePage === 'team' ? 'active' : ''}">
                <span class="material-symbols-outlined">group</span>
                <span>Team</span>
            </a>
            ` : ''}
            <a href="/notifications.html" class="nav-link ${activePage === 'notifications' ? 'active' : ''}">
                <span class="material-symbols-outlined">notifications</span>
                <span>Notifications</span>
                <span id="notificationBadge" class="hidden ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </a>
        </nav>
        
        <!-- Footer Actions -->
        <div class="p-4 border-t border-footer-border/20 space-y-2">
            <a href="/settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}">
                <span class="material-symbols-outlined">settings</span>
                <span>Settings</span>
            </a>
            <button id="logoutBtn" class="nav-link w-full text-left hover:bg-red-500/10 hover:text-red-500 border-0">
                <span class="material-symbols-outlined">logout</span>
                <span>Logout</span>
            </button>
        </div>
    </aside>
    `;
}

function createHeader(pageTitle = 'Olumba') {
    return `
    <header class="bg-background border-b border-footer-border/20 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <!-- Mobile menu button -->
                <button id="mobileMenuToggle" class="md:hidden p-2 hover:bg-background-alt rounded-lg">
                    <span class="material-symbols-outlined text-text-color">menu</span>
                </button>
                <a href="/dashboard.html" class="flex items-center">
                    <img src="/assets/olumba-logo.png" alt="Olumba" class="h-10 w-auto" />
                </a>
            </div>
            <div class="hidden md:flex items-center gap-4">
                <div class="relative">
                    <input 
                        type="text" 
                        id="globalSearch"
                        placeholder="Search projects, tasks, documents..." 
                        class="w-64 px-4 py-2 pl-10 text-sm border border-footer-border/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-color/40 text-sm">search</span>
                    
                    <!-- Search Results Dropdown -->
                    <div id="searchResults" class="hidden absolute top-full left-0 right-0 mt-2 bg-background border border-footer-border/20 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                        <div id="searchResultsContent" class="p-2"></div>
                    </div>
                </div>
                <button id="notificationBtn" class="relative p-2 hover:bg-background-alt rounded-lg">
                    <span class="material-symbols-outlined text-text-color/60">notifications</span>
                    <span id="headerNotificationBadge" class="hidden absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">0</span>
                </button>
            </div>
            
            <!-- Mobile header buttons -->
            <div class="md:hidden flex items-center gap-2">
                <button id="mobileNotificationBtn" class="relative p-2 hover:bg-background-alt rounded-lg">
                    <span class="material-symbols-outlined text-text-color/60">notifications</span>
                    <span id="mobileNotificationBadge" class="hidden absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">0</span>
                </button>
                <button id="mobileSearchBtn" class="p-2 hover:bg-background-alt rounded-lg">
                    <span class="material-symbols-outlined text-text-color/60">search</span>
                </button>
            </div>
        </div>
        
        <!-- Mobile search bar -->
        <div id="mobileSearchBar" class="hidden md:hidden mt-4">
            <div class="relative">
                <input 
                    type="text" 
                    id="mobileGlobalSearch"
                    placeholder="Search projects, tasks, documents..." 
                    class="w-full px-4 py-2 pl-10 text-sm border border-footer-border/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-color/40 text-sm">search</span>
                
                <!-- Mobile Search Results Dropdown -->
                <div id="mobileSearchResults" class="hidden absolute top-full left-0 right-0 mt-2 bg-background border border-footer-border/20 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    <div id="mobileSearchResultsContent" class="p-2"></div>
                </div>
            </div>
        </div>
    </header>
    `;
}

// Initialize navigation
function initNav(activePage) {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error('App container not found');
        return;
    }
    
    appContainer.innerHTML = `
        <div class="flex h-screen bg-background-alt relative">
            <!-- Mobile overlay -->
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>
            
            ${createSidebar(activePage)}
            <div class="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
                ${createHeader()}
                <main id="mainContent" class="flex-1 overflow-y-auto">
                    <!-- Content will be inserted here -->
                </main>
            </div>
        </div>
    `;
    
    // Setup event listeners
    setupNavListeners();
}

function setupNavListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebar && sidebarOverlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        };
        
        const closeSidebar = () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        };
        
        mobileMenuToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        // Close sidebar when clicking nav links on mobile
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to allow navigation to start
                setTimeout(closeSidebar, 100);
            });
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Use Clerk sign out if available
                if (window.clerkAuth && window.clerkAuth.isAuthenticated()) {
                    console.log('Signing out with Clerk...');
                    await window.clerkAuth.signOut();
                } else {
                    // Fallback to legacy auth
                    console.log('Signing out with legacy auth...');
                    await auth.logout();
                }
                
                // Clear all local storage
                localStorage.clear();
                
                // Redirect to login page
                window.location.href = '/login-clerk.html';
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if API call fails
                localStorage.clear();
                window.location.href = '/login-clerk.html';
            }
        });
    }
    
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            window.location.href = '/notifications.html';
        });
    }
    
    // Mobile notification button
    const mobileNotificationBtn = document.getElementById('mobileNotificationBtn');
    if (mobileNotificationBtn) {
        mobileNotificationBtn.addEventListener('click', () => {
            window.location.href = '/notifications.html';
        });
    }
    
    // Mobile search button
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBtn && mobileSearchBar) {
        mobileSearchBtn.addEventListener('click', () => {
            mobileSearchBar.classList.toggle('hidden');
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    const searchResultsContent = document.getElementById('searchResultsContent');
    
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                await performSearch(query);
            }, 300); // Debounce 300ms
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                searchResults.classList.remove('hidden');
            }
        });
        
        // Close search on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    }
    
    // Mobile search functionality
    const mobileSearchInput = document.getElementById('mobileGlobalSearch');
    const mobileSearchResults = document.getElementById('mobileSearchResults');
    const mobileSearchResultsContent = document.getElementById('mobileSearchResultsContent');
    
    let mobileSearchTimeout;
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', async (e) => {
            clearTimeout(mobileSearchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                mobileSearchResults.classList.add('hidden');
                return;
            }
            
            mobileSearchTimeout = setTimeout(async () => {
                await performMobileSearch(query);
            }, 300); // Debounce 300ms
        });
        
        mobileSearchInput.addEventListener('focus', () => {
            if (mobileSearchInput.value.length >= 2) {
                mobileSearchResults.classList.remove('hidden');
            }
        });
        
        // Close mobile search on click outside
        document.addEventListener('click', (e) => {
            if (!mobileSearchInput.contains(e.target) && !mobileSearchResults.contains(e.target)) {
                mobileSearchResults.classList.add('hidden');
            }
        });
    }
    
    // Load notification count
    loadNotificationCount();
}

async function performMobileSearch(query) {
    const mobileSearchResults = document.getElementById('mobileSearchResults');
    const mobileSearchResultsContent = document.getElementById('mobileSearchResultsContent');
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const results = await response.json();
        
        if (results.total === 0) {
            mobileSearchResultsContent.innerHTML = `
                <div class="p-4 text-center text-text-color/60 text-sm">
                    No results found for "${query}"
                </div>
            `;
        } else {
            mobileSearchResultsContent.innerHTML = renderSearchResults(results);
        }
        
        mobileSearchResults.classList.remove('hidden');
    } catch (error) {
        console.error('Mobile search failed:', error);
    }
}

async function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const searchResultsContent = document.getElementById('searchResultsContent');
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const results = await response.json();
        
        if (results.total === 0) {
            searchResultsContent.innerHTML = `
                <div class="p-4 text-center text-text-color/60 text-sm">
                    No results found for "${query}"
                </div>
            `;
        } else {
            searchResultsContent.innerHTML = renderSearchResults(results);
        }
        
        searchResults.classList.remove('hidden');
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function renderSearchResults(results) {
    let html = '';
    
    if (results.projects.length > 0) {
        html += `<div class="mb-2"><p class="text-xs font-semibold text-text-color/60 uppercase px-2 py-1">Projects</p>`;
        results.projects.forEach(item => {
            html += `
                <a href="/project-detail.html?id=${item.id}" class="block px-3 py-2 hover:bg-background-alt rounded text-sm">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-base">folder</span>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-text-color truncate">${item.name}</p>
                            <p class="text-xs text-text-color/60 truncate">${item.description || 'No description'}</p>
                        </div>
                    </div>
                </a>
            `;
        });
        html += '</div>';
    }
    
    if (results.tasks.length > 0) {
        html += `<div class="mb-2"><p class="text-xs font-semibold text-text-color/60 uppercase px-2 py-1">Tasks</p>`;
        results.tasks.forEach(item => {
            html += `
                <a href="/task-detail.html?id=${item.id}" class="block px-3 py-2 hover:bg-background-alt rounded text-sm">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-accent-2 text-base">task_alt</span>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-text-color truncate">${item.name}</p>
                            <p class="text-xs text-text-color/60 truncate">${item.project_name}</p>
                        </div>
                    </div>
                </a>
            `;
        });
        html += '</div>';
    }
    
    if (results.documents.length > 0) {
        html += `<div class="mb-2"><p class="text-xs font-semibold text-text-color/60 uppercase px-2 py-1">Documents</p>`;
        results.documents.forEach(item => {
            html += `
                <a href="/document-history.html?id=${item.id}" class="block px-3 py-2 hover:bg-background-alt rounded text-sm">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-accent-1 text-base">description</span>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-text-color truncate">${item.name}</p>
                            <p class="text-xs text-text-color/60 truncate">${item.project_name} • ${item.discipline || 'General'}</p>
                        </div>
                    </div>
                </a>
            `;
        });
        html += '</div>';
    }
    
    if (results.users && results.users.length > 0) {
        html += `<div><p class="text-xs font-semibold text-text-color/60 uppercase px-2 py-1">Team Members</p>`;
        results.users.forEach(item => {
            html += `
                <div class="block px-3 py-2 hover:bg-background-alt rounded text-sm">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-500 text-base">person</span>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-text-color truncate">${item.full_name}</p>
                            <p class="text-xs text-text-color/60 truncate">${item.email} • ${item.role}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    return html;
}

async function loadNotificationCount() {
    try {
        const result = await notifications.getUnreadCount();
        const count = result.count || 0;
        
        const badge = document.getElementById('notificationBadge');
        const headerBadge = document.getElementById('headerNotificationBadge');
        const mobileBadge = document.getElementById('mobileNotificationBadge');
        
        if (count > 0) {
            if (badge) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            }
            if (headerBadge) {
                headerBadge.textContent = count;
                headerBadge.classList.remove('hidden');
            }
            if (mobileBadge) {
                mobileBadge.textContent = count;
                mobileBadge.classList.remove('hidden');
            }
        } else {
            if (badge) badge.classList.add('hidden');
            if (headerBadge) headerBadge.classList.add('hidden');
            if (mobileBadge) mobileBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to load notification count:', error);
    }
}

// CSS styles for navigation
const navStyles = `
<style>
.nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.8;
    transition: all 0.2s;
    text-decoration: none;
    cursor: pointer;
}

.nav-link:hover {
    background-color: rgba(33, 113, 242, 0.1);
    opacity: 1;
    color: var(--primary);
}

.nav-link.active {
    background-color: rgba(33, 113, 242, 0.1);
    color: var(--primary);
    font-weight: 600;
    opacity: 1;
}

.nav-link .material-symbols-outlined {
    font-size: 1.25rem;
}

:root {
    --primary: #2171f2;
    --accent-1: #22C55E;
    --accent-2: #FF8C42;
    --background: #FFFFFF;
    --background-alt: #F3F4F6;
    --text-color: #22223B;
    --footer-border: #1E293B;
}
</style>
`;

// Add styles to document
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', navStyles);
}
