/**
 * Day 4 Main Application - MVC Implementation with Category Features
 * * Orchestrates semua komponen:
 * - Storage Manager
 * - Repositories
 * - Controllers
 * - Views
 * - Category Filtering & Stats
 */

// Global application state
let app = {
    storage: null,
    userRepository: null,
    taskRepository: null,
    userController: null,
    taskController: null,
    taskView: null,
    currentUser: null
};

/**
 * Initialize aplikasi
 */
function initializeApp() {
    console.log('🚀 Initializing Day 4 Task Management System...');
    
    try {
        // Initialize storage manager
        app.storage = new EnhancedStorageManager('taskAppDay4', '4.0');
        console.log('✅ Storage manager initialized');
        
        // Initialize repositories
        app.userRepository = new UserRepository(app.storage);
        app.taskRepository = new TaskRepository(app.storage);
        console.log('✅ Repositories initialized');
        
        // Initialize controllers
        app.userController = new UserController(app.userRepository);
        app.taskController = new TaskController(app.taskRepository, app.userRepository);
        console.log('✅ Controllers initialized');
        
        // Initialize view
        app.taskView = new TaskView(app.taskController, app.userController);
        console.log('✅ Views initialized');
        
        // Setup all event listeners
        setupEventListeners();
        
        // Create demo user jika belum ada
        createDemoUserIfNeeded();
        
        // Show login section
        showLoginSection();
        
        // NEW: Render initial category stats jika user sudah login (opsional)
        renderCategoryStats();
        
        console.log('✅ Day 4 Application initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showMessage('Gagal menginisialisasi aplikasi: ' + error.message, 'error');
    }
}

/**
 * Setup all event listeners (Auth, Category Filters, Quick Actions)
 */
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    
    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.addEventListener('click', showRegisterModal);
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Username input (Enter key)
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Register form & modal
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelRegister = document.getElementById('cancelRegister');
    if (closeRegisterModal) closeRegisterModal.addEventListener('click', hideRegisterModal);
    if (cancelRegister) cancelRegister.addEventListener('click', hideRegisterModal);
    
    // Quick action buttons
    const showOverdueBtn = document.getElementById('showOverdueBtn');
    const showDueSoonBtn = document.getElementById('showDueSoonBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const refreshTasks = document.getElementById('refreshTasks');
    
    if (showOverdueBtn) showOverdueBtn.addEventListener('click', showOverdueTasks);
    if (showDueSoonBtn) showDueSoonBtn.addEventListener('click', showDueSoonTasks);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAppData);
    if (refreshTasks) refreshTasks.addEventListener('click', () => {
        app.taskView.refresh();
        renderCategoryStats();
    });

    // NEW: Category filter buttons
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });

    // NEW: Handle Task Form Submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(taskForm);
            const title = formData.get('title');
            const description = formData.get('description');
            const category = formData.get('category');
            const priority = formData.get('priority');
            const dueDate = formData.get('dueDate');

            try {
                app.taskController.createTask(title, description, dueDate, priority, category, app.currentUser.id);
                taskForm.reset();
                app.taskView.refresh();
                renderCategoryStats();
                showMessage('Task berhasil dibuat!', 'success');
            } catch (err) {
                showMessage(err.message, 'error');
            }
        });
    }
}

// --- AUTHENTICATION HANDLERS ---

function handleLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        showMessage('Username wajib diisi', 'error');
        return;
    }
    
    const response = app.userController.login(username);
    
    if (response.success) {
        app.currentUser = response.data;
        app.taskController.setCurrentUser(app.currentUser.id);
        showMainContent();
        loadUserListForAssign();
        app.taskView.refresh();
        renderCategoryStats(); // Render stats saat login
        showMessage(response.message, 'success');
    } else {
        showMessage(response.error, 'error');
    }
}

function handleLogout() {
    const response = app.userController.logout();
    app.currentUser = null;
    hideMainContent();
    showLoginSection();
    showMessage(response.message, 'info');
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'flex';
}

function hideRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('registerForm');
    if (form) form.reset();
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username')?.trim(),
        email: formData.get('email')?.trim(),
        fullName: formData.get('fullName')?.trim()
    };
    
    const response = app.userController.register(userData);
    if (response.success) {
        hideRegisterModal();
        showMessage(response.message, 'success');
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) usernameInput.value = userData.username;
    } else {
        showMessage(response.error, 'error');
    }
}

// --- UI NAVIGATION ---

function showLoginSection() {
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    if (loginSection) loginSection.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.value = '';
        usernameInput.focus();
    }
}

function showMainContent() {
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (loginSection) loginSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'block';
    if (welcomeMessage && app.currentUser) {
        welcomeMessage.textContent = `Selamat datang, ${app.currentUser.fullName || app.currentUser.username}!`;
    }
}

function hideMainContent() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';
}

// --- NEW CATEGORY FILTERING FUNCTIONS ---

/**
 * Handle category filter changes
 */
function handleCategoryFilter(event) {
    const category = event.target.dataset.category;
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Clear other filter buttons status
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Render tasks filtered by category
    renderTaskList('category', category);
}

/**
 * Update renderTaskList function untuk support category filtering
 */
/**
 * Render Task List dengan Logika Filter yang Diperbaiki
 */
