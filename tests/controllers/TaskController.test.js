const TestDataFactory = require('../helpers/TestDataFactory');
const TestAssertions = require('../helpers/TestAssertions');
const TaskController = require('../../src/controllers/TaskController');
const TaskRepository = require('../../src/repositories/TaskRepository');
const UserRepository = require('../../src/repositories/UserRepository');

describe('TaskController', () => {
    let taskController;
    let taskRepository;
    let userRepository;
    let mockStorage;
    let testUser;
    
    beforeEach(() => {
        // Setup complete system untuk integration testing
        mockStorage = TestDataFactory.createMockStorage();
        taskRepository = new TaskRepository(mockStorage);
        userRepository = new UserRepository(mockStorage);
        taskController = new TaskController(taskRepository, userRepository);
        
        // Create test user dan set sebagai current user
        const userData = TestDataFactory.createValidUserData();
        testUser = userRepository.create(userData);
        taskController.setCurrentUser(testUser.id);
    });
    
    describe('Task Creation', () => {
        test('should create task successfully', () => {
            const taskData = TestDataFactory.createValidTaskData();
            const response = taskController.createTask(taskData);
            
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data.title).toBe(taskData.title);
            expect(response.data.ownerId).toBe(testUser.id);
            expect(response.message).toContain('berhasil dibuat');
        });
        
        test('should fail when user not logged in', () => {
            taskController.currentUser = null; 
            const taskData = TestDataFactory.createValidTaskData();
            const response = taskController.createTask(taskData);
            
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });
        
        test('should fail when title is empty', () => {
            const taskData = TestDataFactory.createValidTaskData({ title: '' });
            const response = taskController.createTask(taskData);
            
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('Judul task wajib diisi');
        });
        
        test('should fail when assignee does not exist', () => {
            const taskData = TestDataFactory.createValidTaskData({ 
                assigneeId: 'non-existent-user' 
            });
            const response = taskController.createTask(taskData);
            
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('User yang di-assign tidak ditemukan');
        });
    });
    
    describe('Task Retrieval', () => {
        let testTask;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            const createResponse = taskController.createTask(taskData);
            testTask = createResponse.data;
        });
        
        test('should get all user tasks', () => {
            const response = taskController.getTasks();
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data).toHaveLength(1);
            expect(response.data[0].id).toBe(testTask.id);
            expect(response.count).toBe(1);
        });
        
        test('should get task by ID', () => {
            const response = taskController.getTask(testTask.id);
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data.id).toBe(testTask.id);
            expect(response.data.title).toBe(testTask.title);
        });
        
        test('should fail to get non-existent task', () => {
            const response = taskController.getTask('non-existent-id');
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('Task tidak ditemukan');
        });
        
        test('should filter tasks by status', () => {
            const completedTaskData = TestDataFactory.createValidTaskData({ 
                title: 'Completed Task' 
            });
            const completedResponse = taskController.createTask(completedTaskData);
            taskController.updateTask(completedResponse.data.id, { status: 'completed' });
            
            const pendingResponse = taskController.getTasks({ status: 'pending' });
            const completedResponse2 = taskController.getTasks({ status: 'completed' });
            
            expect(pendingResponse.data).toHaveLength(1);
            expect(completedResponse2.data).toHaveLength(1);
            expect(pendingResponse.data[0].status).toBe('pending');
            expect(completedResponse2.data[0].status).toBe('completed');
        });
    });
    
    describe('Task Updates', () => {
        let testTask;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            const createResponse = taskController.createTask(taskData);
            testTask = createResponse.data;
        });
        
        test('should update task successfully', () => {
            const updates = {
                title: 'Updated Title',
                priority: 'high',
                status: 'in-progress'
            };
            const response = taskController.updateTask(testTask.id, updates);
            
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data.title).toBe(updates.title);
            expect(response.data.priority).toBe(updates.priority);
            expect(response.data.status).toBe(updates.status);
        });
        
        test('should fail to update non-existent task', () => {
            const response = taskController.updateTask('non-existent-id', { title: 'Test' });
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('Task tidak ditemukan');
        });
        
        test('should toggle task status', () => {
            expect(testTask.status).toBe('pending');
            const response1 = taskController.toggleTaskStatus(testTask.id);
            expect(response1.data.status).toBe('completed');
            
            const response2 = taskController.toggleTaskStatus(testTask.id);
            expect(response2.data.status).toBe('pending');
        });
    });
    
    describe('Task Deletion', () => {
        let testTask;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData();
            const createResponse = taskController.createTask(taskData);
            testTask = createResponse.data;
        });
        
        test('should delete task successfully', () => {
            const response = taskController.deleteTask(testTask.id);
            TestAssertions.assertControllerResponse(response, true);
            expect(response.message).toContain('berhasil dihapus');
            
            const getResponse = taskController.getTask(testTask.id);
            expect(getResponse.success).toBe(false);
        });
    });
    
    describe('Task Search and Statistics', () => {
        beforeEach(() => {
            const tasks = TestDataFactory.createMultipleTasks(3);
            tasks.forEach(taskData => taskController.createTask(taskData));
        });
        
        test('should search tasks', () => {
            const response = taskController.searchTasks('Task 1');
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data[0].title).toBe('Task 1');
        });
        
        test('should get task statistics', () => {
            const response = taskController.getTaskStats();
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data).toHaveProperty('total');
            expect(response.data.total).toBe(3);
        });
    });
    
    describe('Permission Testing', () => {
        let otherUser;
        let otherUserTask;
        
        beforeEach(() => {
            const otherUserData = TestDataFactory.createValidUserData({
                username: 'otheruser',
                email: 'other@example.com'
            });
            otherUser = userRepository.create(otherUserData);
            
            taskController.setCurrentUser(otherUser.id);
            const createResponse = taskController.createTask(TestDataFactory.createValidTaskData());
            otherUserTask = createResponse.data;
            
            taskController.setCurrentUser(testUser.id);
        });
        
        test('should not allow access to other user task', () => {
            const response = taskController.getTask(otherUserTask.id);
            expect(response.success).toBe(false);
            expect(response.error).toBe('Anda tidak memiliki akses ke task ini');
        });
    });

    // PERBAIKAN: Blok Category Management dipindahkan ke DALAM lingkup TaskController
    describe('Category Management', () => {
        let testTask;
        
        beforeEach(() => {
            const taskData = TestDataFactory.createValidTaskData({ category: 'work' });
            const createResponse = taskController.createTask(taskData);
            testTask = createResponse.data;
        });
        
        test('should get tasks by category', () => {
            const response = taskController.getTasksByCategory('work');
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data).toHaveLength(1);
            expect(response.data[0].category).toBe('work');
            expect(response.categoryDisplayName).toBe('Work & Business');
        });
        
        test('should fail with invalid category', () => {
            const response = taskController.getTasksByCategory('invalid');
            TestAssertions.assertControllerResponse(response, false);
            expect(response.error).toBe('Kategori tidak valid');
        });
        
        test('should get category statistics', () => {
            taskController.createTask(TestDataFactory.createValidTaskData({ category: 'personal' }));
            const response = taskController.getCategoryStats();
            
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data.byCategory.work.total).toBe(1);
            expect(response.data.byCategory.personal.total).toBe(1);
        });
        
        test('should update task category', () => {
            const response = taskController.updateTaskCategory(testTask.id, 'personal');
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data.category).toBe('personal');
        });
        
        test('should get available categories', () => {
            const response = taskController.getAvailableCategories();
            TestAssertions.assertControllerResponse(response, true);
            expect(response.data[0]).toHaveProperty('value');
            expect(response.data[0]).toHaveProperty('label');
        });
    });
}); // <--- PENUTUP UTAMA DI SINI