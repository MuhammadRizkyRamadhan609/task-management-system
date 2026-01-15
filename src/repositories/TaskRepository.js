// src/repositories/TaskRepository.js

if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    if (typeof EnhancedTask === 'undefined') EnhancedTask = require('../models/EnhancedTask');
}

class TaskRepository {
    constructor(storageManager) {
        this.storage = storageManager;
        this.tasks = new Map();
        this.storageKey = 'tasks';
        this._loadTasksFromStorage();
    }

    // --- CRUD ---
    create(taskData) {
        const task = new EnhancedTask(taskData.title, taskData.description, taskData.ownerId, taskData);
        this.tasks.set(task.id, task);
        this._saveTasksToStorage();
        return task;
    }

    findAll() { return Array.from(this.tasks.values()); }
    findById(id) { return this.tasks.get(id) || null; }
    findByOwner(ownerId) { return this.findAll().filter(t => t.ownerId === ownerId); }

    // --- FITUR KATEGORI (DAY 4) ---
    findByCategory(cat) { 
        return this.findAll().filter(t => t.category === cat); 
    }

    getCategoryStats(userId = null) {
        let tasks = userId ? this.findByOwner(userId) : this.findAll();
        const stats = {};
        EnhancedTask.getAvailableCategories().forEach(cat => {
            stats[cat] = { total: 0, completed: 0, pending: 0, overdue: 0 };
        });

        tasks.forEach(task => {
            const cat = task.category;
            if (stats[cat]) {
                stats[cat].total++;
                if (task.isCompleted) stats[cat].completed++;
                else stats[cat].pending++;
                if (task.isOverdue) stats[cat].overdue++;
            }
        });
        return stats;
    }

    getMostUsedCategories(userId = null, limit = 5) {
        const stats = this.getCategoryStats(userId);
        return Object.entries(stats)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, limit)
            .map(([category, data]) => ({
                category,
                count: data.total,
                displayName: EnhancedTask.prototype.getCategoryDisplayName.call({ _category: category })
            }));
    }

    // --- UPDATE & DELETE ---
    update(id, updates) {
        const task = this.findById(id);
        if (!task) return null;
        
        if (updates.title) task.updateTitle(updates.title);
        if (updates.category) task.updateCategory(updates.category);
        if (updates.status) task.updateStatus(updates.status);
        if (updates.addNote) task.addNote(updates.addNote);
        
        this._saveTasksToStorage();
        return task;
    }

    delete(id) {
        const deleted = this.tasks.delete(id);
        if (deleted) this._saveTasksToStorage();
        return deleted;
    }

    // --- STORAGE HELPERS ---
    _loadTasksFromStorage() {
        const data = this.storage.load(this.storageKey, []);
        data.forEach(d => this.tasks.set(d.id, EnhancedTask.fromJSON(d)));
    }

    _saveTasksToStorage() {
        const data = this.findAll().map(t => t.toJSON());
        this.storage.save(this.storageKey, data);
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = TaskRepository;
else window.TaskRepository = TaskRepository;