// #region State
const contactsState = {
    contacts: [],
    activeContactId: null,
    editContactId: null,
    pendingDeleteContactId: null,
    deleteConfirmResolver: null,
    palette: ["#FF7A00", "#9327FF", "#6E52FF", "#FC71FF", "#FFBB2B", "#1FD7C1", "#0038FF", "#C3FF2B"],
};

const contactsStorage = {
    activeContactId: "joinActiveContactId",
};
// #endregion

// #region Init
/**
 * Loads contacts, ensures demo data, persists, and renders the page.
 */
async function initContacts() {
    if (typeof initProtectedPageAuth === "function") initProtectedPageAuth();
    contactsState.contacts = await loadContacts();
    ensureDemoContacts();
    hydrateActiveContactId();
    await saveContacts(contactsState.contacts);
    renderContactsPage();
}

/**
 * Creates demo contacts when storage is empty.
 */
function ensureDemoContacts() {
    if (contactsState.contacts && contactsState.contacts.length) return;
    contactsState.contacts = buildContactsDemoList();
}

/**
 * Builds default contacts demo list.
 */
function buildContactsDemoList() {
    return [
        { id: createId(), name: "Anton Mayer", email: "anton@gmail.com", phone: "+49 1111 111 11 11", color: "#FF7A00" }, { id: createId(), name: "Anja Schulz", email: "schulz@hotmail.com", phone: "+49 2222 222 22 22", color: "#9327FF" }, { id: createId(), name: "Benedikt Ziegler", email: "benedikt@gmail.com", phone: "+49 3333 333 33 33", color: "#6E52FF" }, { id: createId(), name: "David Eisenberg", email: "davidberg@gmail.com", phone: "+49 4444 444 44 44", color: "#FC71FF" }, { id: createId(), name: "Eva Fischer", email: "eva@gmail.com", phone: "+49 5555 555 55 55", color: "#FFBB2B" },
        { id: createId(), name: "Emmanuel Mauer", email: "emmanuel@gmail.com", phone: "+49 6666 666 66 66", color: "#1FD7C1" }, { id: createId(), name: "Marcel Bauer", email: "bauer@gmail.com", phone: "+49 7777 777 77 77", color: "#0038FF" }, { id: createId(), name: "Tatjana Wolf", email: "wolf@gmail.com", phone: "+49 2222 222 22 2", color: "#C3FF2B" }, { id: createId(), name: "Sofia Müller", email: "sofia@mail.com", phone: "+49 8888 888 88 88", color: "#29ABE2" }, { id: createId(), name: "Lukas Schneider", email: "lukas@mail.com", phone: "+49 9999 999 99 99", color: "#462F8A" },
    ];
}
// #endregion

// #region Selection
/**
 * Selects a contact by id and rerenders the page.
 * @param {string} contactId
 */
function selectContact(contactId) {
    contactsState.activeContactId = contactId;
    persistActiveContactId();
    if (isContactsListPage() && isContactsMobileViewport()) {
        window.location.href = "./contacts-info.html";
        return;
    }
    renderContactsPage();
}

/**
 * Restores active contact id from session storage.
 */
function hydrateActiveContactId() {
    const storedId = sessionStorage.getItem(contactsStorage.activeContactId);
    if (!storedId) return;
    contactsState.activeContactId = storedId;
}

/**
 * Persists active contact id to session storage.
 */
function persistActiveContactId() {
    if (!contactsState.activeContactId) {
        sessionStorage.removeItem(contactsStorage.activeContactId);
        return;
    }
    sessionStorage.setItem(contactsStorage.activeContactId, contactsState.activeContactId);
}

/**
 * Checks if current page is contacts list page.
 */
function isContactsListPage() {
    return window.location.pathname.endsWith("/contacts.html") || window.location.pathname.endsWith("contacts.html");
}

/**
 * Checks if viewport is in mobile contacts mode.
 */
function isContactsMobileViewport() {
    return window.matchMedia("(max-width: 1140px)").matches;
}
// #endregion

// #region Submit / Save / Delete
/**
 * Validates and saves the current form (add or edit).
 */
async function submitContact() {
    resetFormErrors();
    const contactData = readForm();
    const validation = validateContact(contactData);
    if (validation.hasError) return showFormErrors(validation);
    const isNewContact = saveContactInState(contactData);
    await saveContacts(contactsState.contacts);
    finalizeContactSubmit(isNewContact);
}

/**
 * Saves contact into state and returns whether it is new.
 * @param {{name:string,email:string,phone:string}} contactData
 */
