// DOM Elements
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskModal = document.getElementById('addTaskModal');
const taskDetailsModal = document.getElementById('taskDetailsModal');
const closeBtns = document.querySelectorAll('.close-btn');
const addTaskForm = document.getElementById('addTaskForm');
const taskBoard = document.querySelector('.task-board');
const categories = document.querySelectorAll('.category');
const taskLists = document.querySelectorAll('.task-list');

// State Management
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.currentView = 'board';
        this.currentSort = { field: 'dueDate', direction: 'asc' };
        this.filters = {
            priority: ['high', 'medium', 'low'],
            dateRange: { start: null, end: null }
        };
        this.searchQuery = '';
        this.draggedTask = null;
        this.draggedTaskElement = null;
        this.tags = new Set();
        this.initializeApp();
    }

    initializeApp() {
        try {
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.renderTasks();
            this.updateStats();
            this.setupTheme();
            this.setupKeyboardShortcuts();
            this.loadTags();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showToast('Error initializing application', 'error');
        }
    }

    setupEventListeners() {
        try {
            // View Controls
            document.querySelectorAll('.nav-item').forEach(item => {
                if (item) {
                    item.addEventListener('click', () => this.switchView(item.dataset.view));
                }
            });

            // Theme Toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }

            // Search
            const searchInput = document.getElementById('searchTasks');
            if (searchInput) {
                searchInput.addEventListener('input', this.debounce((e) => {
                    this.searchQuery = e.target.value;
                    this.renderTasks();
                }, 300));
            }

            // Sort and Filter
            const sortBtn = document.getElementById('sortBtn');
            if (sortBtn) {
                sortBtn.addEventListener('click', () => this.toggleModal('sortModal'));
            }

            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                filterBtn.addEventListener('click', () => this.toggleModal('filterModal'));
            }

            document.querySelectorAll('.sort-option').forEach(option => {
                if (option) {
                    option.addEventListener('click', () => this.setSort(option.dataset.sort));
                }
            });

            // Filter Controls
            const applyFiltersBtn = document.getElementById('applyFilters');
            if (applyFiltersBtn) {
                applyFiltersBtn.addEventListener('click', () => this.applyFilters());
            }

            const resetFiltersBtn = document.getElementById('resetFilters');
            if (resetFiltersBtn) {
                resetFiltersBtn.addEventListener('click', () => this.resetFilters());
            }

            // Task Management
            if (addTaskBtn) {
                addTaskBtn.addEventListener('click', () => this.toggleModal('addTaskModal'));
            }

            if (addTaskForm) {
                addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
            }

            closeBtns.forEach(btn => {
                if (btn) {
                    btn.addEventListener('click', () => this.closeAllModals());
                }
            });

            // Category Filters
            categories.forEach(category => {
                if (category) {
                    category.addEventListener('click', () => this.setFilter(category.dataset.filter));
                }
            });

            // Calendar Navigation
            const prevMonthBtn = document.getElementById('prevMonth');
            if (prevMonthBtn) {
                prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
            }

            const nextMonthBtn = document.getElementById('nextMonth');
            if (nextMonthBtn) {
                nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
            }

            // Tags Input
            this.setupTagsInput();

            // Close modals when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeAllModals();
                }
            });

            // Window resize handling
            window.addEventListener('resize', this.debounce(() => {
                this.handleResize();
            }, 250));

            // Before unload handling
            window.addEventListener('beforeunload', () => {
                this.saveTasks();
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            this.showToast('Error setting up event listeners', 'error');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N to add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.toggleModal('addTaskModal');
            }

            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchTasks');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // Ctrl/Cmd + S to save tasks
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveTasks();
                this.showToast('Tasks saved successfully', 'success');
            }
        });
    }

    setupDragAndDrop() {
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            if (list) {
                list.addEventListener('dragstart', (e) => this.handleDragStart(e));
                list.addEventListener('dragend', (e) => this.handleDragEnd(e));
                list.addEventListener('dragover', (e) => this.handleDragOver(e));
                list.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                list.addEventListener('drop', (e) => this.handleDrop(e));
            }
        });
    }

    handleDragStart(e) {
        const taskCard = e.target.closest('.task-card');
        if (taskCard) {
            this.draggedTask = this.tasks.find(task => task.id === taskCard.dataset.id);
            this.draggedTaskElement = taskCard;
            taskCard.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', taskCard.dataset.id);
        }
    }

    handleDragEnd(e) {
        const taskCard = e.target.closest('.task-card');
        if (taskCard) {
            taskCard.classList.remove('dragging');
            document.querySelectorAll('.task-list').forEach(list => {
                list.classList.remove('drag-over');
            });
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const taskList = e.target.closest('.task-list');
        if (taskList && this.draggedTask) {
            const newStatus = taskList.dataset.status;
            this.updateTaskStatus(this.draggedTask.id, newStatus);
            taskList.classList.remove('drag-over');
        }
    }

    setupTagsInput() {
        const tagsInput = document.getElementById('tags');
        const tagsContainer = document.querySelector('.tags-container');
        if (tagsInput && tagsContainer) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tag = e.target.value.trim();
                    if (tag && !this.tags.has(tag)) {
                        this.addTag(tag);
                        e.target.value = '';
                    }
                }
            });

            tagsInput.addEventListener('blur', () => {
                const tag = tagsInput.value.trim();
                if (tag && !this.tags.has(tag)) {
                    this.addTag(tag);
                    tagsInput.value = '';
                }
            });
        }
    }

    addTag(tag) {
        this.tags.add(tag);
        this.renderTags();
        this.saveTags();
    }

    removeTag(tag) {
        this.tags.delete(tag);
        this.renderTags();
        this.saveTags();
    }

    renderTags() {
        const tagsContainer = document.querySelector('.tags-container');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            this.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.innerHTML = `
                    ${tag}
                    <button type="button" aria-label="Remove tag">×</button>
                `;
                tagElement.querySelector('button').addEventListener('click', () => this.removeTag(tag));
                tagsContainer.appendChild(tagElement);
            });
        }
    }

    loadTags() {
        const savedTags = JSON.parse(localStorage.getItem('tags')) || [];
        this.tags = new Set(savedTags);
        this.renderTags();
    }

    saveTags() {
        localStorage.setItem('tags', JSON.stringify([...this.tags]));
    }

    handleAddTask(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const task = {
            id: Date.now().toString(),
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: 'todo',
            dueDate: formData.get('dueDate'),
            tags: [...this.tags],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.closeAllModals();
        this.showToast('Task added successfully', 'success');
        form.reset();
        this.tags.clear();
        this.renderTags();
    }

    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.showToast('Task status updated', 'success');
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.showToast('Task deleted successfully', 'success');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // Populate form with task data
            const form = document.getElementById('addTaskForm');
            if (form) {
                form.title.value = task.title;
                form.description.value = task.description;
                form.priority.value = task.priority;
                form.dueDate.value = task.dueDate;
                this.tags = new Set(task.tags);
                this.renderTags();
                this.toggleModal('addTaskModal');
            }
        }
    }

    renderTasks() {
        try {
            let filteredTasks = this.filterTasks();
            filteredTasks = this.sortTasks(filteredTasks);

            // Update task counts
            this.updateTaskCounts();

            // Render based on current view
            switch (this.currentView) {
                case 'board':
                    this.renderBoardView(filteredTasks);
                    break;
                case 'list':
                    this.renderListView(filteredTasks);
                    break;
                case 'calendar':
                    this.renderCalendarView(filteredTasks);
                    break;
            }
        } catch (error) {
            console.error('Error rendering tasks:', error);
            this.showToast('Error rendering tasks', 'error');
        }
    }

    renderBoardView(tasks) {
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            if (list) {
                list.innerHTML = '';
                const statusTasks = tasks.filter(task => task.status === list.dataset.status);
                statusTasks.forEach(task => {
                    list.appendChild(this.createTaskCard(task));
                });
            }
        });
    }

    renderListView(tasks) {
        const listBody = document.getElementById('listViewBody');
        if (listBody) {
            listBody.innerHTML = '';
            tasks.forEach(task => {
                const row = document.createElement('div');
                row.className = 'list-row';
                row.innerHTML = `
                    <div data-label="Task">
                        <strong>${task.title}</strong>
                        <p>${task.description}</p>
                    </div>
                    <div data-label="Priority">
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div data-label="Status">${task.status}</div>
                    <div data-label="Due Date">${this.formatDate(task.dueDate)}</div>
                    <div data-label="Actions">
                        <button class="btn icon-btn" onclick="taskManager.editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn icon-btn" onclick="taskManager.deleteTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                listBody.appendChild(row);
            });
        }
    }

    renderCalendarView(tasks) {
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDay = firstDay.getDay();

            calendarGrid.innerHTML = '';
            
            // Add day headers
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });

            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startingDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyDay);
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;

                const currentDate = new Date(year, month, day);
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    return taskDate.toDateString() === currentDate.toDateString();
                });

                if (dayTasks.length > 0) {
                    dayElement.classList.add('has-tasks');
                    dayElement.title = `${dayTasks.length} task(s) due`;
                }

                if (currentDate.toDateString() === new Date().toDateString()) {
                    dayElement.classList.add('today');
                }

                dayElement.addEventListener('click', () => {
                    if (dayTasks.length > 0) {
                        this.showDayTasks(dayTasks, currentDate);
                    }
                });

                calendarGrid.appendChild(dayElement);
            }
        }
    }

    showDayTasks(tasks, date) {
        const modal = document.getElementById('taskDetailsModal');
        if (modal) {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.innerHTML = `
                <div class="modal-header">
                    <h2>Tasks for ${this.formatDate(date)}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="task-list">
                    ${tasks.map(task => this.createTaskCard(task).outerHTML).join('')}
                </div>
            `;
            this.toggleModal('taskDetailsModal');
        }
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-footer">
                <div class="task-due-date">
                    <i class="fas fa-calendar"></i>
                    ${this.formatDate(task.dueDate)}
                </div>
                <div class="task-tags">
                    ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn icon-btn" onclick="taskManager.editTask('${task.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn icon-btn" onclick="taskManager.deleteTask('${task.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return card;
    }

    filterTasks() {
        return this.tasks.filter(task => {
            // Filter by status
            if (this.currentFilter !== 'all' && task.status !== this.currentFilter) {
                return false;
            }

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                const searchableText = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase();
                if (!searchableText.includes(query)) {
                    return false;
                }
            }

            // Filter by priority
            if (this.filters.priority.length > 0 && !this.filters.priority.includes(task.priority)) {
                return false;
            }

            // Filter by date range
            if (this.filters.dateRange.start && this.filters.dateRange.end) {
                const taskDate = new Date(task.dueDate);
                const startDate = new Date(this.filters.dateRange.start);
                const endDate = new Date(this.filters.dateRange.end);
                if (taskDate < startDate || taskDate > endDate) {
                    return false;
                }
            }

            return true;
        });
    }

    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            let comparison = 0;
            switch (this.currentSort.field) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'dueDate':
                    comparison = new Date(a.dueDate) - new Date(b.dueDate);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
            }
            return this.currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }

    setSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort = { field, direction: 'asc' };
        }
        this.renderTasks();
        this.closeAllModals();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.category').forEach(category => {
            if (category) {
                category.classList.toggle('active', category.dataset.filter === filter);
            }
        });
        this.renderTasks();
    }

    applyFilters() {
        const priorityCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;

        this.filters.priority = Array.from(priorityCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        this.filters.dateRange = {
            start: startDate || null,
            end: endDate || null
        };

        this.renderTasks();
        this.closeAllModals();
    }

    resetFilters() {
        this.filters = {
            priority: ['high', 'medium', 'low'],
            dateRange: { start: null, end: null }
        };

        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });

        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';

        this.renderTasks();
    }

    updateTaskCounts() {
        try {
            const counts = {
                all: this.tasks.length,
                todo: this.tasks.filter(t => t.status === 'todo').length,
                'in-progress': this.tasks.filter(t => t.status === 'in-progress').length,
                completed: this.tasks.filter(t => t.status === 'completed').length
            };

            // Update category counts
            Object.entries(counts).forEach(([status, count]) => {
                const countElement = document.getElementById(`${status}TasksCount`);
                const columnCountElement = document.getElementById(`${status}ColumnCount`);
                
                if (countElement) {
                    countElement.textContent = count;
                }
                if (columnCountElement) {
                    columnCountElement.textContent = count;
                }
            });
        } catch (error) {
            console.error('Error updating task counts:', error);
        }
    }

    updateStats() {
        try {
            const totalTasks = this.tasks.length;
            const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
            const pendingTasks = totalTasks - completedTasks;

            const totalElement = document.getElementById('totalTasks');
            const completedElement = document.getElementById('completedTasks');
            const pendingElement = document.getElementById('pendingTasks');

            if (totalElement) totalElement.textContent = totalTasks;
            if (completedElement) completedElement.textContent = completedTasks;
            if (pendingElement) pendingElement.textContent = pendingTasks;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    switchView(view) {
        try {
            this.currentView = view;
            document.querySelectorAll('.nav-item').forEach(item => {
                if (item) {
                    item.classList.toggle('active', item.dataset.view === view);
                }
            });

            const boardView = document.getElementById('boardView');
            const listView = document.getElementById('listView');
            const calendarView = document.getElementById('calendarView');

            if (boardView) boardView.classList.toggle('hidden', view !== 'board');
            if (listView) listView.classList.toggle('hidden', view !== 'list');
            if (calendarView) calendarView.classList.toggle('hidden', view !== 'calendar');

            if (view === 'calendar') {
                this.renderCalendarView(this.filterTasks());
            }
        } catch (error) {
            console.error('Error switching view:', error);
            this.showToast('Error switching view', 'error');
        }
    }

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.toggle('show');
            if (modal.classList.contains('show')) {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        this.showToast(`Switched to ${isDark ? 'light' : 'dark'} theme`, 'info');
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    navigateMonth(delta) {
        const currentMonth = document.getElementById('currentMonth');
        if (currentMonth) {
            const date = new Date(currentMonth.textContent);
            date.setMonth(date.getMonth() + delta);
            currentMonth.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            this.renderCalendarView(this.filterTasks());
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            `;
            toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 5000);
        }
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': return 'info-circle';
            default: return 'info-circle';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showToast('Error saving tasks', 'error');
        }
    }

    handleResize() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar && mainContent) {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize TaskManager
const taskManager = new TaskManager(); 