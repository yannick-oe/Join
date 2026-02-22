/**
 * Redirects the user to the signup page.
 */
function signUp() {
    window.location.href = "/pages/signup.html"
}

// #region Init
/**
 * Initializes signup page state.
 */
function initSignupPage() {
    if (hasActiveSession()) return window.location.href = "/pages/summary.html";
    clearSignupForm();
    syncSignupPasswordToggle("signupPassword");
    syncSignupPasswordToggle("signupPasswordRepeat");
    setSignupMessage("", "");
}
// #endregion

// #region Submit
/**
 * Handles signup submit event.
 * @param {Event} event
 */
async function handleSignUpSubmit(event) {
    event.preventDefault();
    setSignupButtonDisabled(true);
    const signupData = readSignupForm();
    const validationText = validateSignupForm(signupData);
    if (validationText) return finalizeSignupError(validationText);
    const users = await loadUsers();
    if (isEmailRegistered(users, signupData.email)) return finalizeSignupError("Account already exists.");
    await createAndStoreUser(users, signupData);
    finalizeSignupSuccess(signupData);
}

/**
 * Handles error state in signup flow.
 * @param {string} message
 */
function finalizeSignupError(message) {
    setSignupMessage(message, "error");
    setSignupButtonDisabled(false);
}

/**
 * Handles successful signup state.
 * @param {{name:string,email:string}} signupData
 */
function finalizeSignupSuccess(signupData) {
    setSessionUser(buildSignupSession(signupData));
    showSignupToast();
    setTimeout(() => window.location.href = "/pages/summary.html", 900);
}
// #endregion

// #region Data
/**
 * Creates and stores a user entity.
 * @param {Array} users
 * @param {{name:string,email:string,password:string}} signupData
 */
async function createAndStoreUser(users, signupData) {
    const nextUsers = (users || []).slice();
    nextUsers.push(buildUserEntity(signupData));
    await saveUsers(nextUsers);
}

/**
 * Builds one user entity for storage.
 * @param {{name:string,email:string,password:string}} signupData
 */
function buildUserEntity(signupData) {
    return {
        id: createAuthId("u"),
        name: String(signupData.name || "").trim(),
        email: normalizeAuthEmail(signupData.email),
        password: String(signupData.password || ""),
    };
}

/**
 * Builds session payload from signup data.
 * @param {{name:string,email:string}} signupData
 */
function buildSignupSession(signupData) {
    return {
        id: createAuthId("s"),
        name: String(signupData.name || "").trim(),
        email: normalizeAuthEmail(signupData.email),
    };
}
// #endregion

// #region Validation
/**
 * Reads signup form values.
 */
function readSignupForm() {
    return {
        name: getSignupInputValue("signupName"),
        email: getSignupInputValue("signupEmail"),
        password: getSignupInputValue("signupPassword"),
        passwordRepeat: getSignupInputValue("signupPasswordRepeat"),
        acceptedPrivacy: isSignupCheckboxChecked("signupPrivacy"),
    };
}

/**
 * Validates signup input values.
 * @param {{name:string,email:string,password:string,passwordRepeat:string,acceptedPrivacy:boolean}} signupData
 */
function validateSignupForm(signupData) {
    if (!String(signupData.name || "").trim()) return "Please enter your name.";
    if (!isValidSignupEmail(signupData.email)) return "Please enter a valid email.";
    if (!String(signupData.password || "").trim()) return "Please enter a password.";
    if (String(signupData.password).length < 6) return "Password must contain at least 6 characters.";
    if (signupData.password !== signupData.passwordRepeat) return "Passwords do not match.";
    if (!signupData.acceptedPrivacy) return "Please accept the Privacy Policy.";
    return "";
}

/**
 * Checks whether email already exists.
 * @param {Array} users
 * @param {string} email
 */
function isEmailRegistered(users, email) {
    const normalizedEmail = normalizeAuthEmail(email);
    return (users || []).some((user) => normalizeAuthEmail(user.email) === normalizedEmail);
}

/**
 * Checks whether email has valid syntax.
 * @param {string} email
 */
