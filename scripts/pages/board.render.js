// #region Init
/**
 * Initializes board page.
 */
async function initBoardPage() {
	if (typeof initProtectedPageAuth === "function") initProtectedPageAuth();
	await loadBoardData();
	bindBoardGlobalEvents();
	renderBoardColumns();
	showBoardToastFromAddTaskRedirect();
}

/**
 * Shows board toast once after redirect from add-task page.
 */
function showBoardToastFromAddTaskRedirect() {
	if (sessionStorage.getItem("joinShowBoardTaskToast") !== "1") return;
	sessionStorage.removeItem("joinShowBoardTaskToast");
	if (typeof showBoardTaskToast === "function") showBoardTaskToast();
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
	return {
		id: task.id,
		draggableValue: "true",
		moveMenuHtml: buildBoardTaskMoveMenuHtml(task),
		...boardCardText,
		...boardCardMeta,
	};
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
	const maxVisibleMembers = typeof getAssigneeBadgeVisibleLimit === "function" ? getAssigneeBadgeVisibleLimit() : 4;
	const badgeHtml = buildBoardVisibleTeamMemberBadges(teamMemberIds, maxVisibleMembers);
	const overflowHtml = buildBoardTeamMemberOverflow(teamMemberIds, maxVisibleMembers);
	return badgeHtml + overflowHtml;
}

/**
 * Builds visible team-member badges.
 * @param {Array} teamMemberIds
 * @param {number} maxVisibleMembers
 */
function buildBoardVisibleTeamMemberBadges(teamMemberIds, maxVisibleMembers) {
	const visibleIds = typeof getVisibleAssigneeIds === "function"
		? getVisibleAssigneeIds(teamMemberIds, maxVisibleMembers)
		: teamMemberIds.slice(0, maxVisibleMembers);
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
 * @param {Array} teamMemberIds
 * @param {number} maxVisibleMembers
 */
function buildBoardTeamMemberOverflow(teamMemberIds, maxVisibleMembers) {
	const overflowCount = typeof getAssigneeOverflowCount === "function"
		? getAssigneeOverflowCount(teamMemberIds, maxVisibleMembers)
		: teamMemberIds.length - maxVisibleMembers;
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