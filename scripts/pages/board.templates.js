// #region Board card templates

/**
 * Returns board task card template.
 * @param {{id:string,categoryClass:string,categoryLabel:string,title:string,description:string,progressHtml:string,avatarsHtml:string,priorityIcon:string,priorityAlt:string}} viewModel
 */
function getBoardTaskCardTemplate(viewModel) {
	const topRow = getBoardTaskCardTopRowTemplate(viewModel);
	const footer = getBoardTaskCardFooterTemplate(viewModel);
	return `
		<article class="board-task-card" data-task-id="${viewModel.id}" draggable="${viewModel.draggableValue}" ondragstart="startTaskDrag(event, '${viewModel.id}')" ondragend="endTaskDrag()" onclick="openBoardTaskDetail('${viewModel.id}')">
			${topRow}
			<h3 class="board-card-title">${viewModel.title}</h3>
			<p class="board-card-description">${viewModel.description}</p>
			${viewModel.progressHtml}
			${footer}
		</article>
	`;
}

/**
 * Returns board task card top row template.
 * @param {{id:string,categoryClass:string,categoryLabel:string,moveMenuHtml:string}} viewModel
 */
function getBoardTaskCardTopRowTemplate(viewModel) {
	return `
		<div class="board-card-top-row">
			<p class="board-card-category ${viewModel.categoryClass}">${viewModel.categoryLabel}</p>
			<div class="board-card-move-shell" onclick="event.stopPropagation()">
				<button class="board-card-move-toggle" type="button" aria-label="Move task" onclick="toggleBoardTaskMoveMenu(event, '${viewModel.id}')">
					<img src="../assets/icon/swap_horiz.svg?v=1" alt="" aria-hidden="true" />
				</button>
				${viewModel.moveMenuHtml}
			</div>
		</div>
	`;
}

/**
 * Returns board task card footer template.
 * @param {{avatarsHtml:string,priorityIcon:string,priorityAlt:string}} viewModel
 */
function getBoardTaskCardFooterTemplate(viewModel) {
	return `
		<div class="board-card-footer">
			<div class="board-team-members">${viewModel.avatarsHtml}</div>
			<img class="board-card-priority" src="${viewModel.priorityIcon}" alt="${viewModel.priorityAlt}" />
		</div>
	`;
}

/**
 * Returns board card progress template.
 * @param {{percent:number,done:number,total:number}} progress
 */
function getBoardCardProgressTemplate(progress) {
	return `<div class="board-card-progress"><div class="board-card-progress-bar"><span style="width:${progress.percent}%"></span></div><p>${progress.done}/${progress.total} Subtasks</p></div>`;
}

/**
 * Returns one team member badge template.
 * @param {{color:string,initials:string}} viewModel
 */
function getBoardTeamMemberBadgeTemplate(viewModel) {
	return `<span class="team-member-badge" style="background:${viewModel.color}">${viewModel.initials}</span>`;
}

/**
 * Returns overflow team member badge template.
 * @param {{count:number}} viewModel
 */
function getBoardTeamMemberOverflowTemplate(viewModel) {
	return `<span class="team-member-badge board-team-member-plus">+${viewModel.count}</span>`;
}

/**
 * Returns empty state template.
 * @param {{text:string}} viewModel
 */
function getBoardEmptyStateTemplate(viewModel) {
	return `<div class="board-empty-state">${viewModel.text}</div>`;
}
// #endregion

// #region Detail templates
/**
 * Returns board detail overlay template.
 * @param {{categoryClass:string,categoryLabel:string,title:string,description:string,dueDateLabel:string,priorityLabel:string,priorityIcon:string,assigneesHtml:string,subtasksHtml:string,taskId:string}} viewModel
 */
function getBoardTaskDetailTemplate(viewModel) {
	return `
		${getBoardTaskDetailHeaderTemplate(viewModel)}
		${getBoardTaskDetailBodyTemplate(viewModel)}
		${getBoardTaskDetailActionsTemplate(viewModel.taskId)}
	`;
}

/**
 * Returns detail header template.
 * @param {{categoryClass:string,categoryLabel:string}} viewModel
 */
function getBoardTaskDetailHeaderTemplate(viewModel) {
	return `
		<div class="board-task-detail-header">
			<p class="board-card-category ${viewModel.categoryClass}">${viewModel.categoryLabel}</p>
			<button class="board-overlay-close" type="button" onclick="closeBoardTaskDetailOverlay()">×</button>
		</div>
	`;
}

