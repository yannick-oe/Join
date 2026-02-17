// #region Task detail overlay
/**
 * Opens task detail overlay.
 * @param {string} taskId
 */
function openBoardTaskDetail(taskId) {
	const task = findBoardTaskById(taskId);
	if (!task) return;
	const panel = document.getElementById("boardTaskDetailPanel");
	if (!panel) return;
	const detailViewModel = buildBoardTaskDetailViewModel(task);
	panel.innerHTML = getBoardTaskDetailTemplate(detailViewModel);
	setBoardElementVisible("boardTaskDetailOverlay", true);
}

/**
 * Builds view model for task detail template.
 * @param {Object} task
 */
function buildBoardTaskDetailViewModel(task) {
	const detailText = getBoardTaskDetailTextFields(task);
	const detailMeta = getBoardTaskDetailMetaFields(task);
	return { taskId: task.id, ...detailText, ...detailMeta };
}

/**
 * Builds detail text fields.
 * @param {Object} task
 */
function getBoardTaskDetailTextFields(task) {
	return {
		categoryClass: boardGetCategoryClassName(task.category),
		categoryLabel: boardEscapeHtml(task.category || "Task"),
		title: boardEscapeHtml(task.title || "Untitled task"),
		description: boardEscapeHtml(task.description || ""),
		dueDateLabel: boardEscapeHtml(boardFormatDateForDisplay(task.dueDate)),
	};
}

/**
 * Builds detail priority and content fields.
 * @param {Object} task
 */
function getBoardTaskDetailMetaFields(task) {
	const priorityLabel = boardState.priorityLabels[task.priority] || "Medium";
	return {
		priorityLabel: boardEscapeHtml(priorityLabel),
		priorityIcon: boardState.priorityIcons[task.priority] || boardState.priorityIcons.medium,
		assigneesHtml: buildBoardTaskDetailAssigneesHtml(task),
		subtasksHtml: buildBoardTaskDetailSubtasksHtml(task),
	};
}

/**
 * Builds assignees html for task detail.
 * @param {Object} task
 */
function buildBoardTaskDetailAssigneesHtml(task) {
	const teamMemberIds = boardGetTaskTeamMemberIds(task);
	if (!teamMemberIds.length) return getBoardTaskDetailUnassignedTemplate();
	const assigneesHtml = teamMemberIds.map((memberId) => getBoardTaskDetailAssigneeHtml(memberId)).join("");
	if (assigneesHtml.trim()) return assigneesHtml;
	return getBoardTaskDetailUnassignedTemplate();
}

/**
 * Builds one assignee html for task detail.
 * @param {string} memberId
 */
function getBoardTaskDetailAssigneeHtml(memberId) {
	const contact = findBoardContactById(memberId);
	if (!contact) return "";
	const assigneeViewModel = {
		color: contact.color || "#29ABE2",
		initials: boardEscapeHtml(boardGetInitials(contact.name)),
		name: boardEscapeHtml(contact.name || "Unknown contact"),
	};
	return getBoardTaskDetailAssigneeTemplate(assigneeViewModel);
}

/**
 * Builds subtasks html for task detail.
 * @param {Object} task
 */
function buildBoardTaskDetailSubtasksHtml(task) {
	const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
	if (!subtasks.length) return getBoardTaskDetailNoSubtasksTemplate();
	return subtasks.map((subtask) => getBoardTaskDetailSubtaskHtml(task.id, subtask)).join("");
}

/**
 * Builds one subtask html for task detail.
 * @param {string} taskId
 * @param {Object} subtask
 */
function getBoardTaskDetailSubtaskHtml(taskId, subtask) {
	const subtaskViewModel = {
		checkedAttribute: subtask.done ? "checked" : "",
		taskId,
		subtaskId: subtask.id,
		text: boardEscapeHtml(subtask.text || ""),
	};
	return getBoardTaskDetailSubtaskTemplate(subtaskViewModel);
}

