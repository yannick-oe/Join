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

// #region Render
/**
 * Renders contacts list and detail panel.
 */
function renderContactsPage() {
    renderContactsList();
    renderContactDetail();
}

/**
 * Renders the grouped contacts list.
 */
function renderContactsList() {
    const sortedContacts = getSortedContacts(contactsState.contacts);
    const letterGroups = buildLetterGroups(sortedContacts);
    setHtml(contactsDom.contactsList, buildContactsListHtml(letterGroups));
}

/**
 * Renders active contact detail or empty state.
 */
function renderContactDetail() {
    const activeContact = findContactById(contactsState.activeContactId);
    const html = activeContact ? getContactDetailTemplate(buildDetailViewModel(activeContact)) : getEmptyDetailTemplate();
    setHtml(contactsDom.contactDetail, html);
}
// #endregion

// #region Templates
/**
 * Builds full list HTML from letter groups.
 * @param {{letter:string,items:{id:string,name:string,email:string,phone?:string,color?:string}[]}[]} letterGroups
 */
function buildContactsListHtml(letterGroups) {
    let html = "";
    for (let index = 0; index < letterGroups.length; index++) {
        html += getLetterGroupTemplate(letterGroups[index]);
    }
    return html;
}

/**
 * Builds HTML for a single group.
 * @param {{letter:string,items:{id:string,name:string,email:string,phone?:string,color?:string}[]}} group
 */
function getLetterGroupTemplate(group) {
    return `
    <div class="letter-group">
      <div class="letter-heading">${group.letter}</div>
      ${buildRowsHtml(group.items)}
    </div>
  `;
}

/**
 * Builds contact rows HTML.
 * @param {{id:string,name:string,email:string,phone?:string,color?:string}[]} contacts
 */
function buildRowsHtml(contacts) {
    let html = "";
    for (let index = 0; index < contacts.length; index++) {
        html += getContactRowTemplate(buildRowViewModel(contacts[index]));
    }
    return html;
}

/**
 * Returns HTML for a single contact row.
 * @param {{id:string,name:string,email:string,initials:string,color:string,selectedClass:string}} row
 */
