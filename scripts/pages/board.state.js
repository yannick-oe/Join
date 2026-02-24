// #region State
const boardState = {
	contacts: [],
	tasks: [],
	searchValue: "",
	dragTaskId: "",
	dragOverStatus: "",
	dragPreviewIndex: -1,
	overlayTargetStatus: "todo",
	overlayEditTaskId: "",
	hasDocumentClickBinding: false,
	statusOrder: ["todo", "in-progress", "await-feedback", "done"],
	columnIds: {
		todo: "boardColumnTodo",
		"in-progress": "boardColumnInProgress",
		"await-feedback": "boardColumnAwaitFeedback",
		done: "boardColumnDone",
	},
	priorityLabels: {
		urgent: "Urgent",
		medium: "Medium",
		low: "Low",
	},
	priorityIcons: {
		urgent: "../assets/icon/high-prio.svg",
		medium: "../assets/icon/medium-prio.svg",
		low: "../assets/icon/low-prio.svg",
	},
	categoryClasses: {
		"user story": "board-card-category-user-story",
		"technical task": "board-card-category-technical-task",
		"technical tasks": "board-card-category-technical-task",
	},
};
// #endregion
