// #region Init
/**
 * Initializes board page.
 */
async function initBoardPage() {
	if (typeof initProtectedPageAuth === "function") initProtectedPageAuth();
	await loadBoardData();
	bindBoardGlobalEvents();
	renderBoardColumns();
}

/**
 * Binds board-level events once.
 */
function bindBoardGlobalEvents() {
	if (boardState.hasDocumentClickBinding) return;
	document.addEventListener("click", (event) => handleBoardDocumentClick(event));
	boardState.hasDocumentClickBinding = true;
}
// #endregion

// #region Render columns
/**
 * Renders all board columns.
 */
function renderBoardColumns() {
	for (let index = 0; index < boardState.statusOrder.length; index++) {
		renderBoardColumn(boardState.statusOrder[index]);
	}
}

/**
 * Renders one board column.
 * @param {string} status
 */
function renderBoardColumn(status) {
	const columnElement = document.getElementById(boardState.columnIds[status]);
	if (!columnElement) return;
	const visibleTasks = getBoardVisibleTasksByStatus(status);
	if (!visibleTasks.length) {
		const emptyStateViewModel = { text: getBoardEmptyStateText(status) };
		columnElement.innerHTML = getBoardEmptyStateTemplate(emptyStateViewModel);
		return;
	}
	const cardsHtml = visibleTasks.map((task) => getBoardTaskCardTemplate(buildBoardTaskCardViewModel(task))).join("");
	columnElement.innerHTML = cardsHtml;
}

/**
 * Returns visible tasks by status and search value.
 * @param {string} status
 */
function getBoardVisibleTasksByStatus(status) {
	const normalizedStatus = boardNormalizeStatus(status);
	const searchValue = boardNormalizeText(boardState.searchValue);
	return boardState.tasks.filter((task) => {
		if (boardNormalizeStatus(task.status) !== normalizedStatus) return false;
		if (!searchValue) return true;
		return doesBoardTaskMatchSearch(task, searchValue);
	});
}

/**
 * Checks whether task matches search text.
 * @param {Object} task
 * @param {string} searchValue
 */
function doesBoardTaskMatchSearch(task, searchValue) {
	const title = boardNormalizeText(task.title);
	const description = boardNormalizeText(task.description);
	return title.includes(searchValue) || description.includes(searchValue);
}

/**
 * Builds view model for board task card template.
 * @param {Object} task
 */
function buildBoardTaskCardViewModel(task) {
	const boardCardText = getBoardTaskCardText(task);
	const boardCardMeta = getBoardTaskCardMeta(task);
	return { id: task.id, ...boardCardText, ...boardCardMeta };
}

/**
 * Builds card title/description/category fields.
 * @param {Object} task
 */
function getBoardTaskCardText(task) {
	return {
		categoryClass: boardGetCategoryClassName(task.category),
		categoryLabel: boardEscapeHtml(task.category || "Task"),
		title: boardEscapeHtml(task.title || "Untitled task"),
		description: boardEscapeHtml(task.description || ""),
	};
}

/**
 * Builds card progress/avatar/priority fields.
 * @param {Object} task
 */
function getBoardTaskCardMeta(task) {
	const progress = boardGetSubtaskProgress(task.subtasks);
	const priorityIcon = boardState.priorityIcons[task.priority] || boardState.priorityIcons.medium;
	return {
		progressHtml: buildBoardCardProgressHtml(progress),
		avatarsHtml: buildBoardTeamMembersHtml(task),
		priorityIcon,
		priorityAlt: boardEscapeHtml(task.priority || "medium") + " priority",
	};
}

/**
 * Builds progress section html.
 * @param {{done:number,total:number,percent:number}} progress
 */
function buildBoardCardProgressHtml(progress) {
	if (!progress.total) return "";
	return getBoardCardProgressTemplate(progress);
}

/**
 * Builds team-member badges html for one task.
 * @param {Object} task
 */
