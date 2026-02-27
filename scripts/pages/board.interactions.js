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
    closeBoardTaskMoveMenuOnOutsideClick(event);
    const addTaskOverlay = document.getElementById("boardAddTaskOverlay");
    if (!addTaskOverlay || addTaskOverlay.classList.contains("hidden")) return;
    if (typeof handlePageClick === "function") handlePageClick(event);
}

/**
 * Closes mobile move menu on outside click.
 * @param {MouseEvent} event
 */
function closeBoardTaskMoveMenuOnOutsideClick(event) {
    if (!boardState.mobileMoveMenuTaskId) return;
    if (event.target.closest(".board-card-move-shell")) return;
    boardState.mobileMoveMenuTaskId = "";
    renderBoardColumns();
}

/**
 * Starts dragging one task card.
 * @param {DragEvent} event
 * @param {string} taskId
 */
function startTaskDrag(event, taskId) {
    if (isBoardMobileView()) return;
    event.stopPropagation();
    boardState.dragTaskId = taskId;
    boardState.mobileMoveMenuTaskId = "";
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
    if (isBoardMobileView()) return;
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
    if (isBoardMobileView()) return;
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
    const maxTarget = getBoardStatusTaskCountFromList(tasks, nextStatus);
    const clampedTargetIndex = Math.max(0, Math.min(Number(targetIndex) || 0, maxTarget));
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
    clearBoardDropPreviewsAndEmptyStates();
    clearBoardDragOriginStyles();
    resetBoardDragState();
}

/**
 * Removes drop previews and restores empty states.
 */
function clearBoardDropPreviewsAndEmptyStates() {
    const dropZones = document.querySelectorAll(".board-column-drop-zone");
    for (let index = 0; index < dropZones.length; index++) {
        const placeholder = dropZones[index].querySelector(".board-drop-preview");
        if (placeholder) placeholder.remove();
        const emptyState = dropZones[index].querySelector(".board-empty-state");
        if (emptyState) emptyState.classList.remove("board-empty-state-hidden");
    }
}

/**
 * Clears dragging marker from task cards.
 */
function clearBoardDragOriginStyles() {
    const draggingCards = document.querySelectorAll(".board-task-card.is-dragging-origin");
    for (let index = 0; index < draggingCards.length; index++) {
        draggingCards[index].classList.remove("is-dragging-origin");
    }
}

/**
 * Resets drag-related state fields.
 */
function resetBoardDragState() {
    boardState.dragTaskId = "";
    boardState.dragOverStatus = "";
    boardState.dragPreviewIndex = -1;
}

/**
 * Toggles one task move menu in mobile view.
 * @param {Event} event
 * @param {string} taskId
 */
function toggleBoardTaskMoveMenu(event, taskId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const nextId = boardState.mobileMoveMenuTaskId === taskId ? "" : taskId;
    boardState.mobileMoveMenuTaskId = nextId;
    renderBoardColumns();
}

/**
 * Moves task to selected status from mobile menu.
 * @param {Event} event
 * @param {string} taskId
 * @param {string} nextStatus
 */
async function moveBoardTaskByMenu(event, taskId, nextStatus) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const normalizedStatus = boardNormalizeStatus(nextStatus);
    moveBoardTaskToStatusIndex(taskId, normalizedStatus, getBoardStatusTaskCount(normalizedStatus));
    boardState.mobileMoveMenuTaskId = "";
    await persistBoardTasks();
    renderBoardColumns();
}

/**
 * Builds task move menu html for mobile cards.
 * @param {Object} task
 */
function buildBoardTaskMoveMenuHtml(task) {
    if (!isBoardMobileView()) return "";
    const optionHtml = buildBoardMoveMenuOptions(task);
    if (!optionHtml) return "";
    const isOpenClass = boardState.mobileMoveMenuTaskId === task.id ? " is-open" : "";
    return `<div class="board-task-move-menu${isOpenClass}"><p>Move to</p>${optionHtml}</div>`;
}

/**
 * Builds all move-menu options for one task.
 * @param {Object} task
 */
function buildBoardMoveMenuOptions(task) {
    const currentStatus = boardNormalizeStatus(task.status);
    const statusIndex = boardState.statusOrder.indexOf(currentStatus);
    return boardState.statusOrder
        .filter((status) => status !== currentStatus)
        .map((status) => getBoardMoveMenuOptionHtml(task, status, statusIndex))
        .join("");
}

/**
 * Builds one move-menu option for one target status.
 * @param {Object} task
 * @param {string} status
 * @param {number} currentStatusIndex
 */
function getBoardMoveMenuOptionHtml(task, status, currentStatusIndex) {
    const targetIndex = boardState.statusOrder.indexOf(status);
    const arrow = targetIndex < currentStatusIndex ? "↑" : "↓";
    const label = boardEscapeHtml(getBoardStatusLabel(status));
    return `<button type="button" onclick="moveBoardTaskByMenu(event, '${task.id}', '${status}')">${arrow} ${label}</button>`;
}

/**
 * Returns board column label by status.
 * @param {string} status
 */
function getBoardStatusLabel(status) {
    if (status === "in-progress") return "In progress";
    if (status === "await-feedback") return "Review";
    if (status === "done") return "Done";
    return "To-do";
}

/**
 * Returns whether board is currently in mobile viewport.
 */
function isBoardMobileView() {
    return window.matchMedia("(max-width: 768px)").matches;
}
// #endregion