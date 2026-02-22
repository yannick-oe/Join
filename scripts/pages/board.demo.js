// #region Demo contacts and tasks
const boardDemoTaskDefinitions = [
	{
		id: "t_demo_kochwelt",
		title: "Kochwelt Page & Recipe Recommender",
		description: "Build start page with recipe recommendation...",
		dueDate: "2026-05-10",
		priority: "medium",
		category: "User Story",
		status: "in-progress",
		createdOffset: 40000,
		teamMemberKeys: ["anton", "emmanuel", "marcel"],
		subtasks: [
			{ id: "s_demo_1", text: "Implement Recipe Recommendation", done: true },
			{ id: "s_demo_2", text: "Start Page Layout", done: false },
		],
	},
	{
		id: "t_demo_template",
		title: "HTML Base Template Creation",
		description: "Create reusable HTML base template...",
		dueDate: "2026-09-02",
		priority: "low",
		category: "Technical Task",
		status: "await-feedback",
		createdOffset: 30000,
		teamMemberKeys: ["anton", "emmanuel", "marcel"],
		subtasks: [],
	},
	{
		id: "t_demo_daily",
		title: "Daily Kochwelt Recipe",
		description: "Implement daily recipe and portion calculator...",
		dueDate: "2026-06-12",
		priority: "medium",
		category: "User Story",
		status: "await-feedback",
		createdOffset: 20000,
		teamMemberKeys: ["anton", "emmanuel", "marcel"],
		subtasks: [],
	},
	{
		id: "t_demo_css",
		title: "CSS Architecture Planning",
		description: "Define CSS naming conventions and structure...",
		dueDate: "2026-09-02",
		priority: "urgent",
		category: "Technical Task",
		status: "done",
		createdOffset: 10000,
		teamMemberKeys: ["sofia", "benedikt"],
		subtasks: [
			{ id: "s_demo_3", text: "Establish CSS Methodology", done: true },
			{ id: "s_demo_4", text: "Setup Base Styles", done: true },
		],
	},
	{
		id: "t_demo_api",
		title: "API Integration for Contacts",
		description: "Connect contacts data flow with storage adapter and fallback handling.",
		dueDate: "2026-10-14",
		priority: "medium",
		category: "Technical Task",
		status: "todo",
		createdOffset: 5000,
		teamMemberKeys: ["sofia", "anton"],
		subtasks: [
			{ id: "s_demo_5", text: "Map storage response to UI model", done: false },
		],
	},
];

/**
 * Provides demo contacts used for board preview.
 */
function getBoardDemoContacts() {
	return [
		{ id: "c_demo_sofia", name: "Sofia Müller", email: "sofia@mail.com", phone: "+49 1000 0000", color: "#29ABE2" },
		{ id: "c_demo_benedikt", name: "Benedikt Ziegler", email: "benedikt@mail.com", phone: "+49 1000 0001", color: "#6E52FF" },
		{ id: "c_demo_emmanuel", name: "Emmanuel Mauer", email: "emmanuel@mail.com", phone: "+49 1000 0002", color: "#1FD7C1" },
		{ id: "c_demo_marcel", name: "Marcel Bauer", email: "marcel@mail.com", phone: "+49 1000 0003", color: "#462F8A" },
		{ id: "c_demo_anton", name: "Anton Mayer", email: "anton@mail.com", phone: "+49 1000 0004", color: "#FF7A00" },
	];
}

/**
 * Builds demo tasks for board preview.
 * @param {Array} contacts
 */
function buildBoardDemoTasks(contacts) {
	const demoContactIds = getBoardDemoContactIds(contacts);
	const demoTasks = boardDemoTaskDefinitions.map((definition) => mapBoardDemoTask(definition, demoContactIds));
	return boardNormalizeTaskList(demoTasks);
}

/**
 * Builds demo-contact id map by contact names.
 * @param {Array} contacts
 */
function getBoardDemoContactIds(contacts) {
	return {
		sofia: getBoardContactIdByName(contacts, "Sofia Müller"),
		benedikt: getBoardContactIdByName(contacts, "Benedikt Ziegler"),
		emmanuel: getBoardContactIdByName(contacts, "Emmanuel Mauer"),
		marcel: getBoardContactIdByName(contacts, "Marcel Bauer"),
		anton: getBoardContactIdByName(contacts, "Anton Mayer"),
	};
}

/**
 * Maps one demo task definition to a task object.
 * @param {Object} definition
 * @param {Object} demoContactIds
 */
function mapBoardDemoTask(definition, demoContactIds) {
	return {
		id: definition.id,
		title: definition.title,
		description: definition.description,
		dueDate: definition.dueDate,
		priority: definition.priority,
		category: definition.category,
		status: definition.status,
		createdAt: Date.now() - definition.createdOffset,
		teamMembers: mapBoardDemoTeamMembers(definition.teamMemberKeys, demoContactIds),
		subtasks: definition.subtasks.map((subtask) => ({ ...subtask })),
	};
}

/**
 * Maps demo team-member keys to contact ids.
 * @param {Array} teamMemberKeys
 * @param {Object} demoContactIds
 */
function mapBoardDemoTeamMembers(teamMemberKeys, demoContactIds) {
	return teamMemberKeys.map((key) => demoContactIds[key]).filter(Boolean);
}
// #endregion
