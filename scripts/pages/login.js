// #region Init
/**
 * Initializes login page state.
 */
function initLoginPage() {
  resetLoginUi();
  runLoginLogoIntro();
  if (!hasActiveSession()) return;
  window.location.href = "./pages/summary.html";
}

/**
 * Resets login inputs and messages.
 */
function resetLoginUi() {
  setLoginInputValue("email", "");
  setLoginInputValue("password", "");
  syncLoginPasswordToggle();
  setLoginMessage("", "");
}

/**
 * Handles password input changes on login.
 */
function handleLoginPasswordInput() {
  syncLoginPasswordToggle();
}

/**
 * Toggles login password visibility.
 */
function toggleLoginPasswordVisibility() {
  const input = document.getElementById("password");
  if (!input || !String(input.value || "").trim()) return;
  input.type = input.type === "password" ? "text" : "password";
  syncLoginPasswordToggle();
}

/**
 * Syncs login password icon and button state.
 */
function syncLoginPasswordToggle() {
  const input = document.getElementById("password");
  const button = document.getElementById("loginPasswordToggle");
  const icon = document.getElementById("loginPasswordIcon");
  if (!input || !button || !icon) return;
  const hasValue = !!String(input.value || "").trim();
  button.disabled = !hasValue;
  icon.src = getLoginPasswordIconPath(input.type, hasValue);
}

/**
 * Resolves login password icon path by state.
 * @param {string} inputType
 * @param {boolean} hasValue
 */
function getLoginPasswordIconPath(inputType, hasValue) {
  if (!hasValue) return "./assets/icon/lock.svg";
  if (inputType === "text") return "./assets/icon/eye-open.svg";
  return "./assets/icon/eye-closed.svg";
}

/**
 * Runs logo intro animation from center to header position.
 */
function runLoginLogoIntro() {
  const splashScreen = document.getElementById("loginSplashScreen");
  const splashLogo = document.getElementById("loginSplashLogo");
  const headerLogo = document.getElementById("headerLogo");
  if (!splashScreen || !splashLogo || !headerLogo) return;
  const introDuration = 120;
  applyLogoTargetPosition(splashLogo, headerLogo);
  splashLogo.classList.add("is-visible");
  requestAnimationFrame(() => splashLogo.classList.add("is-moving"));
  setTimeout(() => hideLoginSplashScreen(splashScreen), Math.round(introDuration / 2));
  setTimeout(() => hideLoginSplashLogo(splashLogo), introDuration + 10);
}

/**
 * Hides splash overlay during logo animation.
 * @param {HTMLElement} splashScreen
 */
function hideLoginSplashScreen(splashScreen) {
  splashScreen.classList.add("is-hidden");
}

/**
 * Hides moving splash logo after intro animation.
 * @param {HTMLElement} splashLogo
 */
function hideLoginSplashLogo(splashLogo) {
  splashLogo.classList.add("is-hidden");
}

/**
 * Applies header logo center position to splash CSS vars.
 * @param {HTMLElement} splashLogo
 * @param {HTMLElement} headerLogo
 */
function applyLogoTargetPosition(splashLogo, headerLogo) {
  const center = getLogoTargetCenter(headerLogo);
  splashLogo.style.setProperty("--logo-target-left", `${center.left}px`);
  splashLogo.style.setProperty("--logo-target-top", `${center.top}px`);
}

/**
 * Returns center point coordinates for one logo element.
 * @param {HTMLElement} element
 */
function getLogoTargetCenter(element) {
  const rect = element.getBoundingClientRect();
  return { left: rect.left + rect.width / 2, top: rect.top + rect.height / 2 };
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
