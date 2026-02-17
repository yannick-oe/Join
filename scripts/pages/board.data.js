// #region Load and persist
/**
 * Loads board contacts and tasks and ensures demo data.
 */
async function loadBoardData() {
	boardState.contacts = await loadBoardContactsSafe();
	boardState.tasks = await loadBoardTasksSafe();
	if (boardState.tasks.length) return;
	await ensureBoardDemoData();
}

/**
 * Loads contacts via storage with fallback.
 */
async function loadBoardContactsSafe() {
	if (typeof loadContacts === "function") {
		const contacts = await loadContacts();
		if (Array.isArray(contacts)) return contacts;
	}
	return [];
}

/**
 * Loads tasks via storage with fallback.
 */
async function loadBoardTasksSafe() {
	if (typeof loadTasks === "function") {
		const tasks = await loadTasks();
		if (Array.isArray(tasks)) return boardNormalizeTaskList(tasks);
	}
	const localTasks = JSON.parse(localStorage.getItem("joinTasks") || "[]");
	return boardNormalizeTaskList(localTasks);
}

/**
 * Persists board task list to active storage adapter.
 */
async function persistBoardTasks() {
	if (typeof saveTasks === "function") {
		await saveTasks(boardState.tasks);
		return;
	}
	localStorage.setItem("joinTasks", JSON.stringify(boardState.tasks));
}
// #endregion

// #region Demo data
/**
 * Ensures demo contacts and tasks for first board start.
 */
async function ensureBoardDemoData() {
	const demoContacts = await ensureBoardDemoContacts();
	boardState.contacts = demoContacts;
	boardState.tasks = buildBoardDemoTasks(demoContacts);
	await persistBoardTasks();
}

/**
 * Ensures all contacts used by demo tasks exist.
 */
async function ensureBoardDemoContacts() {
	const requiredContacts = getBoardDemoContacts();
	const nextContacts = Array.isArray(boardState.contacts) ? boardState.contacts.slice() : [];
	let hasChanges = false;
	for (let index = 0; index < requiredContacts.length; index++) {
		const demoContact = requiredContacts[index];
		const existingContact = nextContacts.find((contact) => boardNormalizeText(contact.name) === boardNormalizeText(demoContact.name));
		if (existingContact) continue;
		nextContacts.push({ ...demoContact });
		hasChanges = true;
	}
	if (hasChanges && typeof saveContacts === "function") await saveContacts(nextContacts);
	return nextContacts;
}
// #endregion

// #region Normalize
/**
 * Normalizes a list of tasks into board task format.
 * @param {Array} tasks
 */
function boardNormalizeTaskList(tasks) {
	const list = Array.isArray(tasks) ? tasks : [];
	return list.map((task) => boardNormalizeTask(task)).filter((task) => task && task.id);
}

/**
 * Normalizes one task object.
 * @param {Object} task
 */
function boardNormalizeTask(task) {
	if (!task || typeof task !== "object") return null;
	const normalizedTaskText = getBoardNormalizedTaskTextFields(task);
	const normalizedTaskMeta = getBoardNormalizedTaskMetaFields(task);
	return { ...normalizedTaskText, ...normalizedTaskMeta };
}

/**
 * Builds normalized task text fields.
 * @param {Object} task
 */
function getBoardNormalizedTaskTextFields(task) {
	return {
		id: String(task.id || boardCreateTaskId()),
		title: String(task.title || "").trim(),
		description: String(task.description || "").trim(),
		dueDate: String(task.dueDate || "").trim(),
	};
}

/**
 * Builds normalized task meta fields.
 * @param {Object} task
 */
function getBoardNormalizedTaskMetaFields(task) {
	return {
		priority: boardNormalizePriority(task.priority),
		category: String(task.category || "").trim() || "Technical Task",
		teamMembers: boardGetTaskTeamMemberIds(task),
		subtasks: boardNormalizeSubtasks(task.subtasks),
		status: boardNormalizeStatus(task.status),
		createdAt: Number(task.createdAt || Date.now()),
	};
}

/**
 * Normalizes subtask list.
 * @param {Array} subtasks
 */
function boardNormalizeSubtasks(subtasks) {
	const list = Array.isArray(subtasks) ? subtasks : [];
	return list.map((subtask, index) => boardNormalizeSubtask(subtask, index));
}

/**
 * Normalizes one subtask object.
 * @param {Object|string} subtask
 * @param {number} index
 */