function saveContactInState(contactData) {
    const isNewContact = !contactsState.editContactId;
    if (isNewContact) addContactToState(contactData);
    else updateContactInState(contactsState.editContactId, contactData);
    return isNewContact;
}

/**
 * Finalizes submit ui updates and toast.
 * @param {boolean} isNewContact
 */
function finalizeContactSubmit(isNewContact) {
    closeContactOverlay();
    renderContactsPage();
    if (isNewContact) return showSuccessToast();
    showEditToast();
}

/**
 * Confirms and deletes a contact.
 * @param {string} contactId
 */
async function confirmAndDeleteContact(contactId) {
    const targetContactId = contactId || contactsState.editContactId || contactsState.activeContactId;
    if (!targetContactId) return false;
    contactsState.pendingDeleteContactId = targetContactId;
    setVisible(contactsDom.contactDeleteConfirmOverlay, true);
    return new Promise((resolve) => {
        contactsState.deleteConfirmResolver = resolve;
    });
}

/**
 * Closes custom contact delete-confirm overlay.
 * @param {boolean} confirmed
 */
function closeDeleteContactConfirm(confirmed) {
    setVisible(contactsDom.contactDeleteConfirmOverlay, false);
    contactsState.pendingDeleteContactId = null;
    const resolver = contactsState.deleteConfirmResolver;
    contactsState.deleteConfirmResolver = null;
    if (typeof resolver === "function") resolver(!!confirmed);
}

/**
 * Handles delete confirmation action from custom overlay.
 */
async function confirmDeleteContactAction() {
    const targetContactId = contactsState.pendingDeleteContactId || contactsState.editContactId || contactsState.activeContactId;
    if (!targetContactId) return closeDeleteContactConfirm(false);
    contactsState.editContactId = targetContactId;
    await deleteActiveContact();
    closeDeleteContactConfirm(true);
}

/**
 * Deletes the currently selected contact and persists changes.
 */
async function deleteActiveContact() {
    const contactId = contactsState.editContactId || contactsState.activeContactId;
    if (!contactId) return;
    contactsState.contacts = contactsState.contacts.filter((contact) => contact.id !== contactId);
    updateSelectionAfterDelete(contactId);
    tryRemoveContactFromTasks(contactId);
    await saveContacts(contactsState.contacts);
    closeContactOverlay();
    renderContactsPage();
    showDeleteToast();
}

/**
 * Updates active/edit selection after contact deletion.
 * @param {string} contactId
 */
function updateSelectionAfterDelete(contactId) {
    if (contactsState.editContactId) return clearEditSelection();
    if (contactsState.activeContactId === contactId) contactsState.activeContactId = null;
    persistActiveContactId();
}

/**
 * Clears edit mode selection values.
 */
function clearEditSelection() {
    contactsState.activeContactId = null;
    contactsState.editContactId = null;
    persistActiveContactId();
}

/**
 * Tries to remove a deleted contact from task assignments if task logic is available.
 * This must never block contact persistence or UI feedback.
 * @param {string} contactId
 */
function tryRemoveContactFromTasks(contactId) {
    const globalRemove = window.removeContactFromTasks;
    if (typeof globalRemove !== "function") return;
    try {
        globalRemove(contactId);
    } catch (error) {
        return;
    }
}
// #endregion

// #region State mutations
/**
 * Adds a new contact to the state and activates it.
 * @param {{name:string,email:string,phone:string}} contactData
 */
function addContactToState(contactData) {
    const contactId = createId();
    const name = String(contactData.name || "").trim();
    const email = String(contactData.email || "").trim();
    const phone = String(contactData.phone || "").trim();
    const color = pickColorForName(name);
    contactsState.contacts.push({ id: contactId, name, email, phone, color });
    contactsState.activeContactId = contactId;
}

/**
 * Updates an existing contact in the state and activates it.
 * @param {string} contactId
 * @param {{name:string,email:string,phone:string}} contactData
 */
function updateContactInState(contactId, contactData) {
    const name = String(contactData.name || "").trim();
    const email = String(contactData.email || "").trim();
    const phone = String(contactData.phone || "").trim();
    for (let index = 0; index < contactsState.contacts.length; index++) {
        if (contactsState.contacts[index].id === contactId) {
            const existingColor = contactsState.contacts[index].color;
            const color = existingColor || pickColorForName(name);
            contactsState.contacts[index] = { id: contactId, name, email, phone, color };
        }
    }
    contactsState.activeContactId = contactId;
}
// #endregion