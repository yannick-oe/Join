/**
 * Initializes summary auth, greeting and metrics.
 */
async function initSummaryPage() {
	initProtectedPageAuth();
	renderSummaryGreeting();
	await renderSummaryMetrics();
}

/**
 * Renders greeting for user or guest by daytime.
 */
function renderSummaryGreeting() {
	const sessionUser = getSessionUser();
	if (!sessionUser) return;
	const greeting = getTimeBasedGreeting();
	const isGuest = sessionUser.role === "guest";
	setSummaryGreetingTitle(isGuest ? greeting : `${greeting},`);
	setSummaryGreetingName(isGuest ? "" : sessionUser.name);
}

/**
 * Resolves greeting based on current hour.
 */
function getTimeBasedGreeting() {
	const currentHour = new Date().getHours();
	if (currentHour < 12) return "Good morning";
	if (currentHour < 18) return "Good afternoon";
	return "Good evening";
}

/**
 * Loads tasks and renders all summary counters.
 */
async function renderSummaryMetrics() {
	const tasks = await loadSummaryTasks();
	const stats = buildSummaryStats(tasks);
	applySummaryStats(stats);
}

/**
 * Loads tasks from storage with localStorage fallback.
 */
async function loadSummaryTasks() {
	if (typeof loadTasks === "function") {
		const list = await loadTasks();
		return Array.isArray(list) ? list : [];
	}
	const localTasks = JSON.parse(localStorage.getItem("joinTasks") || "[]");
	return Array.isArray(localTasks) ? localTasks : [];
}

/**
 * Builds all summary values from task list.
 * @param {Array} tasks
 */
function buildSummaryStats(tasks) {
	const accumulator = createSummaryAccumulator(tasks);
	for (let index = 0; index < accumulator.tasks.length; index++) {
		handleSummaryTask(accumulator, accumulator.tasks[index]);
	}
	return buildSummaryStatsResult(accumulator);
}

/**
 * Creates summary metrics accumulator.
 * @param {Array} tasks
 */
function createSummaryAccumulator(tasks) {
	return {
		tasks: Array.isArray(tasks) ? tasks : [],
		todoCount: 0,
		doneCount: 0,
		inProgressCount: 0,
		awaitingFeedbackCount: 0,
		urgentCount: 0,
		nearestDate: null,
	};
}

/**
 * Applies one task to summary accumulator.
 * @param {Object} accumulator
 * @param {Object} task
 */
function handleSummaryTask(accumulator, task) {
	if (!isSummaryTaskObject(task)) return;
	const status = normalizeSummaryStatus(task.status);
	incrementSummaryStatusCount(accumulator, status);
	incrementSummaryUrgentCount(accumulator, task.priority);
	updateSummaryNearestDate(accumulator, status, task.dueDate);
}

/**
 * Checks whether value is a valid task object.
 * @param {Object} task
 */
function isSummaryTaskObject(task) {
	return !!(task && typeof task === "object");
}

/**
 * Increments status counters.
 * @param {Object} accumulator
 * @param {string} status
 */
function incrementSummaryStatusCount(accumulator, status) {
	if (status === "todo") accumulator.todoCount++;
	if (status === "done") accumulator.doneCount++;
	if (status === "in-progress") accumulator.inProgressCount++;
	if (status === "await-feedback") accumulator.awaitingFeedbackCount++;
}

/**
 * Increments urgent counter when needed.
 * @param {Object} accumulator
 * @param {string} priority
 */
function incrementSummaryUrgentCount(accumulator, priority) {
	if (normalizeSummaryPriority(priority) === "urgent") accumulator.urgentCount++;
}

/**
 * Updates nearest upcoming due date.
 * @param {Object} accumulator
 * @param {string} status
 * @param {string} dueDateValue
 */
function updateSummaryNearestDate(accumulator, status, dueDateValue) {
	if (status === "done") return;
	const dueDate = parseSummaryDate(dueDateValue);
	if (!dueDate) return;
	if (!accumulator.nearestDate || dueDate < accumulator.nearestDate) {
		accumulator.nearestDate = dueDate;
	}
}

/**
 * Maps accumulator to final stats object.
 * @param {Object} accumulator
 */
function buildSummaryStatsResult(accumulator) {
	return {
		todoCount: accumulator.todoCount,
		doneCount: accumulator.doneCount,
		urgentCount: accumulator.urgentCount,
		tasksInBoard: accumulator.tasks.length,
		inProgressCount: accumulator.inProgressCount,
		awaitingFeedbackCount: accumulator.awaitingFeedbackCount,
		upcomingDate: getSummaryUpcomingDateLabel(accumulator.nearestDate),
	};
}

