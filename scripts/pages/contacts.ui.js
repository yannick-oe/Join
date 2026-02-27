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

// Templates moved to contacts.templates.js

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
    prepareEditContactOverlay(contactId, contact);
    applyEditContactOverlayButtons();
    setVisible(contactsDom.contactOverlay, true);
}

/**
 * Prepares contact overlay for edit mode.
 * @param {string} contactId
 * @param {{name:string,color?:string,email?:string,phone?:string}} contact
 */
function prepareEditContactOverlay(contactId, contact) {
    contactsState.editContactId = contactId;
    resetFormErrors();
    setOverlayTitle("Edit contact");
    fillForm(contact);
    setOverlayAvatar(getInitials(contact.name), contact.color || pickColorForName(contact.name));
}

/**
 * Applies edit-mode button visibility in contact overlay.
 */
function applyEditContactOverlayButtons() {
    setVisible(contactsDom.overlayLeftSub, false);
    setVisible(contactsDom.overlayBtnCancel, false);
    setVisible(contactsDom.overlayBtnCreate, false);
    setVisible(contactsDom.overlayBtnDelete, true);
    setVisible(contactsDom.overlayBtnSave, true);
    setText(contactsDom.overlayBtnSave, "Save ✓");
}

/**
 * Closes the overlay.
 */
function closeContactOverlay() {
    setVisible(contactsDom.contactOverlay, false);
}

/**
 * Toggles floating contact action menu on mobile detail view.
 */
function toggleContactMenu() {
    const menu = document.getElementById("contactMenu");
    if (!menu) return;
    menu.classList.toggle("hidden");
}

/**
 * Closes floating contact action menu.
 */
function closeContactMenu() {
    const menu = document.getElementById("contactMenu");
    if (!menu) return;
    menu.classList.add("hidden");
}

/**
 * Opens edit overlay from mobile action menu.
 */
function editContact() {
    closeContactMenu();
    if (!contactsState.activeContactId) return;
    openEditContactOverlay(contactsState.activeContactId);
}

/**
 * Deletes active contact from mobile action menu.
 */
async function deleteContact() {
    closeContactMenu();
    if (!contactsState.activeContactId) return;
    const deleted = await confirmAndDeleteContact(contactsState.activeContactId);
    if (deleted && typeof isContactsMobileViewport === "function" && isContactsMobileViewport()) {
        window.location.href = "./contacts.html";
    }
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