function boardNormalizeSubtask(subtask, index) {
	const baseId = `s_${index}_${Date.now().toString(36)}`;
	if (typeof subtask === "string") return { id: baseId, text: subtask, done: false };
	if (!subtask || typeof subtask !== "object") return { id: baseId, text: "", done: false };
	return {
		id: String(subtask.id || baseId),
		text: String(subtask.text || ""),
		done: !!subtask.done,
	};
}

/**
 * Normalizes board status value.
 * @param {string} status
 */
function boardNormalizeStatus(status) {
	const value = boardNormalizeText(status);
	if (value === "in progress" || value === "in-progress") return "in-progress";
	if (value === "await feedback" || value === "await-feedback") return "await-feedback";
	if (value === "done") return "done";
	return "todo";
}

/**
 * Normalizes board priority value.
 * @param {string} priority
 */
function boardNormalizePriority(priority) {
	const value = boardNormalizeText(priority);
	if (value === "urgent") return "urgent";
	if (value === "low") return "low";
	return "medium";
}
// #endregion

// #region Lookup
/**
 * Finds one task by id.
 * @param {string} taskId
 */
function findBoardTaskById(taskId) {
	if (!taskId) return null;
	for (let index = 0; index < boardState.tasks.length; index++) {
		if (boardState.tasks[index].id === taskId) return boardState.tasks[index];
	}
	return null;
}

/**
 * Finds one contact by id.
 * @param {string} contactId
 */
function findBoardContactById(contactId) {
	if (!contactId) return null;
	for (let index = 0; index < boardState.contacts.length; index++) {
		if (boardState.contacts[index].id === contactId) return boardState.contacts[index];
	}
	return null;
}

/**
 * Finds contact id by contact name.
 * @param {Array} contacts
 * @param {string} name
 */
function getBoardContactIdByName(contacts, name) {
	const normalizedName = boardNormalizeText(name);
	for (let index = 0; index < contacts.length; index++) {
		if (boardNormalizeText(contacts[index].name) === normalizedName) return contacts[index].id;
	}
	return "";
}

/**
 * Gets team member id list from task shape.
 * @param {Object} task
 */
function boardGetTaskTeamMemberIds(task) {
	if (Array.isArray(task.teamMembers)) return task.teamMembers;
	if (Array.isArray(task.assignees)) return task.assignees;
	return [];
}
// #endregion

// #region Helpers
/**
 * Escapes html-sensitive characters.
 * @param {string} value
 */
function boardEscapeHtml(value) {
	return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Returns initials from full name.
 * @param {string} name
 */
function boardGetInitials(name) {
	const parts = String(name || "").trim().split(" ").filter(Boolean);
	if (!parts.length) return "";
	const first = parts[0][0]?.toUpperCase() || "";
	const second = parts[1]?.[0]?.toUpperCase() || "";
	return (first + second).slice(0, 2);
}

/**
 * Normalizes text for case-insensitive compare.
 * @param {string} value
 */
function boardNormalizeText(value) {
	return String(value || "").trim().toLowerCase();
}

/**
 * Formats date value for display.
 * @param {string} value
 */
function boardFormatDateForDisplay(value) {
	const text = String(value || "").trim();
	if (!text) return "—";
	if (text.includes("/")) return text;
	const parts = text.split("-");
	if (parts.length !== 3) return text;
	return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats date value for date input.
 * @param {string} value
 */
function boardFormatDateForInput(value) {
	const text = String(value || "").trim();
	if (!text) return "";
	if (text.includes("-")) return text;
	if (!text.includes("/")) return "";
	const parts = text.split("/");
	if (parts.length !== 3) return "";
	return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Returns category css class for badge.
 * @param {string} category
 */
function boardGetCategoryClassName(category) {
	const key = boardNormalizeText(category);
	return boardState.categoryClasses[key] || "board-card-category-technical-task";
}

/**
 * Returns subtask progress metrics.
 * @param {Array} subtasks
 */
function boardGetSubtaskProgress(subtasks) {
	const list = Array.isArray(subtasks) ? subtasks : [];
	const total = list.length;
	if (!total) return { done: 0, total: 0, percent: 0 };
	let done = 0;
	for (let index = 0; index < list.length; index++) {
		if (list[index] && list[index].done) done++;
	}
	return { done, total, percent: Math.round((done / total) * 100) };
}

/**
 * Creates a task id.
 */
function boardCreateTaskId() {
	return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Shows or hides element by id.
 * @param {string} elementId
 * @param {boolean} shouldShow
 */
function setBoardElementVisible(elementId, shouldShow) {
	const element = document.getElementById(elementId);
	if (!element) return;
	element.classList.toggle("hidden", !shouldShow);
}
// #endregion
