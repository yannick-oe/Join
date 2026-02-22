// #region DOM ids
const contactsDom = {
    contactsList: "contactsList",
    contactDetail: "contactDetail",
    contactOverlay: "contactOverlay",
    overlayTitle: "overlayTitle",
    overlayAvatar: "overlayAvatar",
    overlayLeftSub: "overlayLeftSub",
    overlayBtnCancel: "overlayBtnCancel",
    overlayBtnCreate: "overlayBtnCreate",
    overlayBtnDelete: "overlayBtnDelete",
    overlayBtnSave: "overlayBtnSave",
    contactNameInput: "contactNameInput",
    contactEmailInput: "contactEmailInput",
    contactPhoneInput: "contactPhoneInput",
    contactNameError: "contactNameError",
    contactEmailError: "contactEmailError",
    contactPhoneError: "contactPhoneError",
    contactFormNote: "contactFormNote",
    successToast: "successToast",
    editToast: "editToast",
    deleteToast: "deleteToast",
};
// #endregion

// #region DOM helpers
/**
 * Sets innerHTML of an element by id.
 * @param {string} elementId
 * @param {string} html
 */
function setHtml(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = html || "";
}

/**
 * Sets innerText of an element by id.
 * @param {string} elementId
 * @param {string} text
 */
function setText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.innerText = text || "";
}

/**
 * Reads input value by id.
 * @param {string} elementId
 */
function getInputValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : "";
}

/**
 * Sets input value by id.
 * @param {string} elementId
 * @param {string} value
 */
function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.value = value || "";
}

/**
 * Shows or hides an element by toggling .hidden.
 * @param {string} elementId
 * @param {boolean} shouldShow
 */
function setVisible(elementId, shouldShow) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.classList.toggle("hidden", !shouldShow);
}
// #endregion
