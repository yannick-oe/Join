// #region Team members
/**
 * Opens or closes the team member dropdown.
 */
function toggleTeamMemberDropdown() {
	const panel = document.getElementById("teamMemberDropdown");
	if (!panel) return;
	const shouldShow = panel.classList.contains("hidden");
	closeCategoryDropdown();
	setDropdownVisible("teamMemberDropdown", "teamMemberToggle", shouldShow);
}

/**
 * Renders team member dropdown entries.
 */
function renderTeamMemberDropdown() {
	const panel = document.getElementById("teamMemberDropdown");
	if (!panel) return;
	panel.innerHTML = addTaskState.contacts.map((contact, i) => getTeamMemberItemTemplate(contact, i)).join("");
}

/**
 * Builds one team member dropdown row.
 * @param {{id:string,name:string,color?:string}} contact
 * @param {number} index
 */
function getTeamMemberItemTemplate(contact, index) {
	const checked = addTaskState.selectedContactIds.includes(contact.id) ? "checked" : "";
	const color = contact.color || addTaskState.palette[index % addTaskState.palette.length];
	const initials = getInitials(contact.name);
	return `<div class="dropdown-item" onclick="toggleTeamMember('${contact.id}')"><label><span class="team-member-avatar" style="background:${color}">${initials}</span>${contact.name}</label><input type="checkbox" ${checked} onclick="event.stopPropagation()" onchange="toggleTeamMember('${contact.id}')"></div>`;
}

/**
 * Renders selected team member badges below dropdown.
 */
function renderTeamMemberBadges() {
	const shell = document.getElementById("teamMemberBadges");
	if (!shell) return;
	shell.innerHTML = addTaskState.selectedContactIds.map((id) => getTeamMemberBadgeTemplate(id)).join("");
}

/**
 * Builds one selected team member badge.
 * @param {string} contactId
 */
function getTeamMemberBadgeTemplate(contactId) {
	const contact = addTaskState.contacts.find((item) => item.id === contactId);
	if (!contact) return "";
	const color = contact.color || addTaskState.palette[0];
	return `<span class="badge-avatar" style="background:${color}">${getInitials(contact.name)}</span>`;
}
// #endregion

// #region Category
/**
 * Opens or closes category dropdown.
 */
function toggleCategoryDropdown() {
	const panel = document.getElementById("categoryDropdown");
	if (!panel) return;
	const shouldShow = panel.classList.contains("hidden");
	setDropdownVisible("teamMemberDropdown", "teamMemberToggle", false);
	setDropdownVisible("categoryDropdown", "categoryToggle", shouldShow);
}

/**
 * Renders category dropdown options.
 */
function renderCategoryDropdown() {
	const panel = document.getElementById("categoryDropdown");
	if (!panel) return;
	panel.innerHTML = addTaskState.categories.map((item) => getCategoryItemTemplate(item)).join("");
}

/**
 * Builds one category option template.
 * @param {string} category
 */
function getCategoryItemTemplate(category) {
	return `<div class="dropdown-item" onclick="selectCategory('${category}')">${category}</div>`;
}
// #endregion

// #region Subtasks
/**
 * Handles subtask input state.
 */
function handleSubtaskInput() {
	const value = getInputValue("subtaskInput").trim();
	const shell = document.querySelector(".subtask-input-shell");
	setElementVisible("subtaskActions", !!value);
	if (shell) shell.classList.toggle("is-active", !!value);
}

/**
 * Renders all saved subtasks.
 */
function renderSubtasks() {
	const list = document.getElementById("subtaskList");
	if (!list) return;
	list.innerHTML = addTaskState.subtasks.map((item) => getSubtaskTemplate(item)).join("");
}

/**
 * Builds one subtask row template.
 * @param {{id:string,text:string}} subtask
 */
function getSubtaskTemplate(subtask) {
	if (addTaskState.subtaskEditId === subtask.id) return getEditableSubtaskTemplate(subtask);
	return `<div class="subtask-row"><div class="subtask-row-left">• <span>${escapeHtml(subtask.text)}</span></div><div class="subtask-row-actions"><button class="subtask-action" type="button" onclick="startSubtaskEdit('${subtask.id}')">✎</button><button class="subtask-action" type="button" onclick="removeSubtask('${subtask.id}')">🗑</button></div></div>`;
}

/**
 * Builds one editable subtask row.
 * @param {{id:string,text:string}} subtask
 */
function getEditableSubtaskTemplate(subtask) {
	return `<div class="subtask-row"><input id="subtaskEditInput" class="subtask-edit-input" value="${escapeHtml(subtask.text)}" onkeydown="handleSubtaskEditKey(event, '${subtask.id}')"><div class="subtask-row-actions"><button class="subtask-action" type="button" onclick="removeSubtask('${subtask.id}')">🗑</button><button class="subtask-action" type="button" onclick="saveSubtaskEdit('${subtask.id}')">✓</button></div></div>`;
}
// #endregion

// #region Inputs and dropdown shell
/**
 * Handles title input validation reset.
 */
function handleTitleInput() {
	const hasTitle = !!getInputValue("taskTitle").trim();
	syncTitleRequiredStar(hasTitle);
	if (!hasTitle) return;
	setFieldInvalid("taskTitle", "taskTitleError", false);
}

