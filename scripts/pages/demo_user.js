const DEMO_EMAIL = "mustermann@gmail.com";
const DEMO_PASS = "123456";
const SESSION_KEY = "joinSession";

/**
 * Retrieves required login elements from the DOM.
 */
function getLoginInputs() {
  return {
    emailInput: document.getElementById("email"),
    passwordInput: document.getElementById("password"),
    messageElement: document.getElementById("loginMessage"),
    buttonGroupElement: document.getElementById("btnGroup")
  };
}

/**
 * Clears login input fields.
 */
function clearLoginFields(emailInput, passwordInput) {
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
}

/**
 * Inserts demo display values into the login form.
 * Does NOT expose real demo credentials in UI.
 */
function fillDemoFields(emailInput, passwordInput) {
  if (!emailInput || !passwordInput) return false;

  emailInput.setAttribute("name", "demo_email");
  passwordInput.setAttribute("name", "demo_password");

  emailInput.value = "Guest";
  passwordInput.value = "******";

  return true;
}

/**
 * Stores demo user session in localStorage.
 * Session is local-only and not server-based.
 */
function saveDemoSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: DEMO_EMAIL,
    role: "demo",
    timestamp: Date.now()
  }));
}

/**
 * Displays success message and adjusts layout state.
 */
function showSuccess(messageElement, buttonGroupElement) {
  if (messageElement) {
    messageElement.textContent = "Login successful.";
    messageElement.className = "success";
  }
  if (buttonGroupElement) {
    buttonGroupElement.classList.add("success_active");
  }
}

/**
 * Redirects user to summary page after delay.
 */
function redirectToSummary() {
  setTimeout(() => {
    window.location.href = "../pages/summary.html";
  }, 800);
}

/**
 * Synchronizes optional global demo password variable.
 */
function syncDemoPasswordVar() {
  if (typeof realPassword === "undefined") return;
  realPassword = DEMO_PASS;
}

/**
 * Finalizes demo login by persisting session and redirecting.
 * @param {HTMLElement|null} messageElement
 * @param {HTMLElement|null} buttonGroupElement
 */
function finalizeDemoLogin(messageElement, buttonGroupElement) {
  saveDemoSession();
  showSuccess(messageElement, buttonGroupElement);
  redirectToSummary();
}

/**
 * Main demo login handler.
 *
 * Prevent default form behavior
 * Insert guest display values
 * Save local session
 * Show success message
 * Redirect to summary page
 *
 * @param {Event} [event]
 */
function demoLogin(event) {
  if (event) event.preventDefault();

  const loginElements = getLoginInputs();
  if (!fillDemoFields(loginElements.emailInput, loginElements.passwordInput)) return false;
  syncDemoPasswordVar();
  finalizeDemoLogin(loginElements.messageElement, loginElements.buttonGroupElement);

  return true;
}

/**
 * Resets login form state on page load.
 * Restores original input names and clears values.
 */
window.onload = function () {
  const loginElements = getLoginInputs();

  if (loginElements.emailInput) loginElements.emailInput.setAttribute("name", "email");
  if (loginElements.passwordInput) loginElements.passwordInput.setAttribute("name", "passwort");

  clearLoginFields(loginElements.emailInput, loginElements.passwordInput);
};

window.demoLogin = demoLogin;