function isValidSignupEmail(email) {
    const normalized = normalizeAuthEmail(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
// #endregion

// #region UI
/**
 * Shows signup success toast.
 */
function showSignupToast() {
    const toast = document.getElementById("signupToast");
    if (!toast) return;
    toast.classList.remove("hidden");
}

/**
 * Sets signup submit button disabled state.
 * @param {boolean} isDisabled
 */
function setSignupButtonDisabled(isDisabled) {
    const button = document.querySelector(".Sign_up_btn .btn");
    if (!button) return;
    button.disabled = isDisabled;
}

/**
 * Sets signup message content and style.
 * @param {string} message
 * @param {string} type
 */
function setSignupMessage(message, type) {
    const element = document.getElementById("signupMessage");
    if (!element) return;
    element.innerText = message || "";
    element.className = `form_message ${type || ""}`.trim();
}

/**
 * Clears all signup form fields.
 */
function clearSignupForm() {
    setSignupInputValue("signupName", "");
    setSignupInputValue("signupEmail", "");
    setSignupInputValue("signupPassword", "");
    setSignupInputValue("signupPasswordRepeat", "");
    setSignupCheckbox("signupPrivacy", false);
    syncSignupPasswordToggle("signupPassword");
    syncSignupPasswordToggle("signupPasswordRepeat");
}

/**
 * Handles signup password field input.
 * @param {string} fieldId
 */
function handleSignupPasswordInput(fieldId) {
    syncSignupPasswordToggle(fieldId);
}

/**
 * Toggles visibility for one signup password field.
 * @param {string} fieldId
 */
function toggleSignupPasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input || !String(input.value || "").trim()) return;
    input.type = input.type === "password" ? "text" : "password";
    syncSignupPasswordToggle(fieldId);
}

/**
 * Syncs one signup password icon and button state.
 * @param {string} fieldId
 */
function syncSignupPasswordToggle(fieldId) {
    const input = document.getElementById(fieldId);
    const refs = getSignupPasswordRefs(fieldId);
    if (!input || !refs.button || !refs.icon) return;
    const hasValue = !!String(input.value || "").trim();
    refs.button.disabled = !hasValue;
    refs.icon.src = getSignupPasswordIconPath(input.type, hasValue);
}

/**
 * Returns icon/button ids for one signup password field.
 * @param {string} fieldId
 */
function getSignupPasswordRefs(fieldId) {
    if (fieldId === "signupPasswordRepeat") {
        return {
            button: document.getElementById("signupPasswordRepeatToggle"),
            icon: document.getElementById("signupPasswordRepeatIcon"),
        };
    }
    return {
        button: document.getElementById("signupPasswordToggle"),
        icon: document.getElementById("signupPasswordIcon"),
    };
}

/**
 * Resolves signup password icon path by state.
 * @param {string} inputType
 * @param {boolean} hasValue
 */
function getSignupPasswordIconPath(inputType, hasValue) {
    if (!hasValue) return "../assets/icon/lock.svg";
    if (inputType === "text") return "../assets/icon/eye-open.svg";
    return "../assets/icon/eye-closed.svg";
}
// #endregion

// #region Helpers
/**
 * Normalizes email values.
 * @param {string} email
 */
function normalizeAuthEmail(email) {
    return String(email || "").trim().toLowerCase();
}

/**
 * Creates ids for auth entities.
 * @param {string} prefix
 */
function createAuthId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Reads signup input value by id.
 * @param {string} inputId
 */
function getSignupInputValue(inputId) {
    const element = document.getElementById(inputId);
    return element ? element.value : "";
}

/**
 * Writes signup input value by id.
 * @param {string} inputId
 * @param {string} value
 */
function setSignupInputValue(inputId, value) {
    const element = document.getElementById(inputId);
    if (element) element.value = value || "";
}

/**
 * Reads checkbox checked state.
 * @param {string} checkboxId
 */
function isSignupCheckboxChecked(checkboxId) {
    const element = document.getElementById(checkboxId);
    return !!(element && element.checked);
}

/**
 * Sets checkbox checked state.
 * @param {string} checkboxId
 * @param {boolean} checked
 */
function setSignupCheckbox(checkboxId, checked) {
    const element = document.getElementById(checkboxId);
    if (element) element.checked = !!checked;
}
// #endregion