/**
 * Closes task detail overlay.
 */
function closeBoardTaskDetailOverlay() {
	setBoardElementVisible("boardTaskDetailOverlay", false);
}

/**
 * Closes task detail overlay when clicking backdrop.
 * @param {MouseEvent} event
 */
function closeBoardTaskDetailOverlayOnBackdrop(event) {
	if (event.target.id !== "boardTaskDetailOverlay") return;
	closeBoardTaskDetailOverlay();
}

/**
 * Deletes one task.
 * @param {string} taskId
 */
async function deleteBoardTask(taskId) {
	boardState.tasks = boardState.tasks.filter((task) => task.id !== taskId);
	await persistBoardTasks();
	renderBoardColumns();
	closeBoardTaskDetailOverlay();
}

/**
 * Toggles one subtask status.
 * @param {string} taskId
 * @param {string} subtaskId
 */
async function toggleBoardSubtask(taskId, subtaskId) {
	const task = findBoardTaskById(taskId);
	if (!task || !Array.isArray(task.subtasks)) return;
	task.subtasks = task.subtasks.map((subtask) => {
		if (subtask.id !== subtaskId) return subtask;
		return { ...subtask, done: !subtask.done };
	});
	await persistBoardTasks();
	renderBoardColumns();
	openBoardTaskDetail(taskId);
}
// #endregion

// #region Add task overlay
/**
 * Opens add-task overlay for one target status.
 * @param {string} status
 */
async function openBoardAddTaskOverlay(status) {
	boardState.overlayEditTaskId = "";
	boardState.overlayTargetStatus = boardNormalizeStatus(status);
	renderBoardAddTaskOverlay();
	setBoardElementVisible("boardAddTaskOverlay", true);
	await initAddTaskPage();
	addTaskState.tasks = boardState.tasks.slice();
	resetBoardOverlayFormForCreate();
}

/**
 * Starts editing one existing task.
 * @param {string} taskId
 */
async function startBoardTaskEdit(taskId) {
	const task = findBoardTaskById(taskId);
	if (!task) return;
	boardState.overlayEditTaskId = taskId;
	boardState.overlayTargetStatus = boardNormalizeStatus(task.status);
	renderBoardAddTaskOverlay();
	setBoardElementVisible("boardAddTaskOverlay", true);
	await initAddTaskPage();
	addTaskState.tasks = boardState.tasks.slice();
	fillBoardAddTaskFormFromTask(task);
	closeBoardTaskDetailOverlay();
}

/**
 * Renders add-task overlay shell.
 */
function renderBoardAddTaskOverlay() {
	const panel = document.getElementById("boardAddTaskPanel");
	if (!panel) return;
	const overlayViewModel = buildBoardAddTaskOverlayViewModel();
	panel.innerHTML = getBoardAddTaskOverlayTemplate(overlayViewModel);
}

/**
 * Builds add-task overlay view model.
 */
function buildBoardAddTaskOverlayViewModel() {
	const title = boardState.overlayEditTaskId ? "Edit Task" : "Add Task";
	const submitLabel = boardState.overlayEditTaskId ? "Save Task ✓" : "Create Task ✓";
	return { title, submitLabel };
}

/**
 * Resets overlay form for fresh create mode.
 */
function resetBoardOverlayFormForCreate() {
	if (typeof clearTaskForm === "function") clearTaskForm();
	if (typeof handleSubtaskInput === "function") handleSubtaskInput();
}

/**
 * Submits add-task overlay form.
 * @param {Event} event
 */
async function submitBoardOverlayTask(event) {
	event.preventDefault();
	if (!validateTaskForm()) return;
	const payload = buildBoardOverlayPayload();
	applyBoardOverlayPayload(payload);
	await persistBoardTasks();
	renderBoardColumns();
	closeBoardAddTaskOverlay();
	showBoardTaskToast();
}

/**
 * Builds add-task overlay payload.
 */
