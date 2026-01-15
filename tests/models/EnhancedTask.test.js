const TestDataFactory = require('../helpers/TestDataFactory');
const TestAssertions = require('../helpers/TestAssertions');
const EnhancedTask = require('../../src/models/EnhancedTask');

describe('EnhancedTask Model', () => {
    
    describe('Task Creation', () => {
        test('should create task with required properties', () => {
            // Arrange
            const taskData = TestDataFactory.createValidTaskData();
            
            // Act
            const task = new EnhancedTask(
                taskData.title, 
                taskData.description, 
                taskData.ownerId,
                { 
                    category: taskData.category,
                    priority: taskData.priority 
                }
            );
            
            // Assert
            expect(task.title).toBe(taskData.title);
            expect(task.description).toBe(taskData.description);
            expect(task.ownerId).toBe(taskData.ownerId);
            expect(task.category).toBe(taskData.category);
            expect(task.priority).toBe(taskData.priority);
            TestAssertions.assertTaskHasRequiredProperties(task);
        });
        
        test('should throw error when title is empty', () => {
            const taskData = TestDataFactory.createValidTaskData({ title: '' });
            expect(() => {
                new EnhancedTask(taskData.title, taskData.description, taskData.ownerId);
            }).toThrow('Judul task wajib diisi');
        });
        
        test('should throw error when ownerId is missing', () => {
            const taskData = TestDataFactory.createValidTaskData();
            expect(() => {
                new EnhancedTask(taskData.title, taskData.description, null);
            }).toThrow('Owner ID wajib diisi');
        });
        
        test('should set default values correctly', () => {
            const taskData = TestDataFactory.createValidTaskData();
            const task = new EnhancedTask(taskData.title, taskData.description, taskData.ownerId);
            
            expect(task.category).toBe('personal');
            expect(task.priority).toBe('medium');
            expect(task.status).toBe('pending');
            expect(task.assigneeId).toBe(taskData.ownerId);
        });
    });
    
    describe('Task Properties and Computed Values', () => {
        let task;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            task = new EnhancedTask(taskData.title, taskData.description, taskData.ownerId);
        });
        
        test('should calculate isCompleted correctly', () => {
            expect(task.isCompleted).toBe(false);
            task.updateStatus('completed');
            expect(task.isCompleted).toBe(true);
        });
        
        test('should calculate isOverdue correctly', () => {
            expect(task.isOverdue).toBe(false);
            
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            task.setDueDate(pastDate);
            expect(task.isOverdue).toBe(true);
            
            task.updateStatus('completed');
            expect(task.isOverdue).toBe(false);
        });
        
        test('should calculate daysUntilDue correctly', () => {
            expect(task.daysUntilDue).toBeNull();
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.setDueDate(tomorrow);
            expect(task.daysUntilDue).toBe(1);
        });
    });
    
    describe('Task Updates', () => {
        let task;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            task = new EnhancedTask(taskData.title, taskData.description, taskData.ownerId);
        });
        
        test('should update title successfully', () => {
            const newTitle = 'Updated Task Title';
            const oldUpdatedAt = task.updatedAt;
            task.updateTitle(newTitle);
            expect(task.title).toBe(newTitle);
            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
        });
        
        test('should throw error when updating title to empty', () => {
            expect(() => {
                task.updateTitle('');
            }).toThrow('Judul task tidak boleh kosong');
        });

        test('should add and remove tags', () => {
            task.addTag('urgent');
            expect(task.tags).toContain('urgent');
            task.removeTag('urgent');
            expect(task.tags).not.toContain('urgent');
        });
        
        test('should not add duplicate tags', () => {
            task.addTag('urgent');
            task.addTag('urgent');
            expect(task.tags.filter(tag => tag === 'urgent')).toHaveLength(1);
        });
    });

    // PERBAIKAN: Blok ini dipindahkan ke tingkat yang benar (sebagai sibling describe lainnya)
    describe('Category Management', () => {
        let task;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            task = new EnhancedTask(taskData.title, taskData.description, taskData.ownerId);
        });
        
        test('should have default category', () => {
            expect(task.category).toBe('personal');
        });
        
        test('should update category successfully', () => {
            task.updateCategory('work');
            expect(task.category).toBe('work');
            expect(task.updatedAt).toBeInstanceOf(Date);
        });
        
        test('should throw error for invalid category', () => {
            expect(() => {
                task.updateCategory('invalid-category');
            }).toThrow('Kategori tidak valid');
        });
        
        test('should return available categories', () => {
            const categories = EnhancedTask.getAvailableCategories();
            expect(categories).toBeInstanceOf(Array);
            expect(categories).toContain('work');
            expect(categories).toContain('shopping');
        });
        
        test('should get category display name', () => {
            task.updateCategory('work');
            expect(task.getCategoryDisplayName()).toBe('Work & Business');
        });
        
        test('should check if task is in category', () => {
            task.updateCategory('study');
            expect(task.isInCategory('study')).toBe(true);
            expect(task.isInCategory('work')).toBe(false);
        });
    });
    
    describe('Task Serialization', () => {
        test('should serialize and deserialize correctly', () => {
            // Arrange
            const taskData = TestDataFactory.createValidTaskData();
            const originalTask = new EnhancedTask(
                taskData.title, 
                taskData.description, 
                taskData.ownerId,
                {
                    category: 'work',
                    priority: 'high',
                    dueDate: new Date('2024-12-31')
                }
            );
            
            originalTask.addTag('important');
            originalTask.addNote('This is a test note');
            
            // Act
            const json = originalTask.toJSON();
            const restoredTask = EnhancedTask.fromJSON(json);
            
            // Assert
            expect(restoredTask.id).toBe(originalTask.id);
            expect(restoredTask.title).toBe(originalTask.title);
            expect(restoredTask.category).toBe(originalTask.category);
            expect(restoredTask.tags).toEqual(originalTask.tags);
            expect(restoredTask.notes).toEqual(originalTask.notes);
            expect(restoredTask.dueDate.getTime()).toBe(originalTask.dueDate.getTime());
        });
    });
});