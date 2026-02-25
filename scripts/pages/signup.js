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
    syncSignupSubmitState();
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
    syncSignupSubmitState();
}

/**
 * Handles successful signup state.
 * @param {{name:string,email:string}} signupData
 */
function finalizeSignupSuccess(signupData) {
    showSignupToast();
    setTimeout(() => window.location.href = "/index.html", 900);
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
    if (!String(signupData.passwordRepeat || "").trim()) return "Please confirm your password.";
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
    syncSignupSubmitState();
}

/**
 * Handles signup password field input.
 * @param {string} fieldId
 */
function handleSignupPasswordInput(fieldId) {
    syncSignupPasswordToggle(fieldId);
    handleSignupFormChange(fieldId);
}

/**
 * Handles generic signup field updates.
 * @param {string} fieldId
 */
function handleSignupFormChange(fieldId) {
    syncSignupSubmitState();
    if (!fieldId) return;
    clearSignupMessageForValidField(fieldId);
}

/**
 * Handles privacy checkbox state changes.
 */
function handleSignupPrivacyChange() {
    syncSignupSubmitState();
    if (isSignupCheckboxChecked("signupPrivacy")) {
        clearSignupMessageIfFormValid();
        return;
    }
    setSignupMessage("Please accept the Privacy Policy.", "error");
}

/**
 * Handles signup field blur validation.
 * @param {string} fieldId
 */
async function handleSignupFieldBlur(fieldId) {
    const signupData = readSignupForm();
    const validationText = await getSignupFieldValidationMessage(fieldId, signupData);
    if (validationText) {
        setSignupMessage(validationText, "error");
        return;
    }
    clearSignupMessageIfFormValid();
}

/**
 * Syncs signup submit button state based on required fields.
 */
function syncSignupSubmitState() {
    const signupData = readSignupForm();
    const hasName = !!String(signupData.name || "").trim();
    const hasEmail = !!String(signupData.email || "").trim();
    const hasPassword = !!String(signupData.password || "").trim();
    const hasPasswordRepeat = !!String(signupData.passwordRepeat || "").trim();
    const canSubmit = hasName && hasEmail && hasPassword && hasPasswordRepeat;
    setSignupButtonDisabled(!canSubmit);
}

/**
 * Returns one validation message by field id.
 * @param {string} fieldId
 * @param {{name:string,email:string,password:string,passwordRepeat:string,acceptedPrivacy:boolean}} signupData
 */
async function getSignupFieldValidationMessage(fieldId, signupData) {
    if (fieldId === "signupName" && !String(signupData.name || "").trim()) return "Please enter your name.";
    if (fieldId === "signupEmail") {
        if (!String(signupData.email || "").trim()) return "Please enter your email.";
        if (!isValidSignupEmail(signupData.email)) return "Please enter a valid email.";
        const users = await loadUsers();
        if (isEmailRegistered(users, signupData.email)) return "Account already exists.";
    }
    if (fieldId === "signupPassword") {
        if (!String(signupData.password || "").trim()) return "Please enter a password.";
        if (String(signupData.password || "").length < 6) return "Password must contain at least 6 characters.";
    }
    if (fieldId === "signupPasswordRepeat") {
        if (!String(signupData.passwordRepeat || "").trim()) return "Please confirm your password.";
        if (String(signupData.password || "").trim() && signupData.password !== signupData.passwordRepeat) return "Passwords do not match.";
    }
    if (fieldId === "signupPrivacy" && !signupData.acceptedPrivacy) return "Please accept the Privacy Policy.";
    return "";
}

/**
 * Clears signup message when edited field has valid value.
 * @param {string} fieldId
 */
function clearSignupMessageForValidField(fieldId) {
    if (fieldId === "signupName" && String(getSignupInputValue("signupName") || "").trim()) return setSignupMessage("", "");
    if (fieldId === "signupEmail" && isValidSignupEmail(getSignupInputValue("signupEmail"))) return setSignupMessage("", "");
    if (fieldId === "signupPassword" && String(getSignupInputValue("signupPassword") || "").trim()) return setSignupMessage("", "");
    if (fieldId === "signupPasswordRepeat" && String(getSignupInputValue("signupPasswordRepeat") || "").trim()) return setSignupMessage("", "");
    if (fieldId === "signupPrivacy" && isSignupCheckboxChecked("signupPrivacy")) return setSignupMessage("", "");
}

/**
 * Clears signup message when full form is valid.
 */
function clearSignupMessageIfFormValid() {
    const signupData = readSignupForm();
    if (!validateSignupForm(signupData)) setSignupMessage("", "");
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