/**
 * Returns detail body template.
 * @param {{title:string,description:string,dueDateLabel:string,priorityLabel:string,priorityIcon:string,assigneesHtml:string,subtasksHtml:string}} viewModel
 */
function getBoardTaskDetailBodyTemplate(viewModel) {
	return `
		<h3 class="board-task-detail-title">${viewModel.title}</h3>
		<p class="board-task-detail-description">${viewModel.description}</p>
		<div class="board-task-detail-row"><span>Due date:</span><p>${viewModel.dueDateLabel}</p></div>
		<div class="board-task-detail-row"><span>Priority:</span><p>${viewModel.priorityLabel} <img src="${viewModel.priorityIcon}" alt="${viewModel.priorityLabel}" /></p></div>
		<div class="board-task-detail-section"><h4>Assigned To:</h4><div class="board-task-detail-assignees">${viewModel.assigneesHtml}</div></div>
		<div class="board-task-detail-section"><h4>Subtasks:</h4><div class="board-task-detail-subtasks">${viewModel.subtasksHtml}</div></div>
	`;
}

/**
 * Returns detail action buttons template.
 * @param {string} taskId
 */
function getBoardTaskDetailActionsTemplate(taskId) {
	return `
		<div class="board-task-detail-actions">
			<button class="link-button" type="button" onclick="deleteBoardTask('${taskId}')">
				<img src="../assets/icon/delete.svg" alt="" aria-hidden="true" />
				Delete
			</button>
			<button class="link-button" type="button" onclick="startBoardTaskEdit('${taskId}')">
				<img src="../assets/icon/edit_grey.svg" alt="" aria-hidden="true" />
				Edit
			</button>
		</div>
	`;
}

/**
 * Returns detail assignee row template.
 * @param {{color:string,initials:string,name:string}} viewModel
 */
function getBoardTaskDetailAssigneeTemplate(viewModel) {
	return `
		<div class="board-task-detail-person">
			<span class="team-member-badge" style="background:${viewModel.color}">${viewModel.initials}</span>
			<p>${viewModel.name}</p>
		</div>
	`;
}

/**
 * Returns detail subtask row template.
 * @param {{checkedAttribute:string,taskId:string,subtaskId:string,text:string}} viewModel
 */
function getBoardTaskDetailSubtaskTemplate(viewModel) {
	return `
		<label class="board-task-detail-subtask-item">
			<input type="checkbox" ${viewModel.checkedAttribute} onchange="toggleBoardSubtask('${viewModel.taskId}', '${viewModel.subtaskId}')" />
			<span>${viewModel.text}</span>
		</label>
	`;
}

/**
 * Returns unassigned text template.
 */
function getBoardTaskDetailUnassignedTemplate() {
	return "<p>Unassigned</p>";
}

/**
 * Returns no-subtasks text template.
 */
function getBoardTaskDetailNoSubtasksTemplate() {
	return "<p>No subtasks</p>";
}
// #endregion

// #region Add-task overlay template
/**
 * Returns add-task overlay template.
 * @param {{title:string,submitLabel:string}} viewModel
 */
function getBoardAddTaskOverlayTemplate(viewModel) {
	return `
		${getBoardAddTaskOverlayHeadTemplate(viewModel.title)}
		${getBoardAddTaskOverlayFormTemplate(viewModel.submitLabel)}
	`;
}

/**
 * Returns add-task overlay header.
 * @param {string} title
 */
function getBoardAddTaskOverlayHeadTemplate(title) {
	return `
		<div class="board-add-task-top-row">
			<h2 class="add-task-title">${title}</h2>
			<button class="board-overlay-close" type="button" onclick="closeBoardAddTaskOverlay()">×</button>
		</div>
	`;
}

/**
 * Returns add-task overlay form shell.
 * @param {string} submitLabel
 */
function getBoardAddTaskOverlayFormTemplate(submitLabel) {
	return `
		<form class="task-form" onsubmit="submitBoardOverlayTask(event)" novalidate>
			<div class="task-form-grid">
				${getBoardAddTaskOverlayLeftColumnTemplate()}
				${getBoardAddTaskOverlayRightColumnTemplate()}
			</div>
			${getBoardAddTaskOverlayFooterTemplate(submitLabel)}
		</form>
	`;
}

/**
 * Returns left form column for board add-task overlay.
 */