function getContactRowTemplate(row) {
    return `
    <div class="contact-row ${row.selectedClass}" onclick="selectContact('${row.id}')">
      <div class="contact-avatar" style="background:${row.color}">${row.initials}</div>
      <div class="contact-row-meta">
        <div class="contact-row-name">${row.name}</div>
        <div class="contact-row-email">${row.email}</div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML for empty detail state.
 */
function getEmptyDetailTemplate() {
    return `<div class="contact-detail-empty">Select a contact to view details.</div>`;
}

/**
 * Returns HTML for contact detail panel.
 * @param {{id:string,name:string,email:string,phone:string,initials:string,color:string}} detail
 */
function getContactDetailTemplate(detail) {
    return `
    <div class="contact-detail-top">
      <div class="contact-detail-avatar" style="background:${detail.color}">${detail.initials}</div>
      <div>
        <h2 class="contact-detail-name">${detail.name}</h2>
        <div class="contact-detail-actions">
          <button class="link-button" type="button" onclick="openEditContactOverlay('${detail.id}')">Edit</button>
          <button class="link-button" type="button" onclick="confirmAndDeleteContact('${detail.id}')">Delete</button>
        </div>
      </div>
    </div>

    <div class="contact-detail-block-title">Contact Information</div>
    <div class="contact-info-grid">
      <div class="contact-info-row">
        <div class="contact-info-label">Email</div>
        <div class="contact-info-value">${detail.email}</div>
      </div>
      <div class="contact-info-row">
        <div class="contact-info-label">Phone</div>
        <div class="contact-info-value is-phone">${detail.phone || "—"}</div>
      </div>
    </div>
  `;
}
// #endregion

// #region Overlay UI
/**
 * Opens overlay in "add" mode and resets the form.
 */
function openAddContactOverlay() {
    contactsState.editContactId = null;
    resetFormErrors();
    setOverlayTitle("Add contact");
    fillForm({ name: "", email: "", phone: "" });
    setOverlayAvatar("", "", true);
    setVisible(contactsDom.overlayLeftSub, true);
    setVisible(contactsDom.overlayBtnCancel, true);
    setVisible(contactsDom.overlayBtnCreate, true);
    setVisible(contactsDom.overlayBtnDelete, false);
    setVisible(contactsDom.overlayBtnSave, false);
    setText(contactsDom.overlayBtnCreate, "Create contact ✓");
    setVisible(contactsDom.contactOverlay, true);
} 

/**
 * Opens overlay in "edit" mode and fills the form with contact data.
 * @param {string} contactId
 */
function openEditContactOverlay(contactId) {
    const contact = findContactById(contactId);
    if (!contact) return;

    contactsState.editContactId = contactId;
    resetFormErrors();
    setOverlayTitle("Edit contact");
    fillForm(contact);
    setOverlayAvatar(getInitials(contact.name), contact.color || pickColorForName(contact.name));
    setVisible(contactsDom.overlayLeftSub, false);
    setVisible(contactsDom.overlayBtnCancel, false);
    setVisible(contactsDom.overlayBtnCreate, false);
    setVisible(contactsDom.overlayBtnDelete, true);
    setVisible(contactsDom.overlayBtnSave, true);
    setText(contactsDom.overlayBtnSave, "Save ✓");
    setVisible(contactsDom.contactOverlay, true);
}

/**
 * Closes the overlay.
 */
function closeContactOverlay() {
    setVisible(contactsDom.contactOverlay, false);
}

/**
 * Sets overlay title text.
 * @param {string} title
 */
function setOverlayTitle(title) {
    setText(contactsDom.overlayTitle, title);
}

/**
 * Updates overlay avatar based on current name input.
 * @param {string} name
 */
function updateOverlayAvatarFromName(name) {
    if (!name || name.trim().length === 0) {
        setOverlayAvatar("", "", true);
    } else {
        const initials = getInitials(name) || "AA";
        const color = pickColorForName(name);
        setOverlayAvatar(initials, color, false);
    }
}

/**
 * Sets overlay avatar initials and background, or shows empty state icon.
 * @param {string} initials
 * @param {string} color
 * @param {boolean} isEmpty
 */
function setOverlayAvatar(initials, color, isEmpty) {
    const avatarElement = document.getElementById(contactsDom.overlayAvatar);
    if (!avatarElement) return;
    if (isEmpty) {
        avatarElement.innerHTML = '<img src="../assets/icon/avatar.svg" alt="Avatar" class="overlay-avatar-icon" />';
        avatarElement.style.background = "#d1d1d1";
    } else {
        avatarElement.innerText = initials || "AA";
        avatarElement.style.background = color || "#29abe2";
    }
}
// #endregion

// #region Form UI
/**
 * Reads form inputs into a data object.
 */
function readForm() {
    return {
        name: getInputValue(contactsDom.contactNameInput),
        email: getInputValue(contactsDom.contactEmailInput),
        phone: getInputValue(contactsDom.contactPhoneInput),
    };
}

/**
 * Fills form inputs from a contact object.
 * @param {{name?:string,email?:string,phone?:string}} contact
 */
function fillForm(contact) {
    setInputValue(contactsDom.contactNameInput, contact.name || "");
    setInputValue(contactsDom.contactEmailInput, contact.email || "");
    setInputValue(contactsDom.contactPhoneInput, contact.phone || "");
    updateOverlayAvatarFromName(getInputValue(contactsDom.contactNameInput));
}

/**
 * Shows validation errors under inputs.
 * @param {{name:string,email:string,phone:string}} errors
 */
function showFormErrors(errors) {
    setText(contactsDom.contactNameError, errors.name);
    setText(contactsDom.contactEmailError, errors.email);
    setText(contactsDom.contactPhoneError, errors.phone);
}

/**
 * Clears all form errors and notes.
 */
function resetFormErrors() {
    setText(contactsDom.contactNameError, "");
    setText(contactsDom.contactEmailError, "");
    setText(contactsDom.contactPhoneError, "");
    setText(contactsDom.contactFormNote, "");
}

/**
 * Sets a small note below the form.
 * @param {string} note
 */
function setFormNote(note) {
    setText(contactsDom.contactFormNote, note || "");
}

/**
 * Shows success toast notification.
 */
function showSuccessToast() {
    setVisible(contactsDom.successToast, true);
    setTimeout(() => hideSuccessToast(), 2500);
}

/**
 * Hides success toast notification.
 */
function hideSuccessToast() {
    setVisible(contactsDom.successToast, false);
}

/**
 * Shows edit toast notification.
 */
function showEditToast() {
    setVisible(contactsDom.editToast, true);
    setTimeout(() => hideEditToast(), 2500);
}

/**
 * Hides edit toast notification.
 */
function hideEditToast() {
    setVisible(contactsDom.editToast, false);
}

/**
 * Shows delete toast notification.
 */
function showDeleteToast() {
    setVisible(contactsDom.deleteToast, true);
    setTimeout(() => hideDeleteToast(), 2500);
}

/**
 * Hides delete toast notification.
 */
function hideDeleteToast() {
    setVisible(contactsDom.deleteToast, false);
}
// #endregion