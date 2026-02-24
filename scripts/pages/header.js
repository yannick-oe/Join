const authState = {
    sessionKey: "joinSession",
};

/**
 * Function to open menu, header
*/
function openMenu() {
    let myDropdown = document.getElementById("myDropdown");
    if (!myDropdown) return;
    myDropdown.classList.toggle('d_none');
}

/**
 * Function to close menu, header
 */
function closeMenu() {
    let myDropdown = document.getElementById("myDropdown");
    if (!myDropdown) return;
    myDropdown.classList.add('d_none');
}

/**
 * Initializes auth for protected pages.
 */
function initProtectedPageAuth() {
    if (!hasActiveSession()) return redirectToLoginPage();
    applyHeaderProfileInitials();
}

/**
 * Reads the active session user.
 */
function getSessionUser() {
    const raw = localStorage.getItem(authState.sessionKey);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

/**
 * Stores the active session user.
 * @param {{id:string,name:string,email:string}} user
 */
function setSessionUser(user) {
    localStorage.setItem(authState.sessionKey, JSON.stringify(user || null));
}

/**
 * Clears active session storage.
 */
function clearSessionUser() {
    localStorage.removeItem(authState.sessionKey);
}

/**
 * Checks whether a valid session exists.
 */
function hasActiveSession() {
    const sessionUser = getSessionUser();
    return !!(sessionUser && sessionUser.name && sessionUser.email);
}

/**
 * Applies current user initials into header profile button.
 */
function applyHeaderProfileInitials() {
    const button = document.getElementById("myBtn");
    const sessionUser = getSessionUser();
    if (!button || !sessionUser) return;
    button.innerText = getSessionInitials(sessionUser);
}

/**
 * Resolves initials for current session user.
 * @param {{name:string,role?:string}} sessionUser
 */
function getSessionInitials(sessionUser) {
    if (sessionUser.role === "guest") return "G";
    return buildUserInitials(sessionUser.name);
}

/**
 * Builds initials from full name.
 * @param {string} name
 */
function buildUserInitials(name) {
    const parts = String(name || "").trim().split(" ").filter(Boolean);
    if (!parts.length) return "U";
    const first = parts[0][0]?.toUpperCase() || "";
    const second = parts[1]?.[0]?.toUpperCase() || "";
    return (first + second).slice(0, 2) || "U";
}

/**
 * Logs out current user and redirects to login.
 * @param {Event} event
 */
function logOutUser(event) {
    if (event) event.preventDefault();
    clearSessionUser();
    window.location.href = "/index.html";
    return false;
}

/**
 * Redirects to the login page.
 */
function redirectToLoginPage() {
    window.location.href = "/index.html";
}

/**
 * Navigates one step back in browser history, with a fallback URL.
 * @param {string} fallbackUrl
 */
function goBackOrFallback(fallbackUrl) {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }
    window.location.href = fallbackUrl || "/index.html";
}