function buildBoardOverlayPayload() {
	const payload = buildTaskPayload();
	payload.status = boardState.overlayTargetStatus;
	return payload;
}

/**
 * Applies add/edit payload into task state.
 * @param {Object} payload
 */
function applyBoardOverlayPayload(payload) {
	if (!boardState.overlayEditTaskId) return boardState.tasks.push(payload);
	applyBoardTaskEditPayload(payload);
}

/**
 * Applies edit payload to selected task.
 * @param {Object} payload
 */
function applyBoardTaskEditPayload(payload) {
	const existingTask = findBoardTaskById(boardState.overlayEditTaskId);
	payload.id = boardState.overlayEditTaskId;
	payload.createdAt = existingTask ? existingTask.createdAt : Date.now();
	boardState.tasks = boardState.tasks.map((task) => {
		if (task.id !== boardState.overlayEditTaskId) return task;
		return payload;
	});
}

/**
 * Fills add-task overlay form with existing task data.
 * @param {Object} task
 */
function fillBoardAddTaskFormFromTask(task) {
	applyBoardTaskValuesToOverlay(task);
	applyBoardTaskStateToOverlay(task);
	refreshBoardOverlayUi();
	applyBoardCategoryToggleLabel();
	applyBoardRequiredStars(task);
}

/**
 * Applies task input values into overlay fields.
 * @param {Object} task
 */
function applyBoardTaskValuesToOverlay(task) {
	setInputValue("taskTitle", task.title || "");
	setInputValue("taskDescription", task.description || "");
	setInputValue("taskDate", boardFormatDateForInput(task.dueDate));
}

/**
 * Applies task state values into add-task state.
 * @param {Object} task
 */
function applyBoardTaskStateToOverlay(task) {
	addTaskState.priority = task.priority || "medium";
	addTaskState.selectedCategory = task.category || "";
	addTaskState.selectedContactIds = Array.isArray(task.teamMembers) ? task.teamMembers.slice() : [];
	addTaskState.subtasks = (Array.isArray(task.subtasks) ? task.subtasks : []).map((subtask) => ({ ...subtask }));
}

/**
 * Refreshes add-task overlay ui parts.
 */
function refreshBoardOverlayUi() {
	applyPriorityButtons();
	renderTeamMemberDropdown();
	renderTeamMemberBadges();
	renderCategoryDropdown();
	renderSubtasks();
}

/**
 * Applies category label to dropdown toggle.
 */
function applyBoardCategoryToggleLabel() {
	if (!addTaskState.selectedCategory) return;
	const categoryToggle = document.getElementById("categoryToggle");
	if (categoryToggle) categoryToggle.innerText = addTaskState.selectedCategory;
}

/**
 * Applies required-star states for edit form.
 * @param {Object} task
 */
function applyBoardRequiredStars(task) {
	syncTitleRequiredStar(!!String(task.title || "").trim());
	syncDateRequiredStar(!!String(task.dueDate || "").trim());
	syncCategoryRequiredStar(!!String(task.category || "").trim());
}

/**
 * Closes add-task overlay.
 */
function closeBoardAddTaskOverlay() {
	setBoardElementVisible("boardAddTaskOverlay", false);
	boardState.overlayEditTaskId = "";
	boardState.overlayTargetStatus = "todo";
	if (typeof clearTaskForm === "function") clearTaskForm();
}

/**
 * Closes add-task overlay when clicking backdrop.
 * @param {MouseEvent} event
 */
function closeBoardAddTaskOverlayOnBackdrop(event) {
	if (event.target.id !== "boardAddTaskOverlay") return;
	closeBoardAddTaskOverlay();
}

/**
 * Shows board save toast.
 */
function showBoardTaskToast() {
	setBoardElementVisible("boardTaskToast", true);
	setTimeout(() => setBoardElementVisible("boardTaskToast", false), 2500);
}
// #endregion