/**
 * Builds summary due date label.
 * @param {Date|null} nearestDate
 */
function getSummaryUpcomingDateLabel(nearestDate) {
	if (!nearestDate) return "No deadline";
	return formatSummaryDate(nearestDate);
}

/**
 * Renders one summary stats object.
 * @param {{todoCount:number,doneCount:number,urgentCount:number,tasksInBoard:number,inProgressCount:number,awaitingFeedbackCount:number,upcomingDate:string}} stats
 */
function applySummaryStats(stats) {
	const metrics = getSummaryMetricEntries(stats);
	for (let index = 0; index < metrics.length; index++) {
		setSummaryText(metrics[index][0], metrics[index][1]);
	}
}

/**
 * Builds metric id-value entries for rendering.
 * @param {Object} stats
 */
function getSummaryMetricEntries(stats) {
	return [
		["summaryTodoCount", stats.todoCount],
		["summaryDoneCount", stats.doneCount],
		["summaryUrgentCount", stats.urgentCount],
		["summaryTasksInBoard", stats.tasksInBoard],
		["summaryInProgressCount", stats.inProgressCount],
		["summaryAwaitingFeedbackCount", stats.awaitingFeedbackCount],
		["summaryUpcomingDate", stats.upcomingDate],
	];
}

/**
 * Sets text content for one element id.
 * @param {string} elementId
 * @param {string|number} value
 */
function setSummaryText(elementId, value) {
	const element = document.getElementById(elementId);
	if (!element) return;
	element.innerText = String(value);
}

/**
 * Normalizes task status into board statuses.
 * @param {string} status
 */
function normalizeSummaryStatus(status) {
	const value = String(status || "").trim().toLowerCase();
	if (value === "in progress" || value === "in-progress") return "in-progress";
	if (value === "await feedback" || value === "await-feedback") return "await-feedback";
	if (value === "done") return "done";
	return "todo";
}

/**
 * Normalizes priority values.
 * @param {string} priority
 */
function normalizeSummaryPriority(priority) {
	const value = String(priority || "").trim().toLowerCase();
	if (value === "urgent") return "urgent";
	if (value === "low") return "low";
	return "medium";
}

/**
 * Parses supported task date formats.
 * @param {string} value
 */
function parseSummaryDate(value) {
	const text = String(value || "").trim();
	if (!text) return null;
	if (text.includes("-")) return parseSummaryIsoDate(text);
	if (text.includes("/")) return parseSummarySlashDate(text);
	return null;
}

/**
 * Parses summary date in YYYY-MM-DD format.
 * @param {string} value
 */
function parseSummaryIsoDate(value) {
	const parts = value.split("-");
	if (parts.length !== 3) return null;
	return createSummaryDate(parts[0], parts[1], parts[2]);
}

/**
 * Parses summary date in DD/MM/YYYY format.
 * @param {string} value
 */
function parseSummarySlashDate(value) {
	const parts = value.split("/");
	if (parts.length !== 3) return null;
	return createSummaryDate(parts[2], parts[1], parts[0]);
}

/**
 * Creates a Date object from numeric parts.
 * @param {string|number} yearValue
 * @param {string|number} monthValue
 * @param {string|number} dayValue
 */
function createSummaryDate(yearValue, monthValue, dayValue) {
	const year = Number(yearValue);
	const month = Number(monthValue) - 1;
	const day = Number(dayValue);
	const date = new Date(year, month, day);
	if (Number.isNaN(date.getTime())) return null;
	return date;
}

/**
 * Formats date for summary card.
 * @param {Date} date
 */
function formatSummaryDate(date) {
	return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Updates summary greeting title text.
 * @param {string} text
 */
function setSummaryGreetingTitle(text) {
	const element = document.getElementById("summaryGreetingTitle");
	if (element) element.innerText = text || "Good morning";
}

/**
 * Updates summary greeting user name visibility.
 * @param {string} name
 */
function setSummaryGreetingName(name) {
	const element = document.getElementById("summaryGreetingName");
	if (!element) return;
	element.innerText = name || "";
	element.classList.toggle("hidden", !name);
}

/**
 * Navigates from summary cards to board page.
 */
function openBoardPage() {
	window.location.href = "./board.html";
}
