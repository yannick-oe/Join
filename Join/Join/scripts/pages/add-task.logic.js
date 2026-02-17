// #region State
const addTaskState = {
	contacts: [],
	tasks: [],
	selectedContactIds: [],
	selectedCategory: "",
	priority: "medium",
	categories: ["Technical Tasks", "User Story"],
	subtasks: [],
	subtaskEditId: null,
	palette: ["#9327FF", "#FF7A00", "#6E52FF", "#FC71FF", "#FFBB2B", "#1FD7C1", "#0038FF", "#C3FF2B"],
};
// #endregion

// #region Init
/**
 * Initializes Add Task page data and UI.
 */
async function initAddTaskPage() {
	addTaskState.contacts = await loadContactsSafe();
	addTaskState.tasks = await loadTasksSafe();
	setMinDateToToday();
	applyPriorityButtons();
	renderTeamMemberDropdown();
	renderCategoryDropdown();
	renderTeamMemberBadges();
	renderSubtasks();
}

/**
 * Loads contacts and falls back to demo data.
 */
async function loadContactsSafe() {
	const contacts = typeof loadContacts === "function" ? await loadContacts() : [];
	if (contacts && contacts.length) return contacts;
	return getDemoContacts();
}

/**
 * Loads tasks from storage adapters.
 */
async function loadTasksSafe() {
	if (typeof loadTasks === "function") return await loadTasks();
	return JSON.parse(localStorage.getItem("joinTasks") || "[]");
}

/**
 * Sets today's date as minimum due date.
 */
function setMinDateToToday() {
	const dateInput = document.getElementById("taskDate");
	if (!dateInput) return;
	const today = new Date().toISOString().split("T")[0];
	dateInput.min = today;
}
// #endregion

// #region Priority
/**
 * Sets selected task priority.
 * @param {string} priority
 */
function setPriority(priority) {
	addTaskState.priority = priority;
	applyPriorityButtons();
}

/**
 * Applies selected styles to priority buttons.
 */
function applyPriorityButtons() {
	setPriorityButtonState("priorityUrgent", addTaskState.priority === "urgent");
	setPriorityButtonState("priorityMedium", addTaskState.priority === "medium");
	setPriorityButtonState("priorityLow", addTaskState.priority === "low");
}

/**
 * Toggles selected class for one priority button.
 * @param {string} elementId
 * @param {boolean} isSelected
 */
function setPriorityButtonState(elementId, isSelected) {
	const element = document.getElementById(elementId);
	if (!element) return;
	element.classList.toggle("is-selected", isSelected);
}
// #endregion

// #region Team members
/**
 * Toggles selected state for one contact.
 * @param {string} contactId
 */
function toggleTeamMember(contactId) {
	const selected = addTaskState.selectedContactIds;
	const exists = selected.includes(contactId);
	addTaskState.selectedContactIds = exists ? selected.filter((id) => id !== contactId) : [...selected, contactId];
	renderTeamMemberDropdown();
	renderTeamMemberBadges();
}
// #endregion

// #region Category
/**
 * Sets active category and closes dropdown.
 * @param {string} category
 */
function selectCategory(category) {
	addTaskState.selectedCategory = category;
	const toggle = document.getElementById("categoryToggle");
	if (toggle) toggle.innerText = category;
	syncCategoryRequiredStar(!!category);
	setFieldInvalid("categoryToggle", "taskCategoryError", false);
	closeCategoryDropdown();
}
// #endregion

// #region Subtasks
/**
 * Saves a new subtask from input field.
 */
function saveSubtaskDraft() {
	const text = getInputValue("subtaskInput").trim();
	if (!text) return;
	addTaskState.subtasks.push({ id: createId("s"), text });
	setInputValue("subtaskInput", "");
	cancelSubtaskEdit();
	renderSubtasks();
}

/**
 * Clears temporary subtask input controls.
 */
function cancelSubtaskEdit() {
	const shell = document.querySelector(".subtask-input-shell");
	setInputValue("subtaskInput", "");
	if (shell) shell.classList.remove("is-active");
	setElementVisible("subtaskActions", false);
}

/**
 * Switches one subtask row to edit mode.
 * @param {string} subtaskId
 */
function startSubtaskEdit(subtaskId) {
	addTaskState.subtaskEditId = subtaskId;
	renderSubtasks();
}

/**
 * Saves edited subtask text.
 * @param {string} subtaskId
 */
function saveSubtaskEdit(subtaskId) {
	const value = getInputValue("subtaskEditInput").trim();
	if (!value) return;
	addTaskState.subtasks = addTaskState.subtasks.map((item) => item.id === subtaskId ? { ...item, text: value } : item);
	addTaskState.subtaskEditId = null;
	renderSubtasks();
}

/**
 * Handles keyboard save while editing a subtask.
 * @param {KeyboardEvent} event
 * @param {string} subtaskId
 */
function handleSubtaskEditKey(event, subtaskId) {
	if (event.key !== "Enter") return;
	event.preventDefault();
	saveSubtaskEdit(subtaskId);
}

