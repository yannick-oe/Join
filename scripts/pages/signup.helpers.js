// #region Signup Helpers
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
