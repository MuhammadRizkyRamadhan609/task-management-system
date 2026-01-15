/**
 * Enhanced Task Model - Versi Terintegrasi Day 1-4
 */
class EnhancedTask {
    constructor(title, description, ownerId, options = {}) {
        // Validasi Input Dasar
        if (!title || title.trim() === '') throw new Error('Judul task wajib diisi');
        if (!ownerId) throw new Error('Owner ID wajib diisi');
        
        // Properties Dasar (Day 1)
        this._id = this._generateId();
        this._title = title.trim();
        this._description = description ? description.trim() : '';
        this._ownerId = ownerId;
        this._assigneeId = options.assigneeId || ownerId; 
        
        // Properties Kategori & Status (Day 4 & Day 2)
        this._category = this._validateCategory(options.category || 'personal');
        this._tags = Array.isArray(options.tags) ? options.tags : [];
        this._priority = this._validatePriority(options.priority || 'medium');
        this._status = this._validateStatus(options.status || 'pending');
        
        // Date & Time Tracking (Day 2 & 3)
        this._dueDate = options.dueDate ? new Date(options.dueDate) : null;
        this._createdAt = new Date();
        this._updatedAt = new Date();
        this._completedAt = null;
        this._estimatedHours = options.estimatedHours || 0;
        this._actualHours = 0;
        
        this._notes = [];
    }

    // --- GETTERS ---
    get id() { return this._id; }
    get title() { return this._title; }
    get category() { return this._category; }
    get status() { return this._status; }
    get isCompleted() { return this._status === 'completed'; }
    get isOverdue() {
        if (!this._dueDate || this.isCompleted) return false;
        return new Date() > this._dueDate;
    }

    // --- METODE KATEGORI (DAY 4) ---
    updateCategory(newCategory) {
        this._category = this._validateCategory(newCategory);
        this._updateTimestamp();
    }

    static getAvailableCategories() {
        return ['work', 'personal', 'study', 'health', 'finance', 'shopping', 'other'];
    }

    getCategoryDisplayName() {
        const names = {
            'work': 'Work & Business', 'personal': 'Personal', 'study': 'Study & Learning',
            'health': 'Health & Fitness', 'finance': 'Finance & Money', 'shopping': 'Shopping', 'other': 'Other'
        };
        return names[this._category] || this._category;
    }

    isInCategory(category) {
        return this._category === category;
    }

    // --- METODE OPERASI (DAY 2-3) ---
    updateStatus(newStatus) {
        const oldStatus = this._status;
        this._status = this._validateStatus(newStatus);
        if (newStatus === 'completed' && oldStatus !== 'completed') {
            this._completedAt = new Date();
        }
        this._updateTimestamp();
    }

    addNote(note) {
        if (note && note.trim()) {
            this._notes.push({ id: Date.now(), content: note.trim(), createdAt: new Date() });
            this._updateTimestamp();
        }
    }

    // --- STORAGE HELPERS ---
    toJSON() {
        return {
            id: this._id, title: this._title, description: this._description,
            ownerId: this._ownerId, assigneeId: this._assigneeId, category: this._category,
            status: this._status, priority: this._priority, tags: this._tags,
            dueDate: this._dueDate ? this._dueDate.toISOString() : null,
            createdAt: this._createdAt.toISOString(), updatedAt: this._updatedAt.toISOString(),
            estimatedHours: this._estimatedHours, actualHours: this._actualHours,
            notes: this._notes
        };
    }

    static fromJSON(data) {
        const task = new EnhancedTask(data.title, data.description, data.ownerId, data);
        task._id = data.id;
        task._actualHours = data.actualHours || 0;
        task._notes = data.notes || [];
        return task;
    }

    // --- PRIVATE HELPERS ---
    _generateId() { return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
    _updateTimestamp() { this._updatedAt = new Date(); }
    _validateCategory(cat) {
        if (!EnhancedTask.getAvailableCategories().includes(cat)) throw new Error(`Kategori tidak valid: ${cat}`);
        return cat;
    }
    _validatePriority(p) { return ['low', 'medium', 'high', 'urgent'].includes(p) ? p : 'medium'; }
    _validateStatus(s) { return ['pending', 'in-progress', 'blocked', 'completed', 'cancelled'].includes(s) ? s : 'pending'; }
}

if (typeof module !== 'undefined' && module.exports) module.exports = EnhancedTask;
else window.EnhancedTask = EnhancedTask;