/**
 * Removes one subtask entry.
 * @param {string} subtaskId
 */
function removeSubtask(subtaskId) {
	addTaskState.subtasks = addTaskState.subtasks.filter((item) => item.id !== subtaskId);
	if (addTaskState.subtaskEditId === subtaskId) addTaskState.subtaskEditId = null;
	renderSubtasks();
}
// #endregion

// #region Submit and reset
/**
 * Validates and submits the add task form.
 * @param {Event} event
 */
async function submitTaskForm(event) {
	event.preventDefault();
	if (!validateTaskForm()) return;
	setSubmitButtonDisabled(true);
	addTaskState.tasks.push(buildTaskPayload());
	await persistTasks();
	clearTaskForm();
	showTaskSuccessToast();
	setSubmitButtonDisabled(false);
}

/**
 * Validates required form fields.
 */
function validateTaskForm() {
	const title = getInputValue("taskTitle").trim();
	const date = getInputValue("taskDate").trim();
	const category = addTaskState.selectedCategory.trim();
	const dateState = getDateValidationState(date);
	setFieldInvalid("taskTitle", "taskTitleError", !title);
	setFieldInvalid("taskDate", "taskDateError", dateState !== "ok");
	setFieldInvalid("categoryToggle", "taskCategoryError", !category);
	setDateErrorMessage(dateState);
	return !!(title && dateState === "ok" && category);
}

/**
 * Builds one task object from form values.
 */
function buildTaskPayload() {
	const teamMembers = addTaskState.selectedContactIds.slice();
	const subtasks = addTaskState.subtasks.map((item) => ({ ...item, done: false }));
	return { id: createId("t"), title: getInputValue("taskTitle").trim(), description: getInputValue("taskDescription").trim(), dueDate: getInputValue("taskDate"), priority: addTaskState.priority, category: addTaskState.selectedCategory, teamMembers, subtasks, status: "todo", createdAt: Date.now() };
}

/**
 * Persists tasks through storage adapter.
 */
async function persistTasks() {
	if (typeof saveTasks === "function") {
		await saveTasks(addTaskState.tasks);
		return;
	}
	localStorage.setItem("joinTasks", JSON.stringify(addTaskState.tasks));
}

/**
 * Clears form values and returns to defaults.
 */
function clearTaskForm() {
	resetBasicInputs();
	resetStateValues();
	resetValidation();
	applyPriorityButtons();
	renderTeamMemberDropdown();
	renderTeamMemberBadges();
	renderSubtasks();
}

/**
 * Clears basic input elements.
 */
function resetBasicInputs() {
	setInputValue("taskTitle", "");
	setInputValue("taskDescription", "");
	setInputValue("taskDate", "");
	setInputValue("subtaskInput", "");
	syncTitleRequiredStar(false);
	syncDateRequiredStar(false);
	syncCategoryRequiredStar(false);
	const category = document.getElementById("categoryToggle");
	if (category) category.innerText = "Select task category";
}

/**
 * Resolves due-date validation state.
 * @param {string} dateValue
 */
function getDateValidationState(dateValue) {
	if (!dateValue) return "required";
	if (isDateInPast(dateValue)) return "past";
	return "ok";
}

/**
 * Checks whether a due date is in the past.
 * @param {string} dateValue
 */
function isDateInPast(dateValue) {
	const selected = new Date(dateValue);
	selected.setHours(0, 0, 0, 0);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return selected.getTime() < today.getTime();
}

/**
 * Resets in-memory add task state values.
 */
function resetStateValues() {
	addTaskState.selectedContactIds = [];
	addTaskState.selectedCategory = "";
	addTaskState.priority = "medium";
	addTaskState.subtasks = [];
	addTaskState.subtaskEditId = null;
	cancelSubtaskEdit();
}
// #endregion

// #region Helpers
/**
 * Builds initials from a full name.
 * @param {string} name
 */
function getInitials(name) {
	const parts = String(name || "").trim().split(" ").filter(Boolean);
	if (!parts.length) return "";
	const first = parts[0][0]?.toUpperCase() || "";
	const second = parts[1]?.[0]?.toUpperCase() || "";
	return (first + second).slice(0, 2);
}

/**
 * Escapes html-sensitive text.
 * @param {string} value
 */
function escapeHtml(value) {
	return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Creates unique ids with a prefix.
 * @param {string} prefix
 */
function createId(prefix) {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Provides fallback contacts for empty storage.
 */
function getDemoContacts() {
	return [
		{ id: "c_demo_1", name: "Sofia Müller", color: "#29ABE2" },
		{ id: "c_demo_2", name: "Anton Mayer", color: "#FF7A00" },
		{ id: "c_demo_3", name: "Anja Schulz", color: "#9327FF" },
		{ id: "c_demo_4", name: "Benedikt Ziegler", color: "#6E52FF" },
		{ id: "c_demo_5", name: "David Eisenberg", color: "#FC71FF" },
	];
}
// #endregion