/**
 * Handles date input validation reset.
 */
function handleDateInput() {
	const dateValue = getInputValue("taskDate").trim();
	syncDateRequiredStar(!!dateValue);
	if (!dateValue) return setDateValidationState("required");
	if (isDateInPast(dateValue)) return setDateValidationState("past");
	setDateValidationState("ok");
}

/**
 * Applies date field validation state to UI.
 * @param {string} mode
 */
function setDateValidationState(mode) {
	setFieldInvalid("taskDate", "taskDateError", mode !== "ok");
	setDateErrorMessage(mode === "ok" ? "required" : mode);
}

/**
 * Handles Enter key in subtask field.
 * @param {KeyboardEvent} event
 */
function handleSubtaskInputKeydown(event) {
	if (event.key !== "Enter") return;
	event.preventDefault();
	saveSubtaskDraft();
}

/**
 * Handles global click for dropdown closing.
 * @param {MouseEvent} event
 */
function handlePageClick(event) {
	const teamMemberShell = event.target.closest("#teamMemberDropdownShell");
	const categoryShell = event.target.closest("#categoryDropdown");
	const categoryToggle = event.target.closest("#categoryToggle");
	if (!teamMemberShell) setDropdownVisible("teamMemberDropdown", "teamMemberToggle", false);
	if (!categoryShell && !categoryToggle) closeCategoryDropdown();
}

/**
 * Closes category dropdown UI.
 */
function closeCategoryDropdown() {
	setDropdownVisible("categoryDropdown", "categoryToggle", false);
}

/**
 * Sets dropdown panel visibility.
 * @param {string} panelId
 * @param {string} toggleId
 * @param {boolean} shouldShow
 */
function setDropdownVisible(panelId, toggleId, shouldShow) {
	const panel = document.getElementById(panelId);
	const toggle = document.getElementById(toggleId);
	if (!panel || !toggle) return;
	panel.classList.toggle("hidden", !shouldShow);
	toggle.classList.toggle("is-open", shouldShow);
}
// #endregion

// #region Helpers
/**
 * Sets invalid style and error visibility.
 * @param {string} inputId
 * @param {string} errorId
 * @param {boolean} isInvalid
 */
function setFieldInvalid(inputId, errorId, isInvalid) {
	const input = document.getElementById(inputId);
	if (input) input.classList.toggle("is-invalid", isInvalid);
	setElementVisible(errorId, isInvalid);
}

/**
 * Resets visible error markers.
 */
function resetValidation() {
	setFieldInvalid("taskTitle", "taskTitleError", false);
	setFieldInvalid("taskDate", "taskDateError", false);
	setFieldInvalid("categoryToggle", "taskCategoryError", false);
	setDateErrorMessage("required");
}

/**
 * Shows or hides one element.
 * @param {string} elementId
 * @param {boolean} shouldShow
 */
function setElementVisible(elementId, shouldShow) {
	const element = document.getElementById(elementId);
	if (!element) return;
	element.classList.toggle("hidden", !shouldShow);
}

/**
 * Reads value from one input element.
 * @param {string} elementId
 */
function getInputValue(elementId) {
	const element = document.getElementById(elementId);
	return element ? element.value : "";
}

/**
 * Writes value into one input element.
 * @param {string} elementId
 * @param {string} value
 */
function setInputValue(elementId, value) {
	const element = document.getElementById(elementId);
	if (element) element.value = value;
}

/**
 * Enables or disables the submit button.
 * @param {boolean} isDisabled
 */
function setSubmitButtonDisabled(isDisabled) {
	const button = document.querySelector(".task-create-button");
	if (!button) return;
	button.disabled = isDisabled;
}

/**
 * Shows task success toast notification.
 */
function showTaskSuccessToast() {
	setElementVisible("taskSuccessToast", true);
	setTimeout(() => hideTaskSuccessToast(), 2500);
}

/**
 * Hides task success toast notification.
 */
function hideTaskSuccessToast() {
	setElementVisible("taskSuccessToast", false);
}

/**
 * Updates the title required-star color state.
 * @param {boolean} hasTitle
 */
function syncTitleRequiredStar(hasTitle) {
	const star = document.getElementById("taskTitleRequiredStar");
	if (!star) return;
	star.classList.toggle("is-filled", hasTitle);
}

/**
 * Updates the date required-star color state.
 * @param {boolean} hasDate
 */
function syncDateRequiredStar(hasDate) {
	const star = document.getElementById("taskDateRequiredStar");
	if (!star) return;
	star.classList.toggle("is-filled", hasDate);
}

/**
 * Updates the category required-star color state.
 * @param {boolean} hasCategory
 */
function syncCategoryRequiredStar(hasCategory) {
	const star = document.getElementById("taskCategoryRequiredStar");
	if (!star) return;
	star.classList.toggle("is-filled", hasCategory);
}

/**
 * Sets the due-date error message by state.
 * @param {string} mode
 */
function setDateErrorMessage(mode) {
	const error = document.getElementById("taskDateError");
	if (!error) return;
	error.innerText = mode === "past" ? "Date must be today or in the future" : "This field is required";
}
// #endregion
