// #region Init
/**
 * Initializes login page state.
 */
function initLoginPage() {
  resetLoginUi();
  if (!hasActiveSession()) return;
  window.location.href = "./pages/summary.html";
}

/**
 * Resets login inputs and messages.
 */
function resetLoginUi() {
  setLoginInputValue("email", "");
  setLoginInputValue("password", "");
  setLoginMessage("", "");
}
// #endregion

// #region Submit
/**
 * Handles login submit.
 * @param {Event} event
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const loginData = readLoginForm();
  const validationText = validateLoginForm(loginData);
  if (validationText) return setLoginMessage(validationText, "error");
  const users = await loadUsers();
  const user = findUserByEmail(users, loginData.email);
  if (!user) return setLoginMessage("Account not found. Please sign up first.", "error");
  if (!isMatchingPassword(user, loginData.password)) return setLoginMessage("Wrong email or password.", "error");
  completeLogin(user);
}

/**
 * Stores session and redirects on successful login.
 * @param {{id:string,name:string,email:string}} user
 */
function completeLogin(user) {
  setSessionUser(buildSessionPayload(user));
  setLoginMessage("Login successful.", "success");
  setTimeout(() => window.location.href = "./pages/summary.html", 500);
}

/**
 * Handles guest login action.
 * @param {Event} event
 */
function guestLogIn(event) {
  if (event) event.preventDefault();
  const guestUser = { id: "guest_user", name: "Guest User", email: "guest@join.local", role: "guest" };
  completeLogin(guestUser);
}
// #endregion

// #region Validation and helpers
/**
 * Reads login form values.
 */
function readLoginForm() {
  return {
    email: getLoginInputValue("email"),
    password: getLoginInputValue("password"),
  };
}

/**
 * Validates login input values.
 * @param {{email:string,password:string}} loginData
 */
function validateLoginForm(loginData) {
  if (!String(loginData.email || "").trim()) return "Please enter your email.";
  if (!String(loginData.password || "").trim()) return "Please enter your password.";
  return "";
}

/**
 * Finds user by email.
 * @param {Array} users
 * @param {string} email
 */
function findUserByEmail(users, email) {
  const normalizedEmail = normalizeEmail(email);
  return (users || []).find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

/**
 * Checks whether password matches user password.
 * @param {{password:string}} user
 * @param {string} password
 */
function isMatchingPassword(user, password) {
  return String(user.password || "") === String(password || "");
}

/**
 * Builds session payload.
 * @param {{id:string,name:string,email:string}} user
 */
function buildSessionPayload(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role || "user" };
}

/**
 * Normalizes email text.
 * @param {string} email
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Reads one login input value.
 * @param {string} inputId
 */
function getLoginInputValue(inputId) {
  const element = document.getElementById(inputId);
  return element ? element.value : "";
}

/**
 * Writes one login input value.
 * @param {string} inputId
 * @param {string} value
 */
function setLoginInputValue(inputId, value) {
  const element = document.getElementById(inputId);
  if (element) element.value = value || "";
}

/**
 * Updates login message element.
 * @param {string} text
 * @param {string} type
 */
function setLoginMessage(text, type) {
  const element = document.getElementById("loginMessage");
  if (!element) return;
  element.innerText = text || "";
  element.className = `form_message ${type || ""}`.trim();
}
// #endregion