function buildBoardTeamMembersHtml(task) {
	const teamMemberIds = boardGetTaskTeamMemberIds(task);
	const maxVisibleMembers = 4;
	const badgeHtml = buildBoardVisibleTeamMemberBadges(teamMemberIds, maxVisibleMembers);
	const overflowHtml = buildBoardTeamMemberOverflow(teamMemberIds.length, maxVisibleMembers);
	return badgeHtml + overflowHtml;
}

/**
 * Builds visible team-member badges.
 * @param {Array} teamMemberIds
 * @param {number} maxVisibleMembers
 */
function buildBoardVisibleTeamMemberBadges(teamMemberIds, maxVisibleMembers) {
	const visibleIds = teamMemberIds.slice(0, maxVisibleMembers);
	return visibleIds.map((memberId) => getBoardTeamMemberBadgeHtml(memberId)).join("");
}

/**
 * Builds one team-member badge html by contact id.
 * @param {string} memberId
 */
function getBoardTeamMemberBadgeHtml(memberId) {
	const contact = findBoardContactById(memberId);
	if (!contact) return "";
	const badgeViewModel = { color: contact.color || "#29ABE2", initials: boardEscapeHtml(boardGetInitials(contact.name)) };
	return getBoardTeamMemberBadgeTemplate(badgeViewModel);
}

/**
 * Builds overflow badge html.
 * @param {number} totalMembers
 * @param {number} maxVisibleMembers
 */
function buildBoardTeamMemberOverflow(totalMembers, maxVisibleMembers) {
	const overflowCount = totalMembers - maxVisibleMembers;
	if (overflowCount <= 0) return "";
	return getBoardTeamMemberOverflowTemplate({ count: overflowCount });
}

/**
 * Returns empty-state label for one status.
 * @param {string} status
 */
function getBoardEmptyStateText(status) {
	if (status === "done") return "No tasks Done";
	if (status === "in-progress") return "No tasks In progress";
	if (status === "await-feedback") return "No tasks Await feedback";
	return "No tasks To do";
}
// #endregion

// #region Search and drag drop
/**
 * Handles search input changes.
 */
function handleBoardSearchInput(value, source) {
	const desktopInput = document.getElementById("boardSearchInputDesktop");
	const mobileInput = document.getElementById("boardSearchInputMobile");
	const inputValue = typeof value === "string"
		? value
		: (desktopInput && desktopInput.value) || (mobileInput && mobileInput.value) || "";
	boardState.searchValue = inputValue;
	if (source !== "desktop" && desktopInput && desktopInput.value !== inputValue) desktopInput.value = inputValue;
	if (source !== "mobile" && mobileInput && mobileInput.value !== inputValue) mobileInput.value = inputValue;
	renderBoardColumns();
}

/**
 * Handles document clicks while add-task overlay is open.
 * @param {MouseEvent} event
 */
function handleBoardDocumentClick(event) {
	const addTaskOverlay = document.getElementById("boardAddTaskOverlay");
	if (!addTaskOverlay || addTaskOverlay.classList.contains("hidden")) return;
	if (typeof handlePageClick === "function") handlePageClick(event);
}

/**
 * Enables drop area behavior.
 * @param {DragEvent} event
 */
function allowTaskDrop(event) {
	event.preventDefault();
}

/**
 * Starts dragging one task card.
 * @param {DragEvent} event
 * @param {string} taskId
 */
function startTaskDrag(event, taskId) {
	event.stopPropagation();
	boardState.dragTaskId = taskId;
	event.dataTransfer.setData("text/plain", taskId);
	event.dataTransfer.effectAllowed = "move";
}

/**
 * Drops dragged task into a new column status.
 * @param {DragEvent} event
 * @param {string} nextStatus
 */
async function dropTaskToStatus(event, nextStatus) {
	event.preventDefault();
	const taskId = event.dataTransfer.getData("text/plain") || boardState.dragTaskId;
	if (!taskId) return;
	const task = findBoardTaskById(taskId);
	if (!task) return;
	task.status = boardNormalizeStatus(nextStatus);
	await persistBoardTasks();
	renderBoardColumns();
	boardState.dragTaskId = "";
}
// #endregion
