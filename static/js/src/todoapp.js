(function(doc, $){
	'use strict';

	var ENTER_KEY_CODE = 13;

	function ToDoApp(rootNode) {
		this.rootNode = rootNode;
		this.currentTaskListId = null;
		this.currentTaskListInfo = null;
		this.toDoList = null;
		this.filterHref = null;
		this.taskListList = null;
		this.taskListSelect = null;
		this.init();
	}

	ToDoApp.prototype.allTasksChecked = function () {
		var taskListInfo = this.currentTaskListInfo;
		var tasks = taskListInfo.tasks;

		var tasksChecked = true;
		for (var i = 0; i < tasks.length; i++) {
			if (tasks[i].done === false) {
				tasksChecked = false;
				break;
			}
		}

		if (tasks.length === 0) {
			tasksChecked = false;
		}

		return tasksChecked;
	};

	ToDoApp.prototype.filterTasks = function () {
		var taskListInfo = this.currentTaskListInfo;
		var tasks = taskListInfo.tasks;

		var hiddenTaskNum = 0;
		if (this.filterHref === '#/') {
			this.toDoList.find('li').show();
			if (tasks.length > 0) {
				this.taskListList.show();
			}
		} else if (this.filterHref === '#/completed') {
			this.toDoList.find('li').each(function(index, listItem){
				var currListItem = $(listItem);
				if (tasks[index].done === true) {
					currListItem.show();
				} else {
					currListItem.hide();
					hiddenTaskNum++;
				}
			});

			if (tasks.length === hiddenTaskNum) {
				this.taskListList.hide();
			} else {
				this.taskListList.show();
			}
		} else if (this.filterHref === '#/active') {
			this.toDoList.find('li').each(function(index, listItem){
				var currListItem = $(listItem);
				if (tasks[index].done === false) {
					currListItem.show();
				} else {
					currListItem.hide();
					hiddenTaskNum++;
				}
			});

			if (tasks.length === hiddenTaskNum) {
				this.taskListList.hide();
			} else {
				this.taskListList.show();
			}
		}
	};

	ToDoApp.prototype.addTaskEventHandlers = function () {
		// Changing "done" status of a task
		this.toDoList.on('click', '.toggle', $.proxy(function(event) {
			var toggle = $(event.currentTarget);
			var closestLi = toggle.closest('li');

			var taskDescr = closestLi.data('task-descr');
			if (toggle.prop('checked')) {
				taskDescr.done = true;
			} else {
				taskDescr.done = false;
			}

			this.filterTasks();

			var currentTaskListId = this.currentTaskListId;
			var currentTaskListInfo = this.currentTaskListInfo;
			
			if (currentTaskListId) {
				$.ajax({
					url: '/todos/' + currentTaskListId,
					method: 'PUT',
					data: {
						todo: JSON.stringify(currentTaskListInfo)
					}
				});
			}

			var tasksChecked = this.allTasksChecked();
			if (tasksChecked) {
				this.toggleAll.prop('checked', true);
			} else {
				this.toggleAll.prop('checked', false);
			}
		}, this));

		// Event handler for editing task
		this.toDoList.on('dblclick', 'label', function(event) { 
			var taskLabel = $(event.currentTarget);
			var closestLi = taskLabel.closest('li');
			var textInput = closestLi.find('.edit');

			closestLi.addClass('editing');
			textInput.focus();
		});

		// Event handler for "blur" on task edit box 
		this.toDoList.on('blur', '.edit', $.proxy(function(event) { 
			var textInput = $(event.currentTarget);
			var closestLi = textInput.closest('li');
			var labelTaskDescr = closestLi.find('label');
			var newTextInputVal = textInput.val();

			closestLi.removeClass('editing');
			labelTaskDescr.text(newTextInputVal);

			var taskDescr = closestLi.data('task-descr');
			taskDescr.description = newTextInputVal;

			var currentTaskListId = this.currentTaskListId;
			var currentTaskListInfo = this.currentTaskListInfo;

			$.ajax({
				url: '/todos/' + currentTaskListId,
				method: 'PUT',
				data: {
					todo: JSON.stringify(currentTaskListInfo)
				}
			});
		}, this));

		// Event handler for changing existed task 
		this.toDoList.on('keydown', '.edit', function(event) { 
			var textInput = $(event.currentTarget);

			if (event.which === ENTER_KEY_CODE) {
				var closestLi = textInput.closest('li');
				closestLi.removeClass('editing');
			}
		});

		// Destroying task in a task list 
		this.toDoList.on('click', '.destroy', $.proxy(function(event) {
			var destroyButton = $(event.currentTarget);
			var liToDestroy = destroyButton.closest('li');
			var taskDescrToDestroy = liToDestroy.data('task-descr');
			
			var TaskListId = this.currentTaskListId;
			var taskListInfo = this.currentTaskListInfo;
			var tasks = taskListInfo.tasks;
			var taskIndexToDestroy = tasks.indexOf(taskDescrToDestroy);
			tasks.splice(taskIndexToDestroy, 1);

			$.ajax({
				url: '/todos/' + TaskListId,
				method: 'PUT',
				data: {
					todo: JSON.stringify(taskListInfo)
				}
			});

			liToDestroy.remove();
		}, this));

		// Marking task in a task list as completed
		this.toDoList.on('click', '.toggle', function(event) {
			var currCheckBox = event.currentTarget;
			var toggleLi = $(currCheckBox).closest('li');

			if (currCheckBox.checked) {
				toggleLi.addClass('completed');
			} else {
				toggleLi.removeClass('completed');
			}

			//event.currentTarget;
			//toggle()
		});

		// Event handler for entering task 
		var enterTask = this.rootNode.find('#new-todo');
		enterTask.on('keydown', $.proxy(function(event) {
			var newTaskTitle = enterTask.val();
			if ((event.which === ENTER_KEY_CODE) &&
				(newTaskTitle !== "")) {
				enterTask.val("");
			
				var currentTaskListId = this.currentTaskListId;
				var currentTaskListInfo = this.currentTaskListInfo;

				if (currentTaskListId) {
					this.taskListList.show();
					var newLi;

					newLi = this.liTemplate.replace(/{{taskTitle}}/g, newTaskTitle); 
					newLi = $(newLi);
					this.toDoList.append(newLi);
					var newTask = {
						description: newTaskTitle,
						done: false
					};

					newLi.data('task-descr', newTask);

					currentTaskListInfo.tasks.push(newTask);
					$.ajax({
						url: '/todos/' + currentTaskListId,
						method: 'PUT',
						data: {
							todo: JSON.stringify(currentTaskListInfo)
						}
					});
				}
			}
		}, this));

		// Changing task filters
		var taskFilterList = this.rootNode.find('#current-task-list-filters'); 
		var taskFilters = taskFilterList.find('a');
		taskFilterList.on('click', 'a', $.proxy(function(event) {
			var self = $(event.target);
			
			taskFilters.removeClass('selected');
			self.addClass('selected');
			
			this.filterHref = self.attr('href');
			
			var taskListId = this.currentTaskListId;

			if (taskListId) {
				this.filterTasks();
			}
		}, this));
	};

	ToDoApp.prototype.addTaskListEventHandlers = function () {
		this.taskListSelect = this.rootNode.find('#todo-list-title').eq(0);
		
		// Event handler for selecting task list
		this.taskListSelect.on('change', $.proxy(function(event) {
			var self =$(event.currentTarget);
			var optionSelected = self.find('option:selected');

			this.toDoList.empty();
			this.taskListList.hide();

			this.currentTaskListId = optionSelected.data('tasklist-id');
			this.currentTaskListInfo = optionSelected.data('tasklist-info');

			var taskListInfo = this.currentTaskListInfo;
			if (taskListInfo) {
				var tasks = taskListInfo.tasks;
				var i;
				var newLi;

				for (i = 0; i < tasks.length; i++) {
					newLi = this.liTemplate.replace(/{{taskTitle}}/g, tasks[i].description); 
					if (tasks[i].done === true) {
						newLi = newLi.replace(/{{checked}}/, 'checked');
					}
					var newLiEl = $(newLi);
					this.toDoList.append(newLiEl);
					newLiEl.data('task-descr', tasks[i]);
					if (tasks[i].done === true) {
						newLiEl.addClass('completed');
					}
				}

				var tasksChecked = this.allTasksChecked();
				if (tasksChecked) {
					this.toggleAll.prop('checked', true);
				}

				if (tasks.length > 0) {
					this.taskListList.show();
				}

				this.filterTasks();
			}	
		}, this));

		// Entering task list title
		var enterTaskList = this.rootNode.find('.todo-list-input').eq(0);
		enterTaskList.on('keydown', $.proxy(function(event) {
			var newTaskList = enterTaskList.val();
			if ((event.which === ENTER_KEY_CODE) &&
				(newTaskList !== "")) {
				enterTaskList.val("");

				var taskListId = new Date().getTime();
				var taskListInfo = {
					title: newTaskList,
					created: new Date().toString(),
					tasks: []
				};

				var taskOption = $('<option>' + taskListInfo.title + '</option>');
				this.taskListSelect.append(taskOption);
				taskOption.data('tasklist-id', taskListId);
				taskOption.data('tasklist-info', taskListInfo);

				this.currentTaskListId = taskListId;
				this.currentTaskListInfo = taskListInfo;			
				
				$.post('/todos/' + taskListId, {
					todo: JSON.stringify(taskListInfo)
				});							
			}
		}, this));

		// Destroying task list
		var destroyList = this.rootNode.find('.destroy-list').eq(0);
		destroyList.on('click', $.proxy(function () {
			var currentTaskListId = this.currentTaskListId;
					
			if (currentTaskListId) {
				$.ajax({
					url: '/todos/' + currentTaskListId,
					method: 'DELETE',
				});
				this.toDoList.empty();
				this.taskListSelect.children(":selected").remove();
				this.taskListList.hide();
			}
			this.currentTaskListId = null;
			this.currentTaskListInfo = null;
		}, this));

		// Event handler for checking all tasks in a task list
		this.toggleAll.on('click', $.proxy(function(event) {
			var toggleCheckBox = event.currentTarget;
			var taskCheckBoxes = this.toDoList.find('.toggle');
			
			var taskListId = this.currentTaskListId;
			var taskListInfo = this.currentTaskListInfo;
			var tasks = taskListInfo.tasks;
			var i;
			
			if (toggleCheckBox.checked) { 
				taskCheckBoxes.prop('checked', true);
				this.toDoList.find('>li').addClass('completed');
				for (i = 0; i < tasks.length; i++) {
					tasks[i].done = true;
				}
			} else {
				taskCheckBoxes.prop('checked', false);
				this.toDoList.find('>li').removeClass('completed');
				for (i = 0; i < tasks.length; i++) {
					tasks[i].done = false;
				}
			}

			$.ajax({
				url: '/todos/' + taskListId,
				method: 'PUT',
				data: {
					todo: JSON.stringify(taskListInfo)
				}
			});
		}, this));
	};


/* List item markup
<li> 
	<div class="view"> 
		<input class="toggle" type="checkbox" {{checked}}> 
		<label>{{taskTitle}}</label> <button class="destroy"></button> 
	</div> 
	<input class="edit" value="{{taskTitle}}"> 
</li> 
*/
	ToDoApp.prototype.init = function () {
		this.toDoList = this.rootNode.find('#todo-list-tasks');
		this.taskListList = this.rootNode.find('#current-task-list-main').eq(0);
		this.liTemplate = '<li><div class="view"><input class="toggle" type="checkbox" {{checked}}><label>{{taskTitle}}</label><button class="destroy"></button></div><input class="edit" value="{{taskTitle}}"></li>';
		this.toggleAll = this.rootNode.find('#toggle-all');

		this.addTaskEventHandlers();
		this.addTaskListEventHandlers();

		// Adding task lists to DOM and binding information about them to DOM  
		$.get('/todos/', $.proxy(function(response) {
			var taskListIds = response;
			$.when.apply($, taskListIds.map(function(taskId) {
				return $.get('/todos/'+ taskId);
			})).then($.proxy(function() {
				for (var i = 0; i < arguments.length; i++) {
					var taskListInfo = arguments[i][0];

					var taskOption = $('<option>' + taskListInfo.title + '</option>');
					this.taskListSelect.append(taskOption);
					taskOption.data('tasklist-id', taskListIds[i]);
					taskOption.data('tasklist-info', taskListInfo);
				}
			}, this));
		}, this));

		this.taskListList.hide();
	};

	window.ToDoApp = ToDoApp;
}(document, jQuery));