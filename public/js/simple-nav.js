/**
 * Simplified Navigation System
 * Clean, simple, works everywhere
 */

function initSimpleNav(activePage = 'dashboard') {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
            <!-- Sidebar -->
            <aside id="sidebar" class="w-64 bg-white border-r hidden md:block">
                <div class="p-6">
                    <img src="/assets/olumba-logo.png" alt="Olumba" class="h-10">
                </div>
                
                <nav class="px-4">
                    <a href="/dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
                        📊 Dashboard
                    </a>
                    <a href="/projects.html" class="nav-item ${activePage === 'projects' ? 'active' : ''}">
                        📁 Projects
                    </a>
                    <a href="/tasks.html" class="nav-item ${activePage === 'tasks' ? 'active' : ''}">
                        ✓ Tasks
                    </a>
                    <a href="/city-approvals.html" class="nav-item ${activePage === 'city-approvals' ? 'active' : ''}">
                        🏛️ City Approvals
                    </a>
                    <a href="/notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}">
                        🔔 Notifications
                    </a>
                </nav>
                
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <button onclick="logout()" class="nav-item w-full text-left">
                        🚪 Logout
                    </button>
                </div>
            </aside>
            
            <!-- Main Content -->
            <div class="flex-1 flex flex-col">
                <!-- Mobile Header -->
                <header class="bg-white border-b p-4 md:hidden">
                    <button onclick="toggleMobileMenu()" class="text-2xl">☰</button>
                </header>
                
                <!-- Content Area -->
                <main id="mainContent" class="flex-1 overflow-auto p-6">
                    <!-- Page content goes here -->
                </main>
            </div>
        </div>
        
        <style>
            .nav-item {
                display: block;
                padding: 12px 16px;
                margin: 4px 0;
                border-radius: 8px;
                text-decoration: none;
                color: #374151;
                transition: all 0.2s;
            }
            .nav-item:hover {
                background: #f3f4f6;
            }
            .nav-item.active {
                background: #2171f2;
                color: white;
            }
            @media (max-width: 768px) {
                #sidebar {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 50;
                    transform: translateX(-100%);
                    transition: transform 0.3s;
                }
                #sidebar.show {
                    display: block;
                    transform: translateX(0);
                }
            }
        </style>
    `;
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

function logout() {
    localStorage.clear();
    window.location.href = '/login-clerk.html';
}

// Export for global use
window.initSimpleNav = initSimpleNav;
window.toggleMobileMenu = toggleMobileMenu;
window.logout = logout;

