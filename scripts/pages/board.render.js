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
 * Starts dragging one task card.
 * @param {DragEvent} event
 * @param {string} taskId
 */
function startTaskDrag(event, taskId) {
	event.stopPropagation();
	boardState.dragTaskId = taskId;
	event.dataTransfer.setData("text/plain", taskId);
	event.dataTransfer.effectAllowed = "move";
	const taskCard = event.currentTarget?.closest(".board-task-card") || event.target?.closest(".board-task-card");
	if (taskCard) taskCard.classList.add("is-dragging-origin");
}

/**
 * Handles dragover to show drop preview index in one status column.
 * @param {DragEvent} event
 * @param {string} status
 */
function allowTaskDrop(event, status) {
	event.preventDefault();
	if (!boardState.dragTaskId) return;
	const normalizedStatus = boardNormalizeStatus(status);
	const dropZone = document.getElementById(boardState.columnIds[normalizedStatus]);
	if (!dropZone) return;
	boardState.dragOverStatus = normalizedStatus;
	const visibleCards = getBoardDropTargetCards(dropZone);
	const previewIndex = getBoardDropPreviewIndex(event, visibleCards);
	boardState.dragPreviewIndex = previewIndex;
	renderBoardDropPreview(dropZone, visibleCards, previewIndex);
}

/**
 * Ends task drag interaction and resets preview state.
 */
function endTaskDrag() {
	clearBoardDropPreviewState();
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
	const normalizedStatus = boardNormalizeStatus(nextStatus);
	const targetIndex = boardState.dragOverStatus === normalizedStatus && boardState.dragPreviewIndex >= 0
		? boardState.dragPreviewIndex
		: getBoardStatusTaskCount(normalizedStatus);
	moveBoardTaskToStatusIndex(taskId, normalizedStatus, targetIndex);
	await persistBoardTasks();
	clearBoardDropPreviewState();
	renderBoardColumns();
}

/**
 * Moves one task to status and insertion index within that status list.
 * @param {string} taskId
 * @param {string} nextStatus
 * @param {number} targetIndex
 */
function moveBoardTaskToStatusIndex(taskId, nextStatus, targetIndex) {
	const tasks = Array.isArray(boardState.tasks) ? boardState.tasks.slice() : [];
	const currentIndex = tasks.findIndex((task) => task && task.id === taskId);
	if (currentIndex < 0) return;
	const [task] = tasks.splice(currentIndex, 1);
	task.status = nextStatus;
	const clampedTargetIndex = Math.max(0, Math.min(Number(targetIndex) || 0, getBoardStatusTaskCountFromList(tasks, nextStatus)));
	const insertIndex = getBoardInsertArrayIndexByStatus(tasks, nextStatus, clampedTargetIndex);
	tasks.splice(insertIndex, 0, task);
	boardState.tasks = tasks;
}

/**
 * Returns insertion index in full task array for one status-local index.
 * @param {Array} tasks
 * @param {string} status
 * @param {number} targetIndex
 */
function getBoardInsertArrayIndexByStatus(tasks, status, targetIndex) {
	let statusCount = 0;
	for (let index = 0; index < tasks.length; index++) {
		if (boardNormalizeStatus(tasks[index]?.status) !== status) continue;
		if (statusCount === targetIndex) return index;
		statusCount++;
	}
	return tasks.length;
}

/**
 * Returns total number of tasks in one status.
 * @param {string} status
 */
function getBoardStatusTaskCount(status) {
	return getBoardStatusTaskCountFromList(boardState.tasks, status);
}

/**
 * Returns total number of tasks in one status from task list.
 * @param {Array} tasks
 * @param {string} status
 */
function getBoardStatusTaskCountFromList(tasks, status) {
	let count = 0;
	for (let index = 0; index < tasks.length; index++) {
		if (boardNormalizeStatus(tasks[index]?.status) === status) count++;
	}
	return count;
}

/**
 * Returns drop-target cards excluding currently dragged card.
 * @param {HTMLElement} dropZone
 */
function getBoardDropTargetCards(dropZone) {
	const cards = Array.from(dropZone.querySelectorAll(".board-task-card"));
	return cards.filter((card) => card.dataset.taskId !== boardState.dragTaskId);
}

/**
 * Computes insertion preview index by pointer position.
 * @param {DragEvent} event
 * @param {HTMLElement[]} cards
 */
function getBoardDropPreviewIndex(event, cards) {
	const pointerY = Number(event.clientY || 0);
	for (let index = 0; index < cards.length; index++) {
		const rect = cards[index].getBoundingClientRect();
		if (pointerY < rect.top + rect.height / 2) return index;
	}
	return cards.length;
}

/**
 * Renders one placeholder preview in drop zone.
 * @param {HTMLElement} dropZone
 * @param {HTMLElement[]} cards
 * @param {number} previewIndex
 */
function renderBoardDropPreview(dropZone, cards, previewIndex) {
	clearBoardPreviewFromOtherDropZones(dropZone);
	const placeholder = getOrCreateBoardDropPreviewElement(dropZone);
	hideBoardDropZoneEmptyState(dropZone);
	const targetCard = cards[previewIndex] || null;
	if (targetCard) {
		dropZone.insertBefore(placeholder, targetCard);
		return;
	}
	dropZone.appendChild(placeholder);
}

/**
 * Clears preview placeholders from all non-active drop zones.
 * @param {HTMLElement} activeDropZone
 */
function clearBoardPreviewFromOtherDropZones(activeDropZone) {
	const dropZones = document.querySelectorAll(".board-column-drop-zone");
	for (let index = 0; index < dropZones.length; index++) {
		if (dropZones[index] === activeDropZone) continue;
		const placeholder = dropZones[index].querySelector(".board-drop-preview");
		if (placeholder) placeholder.remove();
		const emptyState = dropZones[index].querySelector(".board-empty-state");
		if (emptyState) emptyState.classList.remove("board-empty-state-hidden");
	}
}

/**
 * Returns existing preview element or creates one.
 * @param {HTMLElement} dropZone
 */
function getOrCreateBoardDropPreviewElement(dropZone) {
	let placeholder = dropZone.querySelector(".board-drop-preview");
	if (placeholder) return placeholder;
	placeholder = document.createElement("div");
	placeholder.className = "board-drop-preview";
	return placeholder;
}

/**
 * Hides empty-state element inside drop zone while dragging.
 * @param {HTMLElement} dropZone
 */
function hideBoardDropZoneEmptyState(dropZone) {
	const emptyState = dropZone.querySelector(".board-empty-state");
	if (!emptyState) return;
	emptyState.classList.add("board-empty-state-hidden");
}

/**
 * Clears drag classes and state from board.
 */
function clearBoardDropPreviewState() {
	const dropZones = document.querySelectorAll(".board-column-drop-zone");
	for (let index = 0; index < dropZones.length; index++) {
		const placeholder = dropZones[index].querySelector(".board-drop-preview");
		if (placeholder) placeholder.remove();
		const emptyState = dropZones[index].querySelector(".board-empty-state");
		if (emptyState) emptyState.classList.remove("board-empty-state-hidden");
	}
	const draggingCards = document.querySelectorAll(".board-task-card.is-dragging-origin");
	for (let index = 0; index < draggingCards.length; index++) {
		draggingCards[index].classList.remove("is-dragging-origin");
	}
	boardState.dragTaskId = "";
	boardState.dragOverStatus = "";
	boardState.dragPreviewIndex = -1;
}
// #endregion