function getBoardAddTaskOverlayLeftColumnTemplate() {
	return `
		<section class="task-form-left">
			<label class="task-label" for="taskTitle">Title<span id="taskTitleRequiredStar" class="required-star">*</span></label>
			<input id="taskTitle" class="task-input" type="text" placeholder="Enter a title" oninput="handleTitleInput()" />
			<p id="taskTitleError" class="task-error hidden">This field is required</p>
			<label class="task-label" for="taskDescription">Description</label>
			<textarea id="taskDescription" class="task-textarea" placeholder="Enter a Description"></textarea>
			<label class="task-label" for="taskDate">Due date<span id="taskDateRequiredStar" class="required-star">*</span></label>
			<input id="taskDate" class="task-input" type="date" oninput="handleDateInput()" />
			<p id="taskDateError" class="task-error hidden">This field is required</p>
		</section>
	`;
}

/**
 * Returns right form column for board add-task overlay.
 */
function getBoardAddTaskOverlayRightColumnTemplate() {
	return `
		<section class="task-form-right">
			${getBoardAddTaskPriorityBlockTemplate()}
			${getBoardAddTaskAssignedBlockTemplate()}
			${getBoardAddTaskCategoryBlockTemplate()}
			${getBoardAddTaskSubtaskBlockTemplate()}
			<p class="task-required-note"><span>*</span> This field is required</p>
		</section>
	`;
}

/**
 * Returns priority block template for board overlay form.
 */
function getBoardAddTaskPriorityBlockTemplate() {
	return `
		<label class="task-label">Priority</label>
		<div class="priority-row">
			<button id="priorityUrgent" class="priority-button" type="button" onclick="setPriority('urgent')">Urgent <img class="priority-icon" src="../assets/icon/high-prio.svg" alt=""></button>
			<button id="priorityMedium" class="priority-button is-selected" type="button" onclick="setPriority('medium')">Medium <img class="priority-icon" src="../assets/icon/medium-prio.svg" alt=""></button>
			<button id="priorityLow" class="priority-button" type="button" onclick="setPriority('low')">Low <img class="priority-icon" src="../assets/icon/low-prio.svg" alt=""></button>
		</div>
	`;
}

/**
 * Returns assigned-to dropdown block template.
 */
function getBoardAddTaskAssignedBlockTemplate() {
	return `
		<label class="task-label" for="teamMemberToggle">Assigned to</label>
		<div class="dropdown-shell" id="teamMemberDropdownShell">
			<button id="teamMemberToggle" class="task-input task-dropdown-toggle" type="button" onclick="toggleTeamMemberDropdown()">Select contacts to assign</button>
			<div id="teamMemberDropdown" class="dropdown-panel hidden"></div>
			<div id="teamMemberBadges" class="team-member-badges"></div>
		</div>
	`;
}

/**
 * Returns category dropdown block template.
 */
function getBoardAddTaskCategoryBlockTemplate() {
	return `
		<label class="task-label" for="categoryToggle">Category<span id="taskCategoryRequiredStar" class="required-star">*</span></label>
		<div class="dropdown-shell">
			<button id="categoryToggle" class="task-input task-dropdown-toggle" type="button" onclick="toggleCategoryDropdown()">Select task category</button>
			<div id="categoryDropdown" class="dropdown-panel hidden"></div>
		</div>
		<p id="taskCategoryError" class="task-error hidden">This field is required</p>
	`;
}

/**
 * Returns subtask input/list block template.
 */
function getBoardAddTaskSubtaskBlockTemplate() {
	return `
		<label class="task-label" for="subtaskInput">Subtasks</label>
		<div class="subtask-input-shell">
			<input id="subtaskInput" class="task-input" type="text" placeholder="Add new subtask" oninput="handleSubtaskInput()" onkeydown="handleSubtaskInputKeydown(event)" />
			<div id="subtaskActions" class="subtask-actions hidden">
				<button class="subtask-action" type="button" onclick="cancelSubtaskEdit()">×</button>
				<button class="subtask-action" type="button" onclick="saveSubtaskDraft()">✓</button>
			</div>
		</div>
		<div id="subtaskList" class="subtask-list"></div>
	`;
}

/**
 * Returns footer actions for board add-task overlay.
 * @param {string} submitLabel
 */
function getBoardAddTaskOverlayFooterTemplate(submitLabel) {
	return `
		<div class="task-form-footer">
			<div class="task-footer-actions">
				<button class="button-ghost task-clear-button" type="button" onclick="closeBoardAddTaskOverlay()">Cancel ×</button>
				<button class="button-primary task-create-button" type="submit">${submitLabel}</button>
			</div>
		</div>
	`;
}
// #endregion