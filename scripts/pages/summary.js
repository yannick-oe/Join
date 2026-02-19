/**
 * Initializes summary auth and greeting.
 */
function initSummaryPage() {
	initProtectedPageAuth();
	renderSummaryGreeting();
}

/**
 * Renders the summary greeting for user or guest.
 */
function renderSummaryGreeting() {
	const sessionUser = getSessionUser();
	if (!sessionUser) return;
	const isGuest = sessionUser.role === "guest";
	setSummaryGreetingTitle(isGuest ? "Good morning" : "Good morning,");
	setSummaryGreetingName(isGuest ? "" : sessionUser.name);
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