function renderTaskList(filterType = 'all', filterValue = null) {
    const container = document.getElementById('taskList');
    if (!container) return;
    
    // Ambil semua task dari repository
    let tasks = app.taskRepository.findAll();
    
    console.log(`Filtering for: ${filterType}. Total tasks available: ${tasks.length}`);

    // Logika penyaringan
    switch (filterType) {
        case 'pending': 
            tasks = tasks.filter(t => (t.isCompleted === false || t._status !== 'completed')); 
            break;
        case 'completed': 
            tasks = tasks.filter(t => (t.isCompleted === true || t._status === 'completed')); 
            break;
        case 'high': 
            // FIX: Cek properti priority secara case-insensitive dan cek properti privat
            tasks = tasks.filter(t => {
                const p = (t.priority || t._priority || '').toLowerCase();
                return p === 'high' || p === 'urgent'; // High priority juga mencakup Urgent
            });
            break;
        case 'category': 
            tasks = tasks.filter(t => (t.category === filterValue || t._category === filterValue)); 
            break;
    }
    
    // Sort: Terbaru di atas
    tasks.sort((a, b) => new Date(b.createdAt || b._createdAt) - new Date(a.createdAt || a._createdAt));
    
    // Tampilan jika kosong
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Belum ada task untuk filter <strong>${filterType}</strong></p>
                <small>Pastikan prioritas task yang dibuat adalah "High"</small>
            </div>`;
        return;
    }
    
    // Render list
    container.innerHTML = tasks.map(task => createTaskHTML(task)).join('');
}

/**
 * Pastikan createTaskHTML membaca data dengan benar
 */
function createTaskHTML(task) {
    // Gunakan fallback ke properti privat jika getter gagal
    const priority = task.priority || task._priority || 'medium';
    const category = task.category || task._category || 'personal';
    const title = task.title || task._title || 'Untitled';
    const isCompleted = task.isCompleted !== undefined ? task.isCompleted : (task._status === 'completed');
    
    const priorityClass = `priority-${priority}`;
    const completedClass = isCompleted ? 'completed' : '';
    const categoryDisplay = task.getCategoryDisplayName ? task.getCategoryDisplayName() : category;
    
    return `
        <div class="task-item ${priorityClass} ${completedClass}" data-task-id="${task.id || task._id}">
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(title)}</h3>
                    <div class="task-badges">
                        <span class="task-priority">${priority}</span>
                        <span class="task-category category-${category}">${categoryDisplay}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-toggle" onclick="handleTaskToggle('${task.id || task._id}')">
                    ${isCompleted ? '↶' : '✓'}
                </button>
                <button class="btn btn-delete" onclick="handleTaskDelete('${task.id || task._id}')">🗑️</button>
            </div>
        </div>
    `;
}

/**
 * Render category statistics
 */
function renderCategoryStats() {
    // Kita asumsikan ada kontainer stats dengan ID 'taskStats' dari index.html Anda
    const statsContainer = document.getElementById('taskStats');
    if (!statsContainer || !app.currentUser) return;
    
    const categoryStats = app.taskRepository.getCategoryStats(app.currentUser.id);
    const categories = EnhancedTask.getAvailableCategories();
    
    const statsHTML = categories
        .filter(cat => categoryStats[cat] && categoryStats[cat].total > 0)
        .map(cat => {
            const stats = categoryStats[cat];
            const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            return `
                <div class="category-stat-item">
                    <h4>${displayName}</h4>
                    <div class="stat-number">${stats.total}</div>
                    <small>${stats.completed} completed</small>
                </div>
            `;
        }).join('');
    
    if (statsHTML) {
        statsContainer.innerHTML = statsHTML;
    } else {
        statsContainer.innerHTML = '<p>No statistics available yet.</p>';
    }
}

// --- UTILITIES & DEMO ---

function loadUserListForAssign() {
    const response = app.userController.getAllUsers();
    if (response.success) {
        const assigneeSelect = document.getElementById('taskAssignee');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="self">Diri Sendiri</option>';
            response.data.forEach(user => {
                if (user.id !== app.currentUser.id) {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.fullName || user.username;
                    assigneeSelect.appendChild(option);
                }
            });
        }
    }
}

function showOverdueTasks() {
    const response = app.taskController.getOverdueTasks();
    if (response.success) {
        if (response.count === 0) showMessage('Tidak ada task yang overdue', 'info');
        else showMessage(`Ditemukan ${response.count} task yang overdue`, 'warning');
    }
}

function showDueSoonTasks() {
    const response = app.taskController.getTasksDueSoon(3);
    if (response.success) {
        if (response.count === 0) showMessage('Tidak ada task yang akan due dalam 3 hari', 'info');
        else showMessage(`Ditemukan ${response.count} task yang akan due dalam 3 hari`, 'warning');
    }
}

function exportAppData() {
    const exportData = app.storage.exportData();
    if (exportData) {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `task-app-day4-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showMessage('Data berhasil diekspor', 'success');
    }
}

function createDemoUserIfNeeded() {
    const users = app.userRepository.findAll();
    if (users.length === 0) {
        app.userRepository.create({ username: 'demo', email: 'demo@example.com', fullName: 'Demo User' });
        console.log('✅ Demo users created');
    }
}

function showMessage(message, type = 'info') {
    if (app.taskView) app.taskView.showMessage(message, type);
    else console.log(`${type.toUpperCase()}: ${message}`);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for inline button events
window.handleTaskToggle = (id) => {
    const task = app.taskRepository.findById(id);
    const newStatus = task.isCompleted ? 'pending' : 'completed';
    app.taskController.updateTask(id, { status: newStatus });
    app.taskView.refresh();
    renderCategoryStats();
};

window.handleTaskDelete = (id) => {
    if (confirm('Hapus task ini?')) {
        app.taskController.deleteTask(id);
        app.taskView.refresh();
        renderCategoryStats();
    }
};

// Global error handlers
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showMessage('Terjadi kesalahan pada aplikasi', 'error');
});

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);