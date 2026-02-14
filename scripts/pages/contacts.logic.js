// #region State
const contactsState = {
    contacts: [],
    activeContactId: null,
    editContactId: null,
    palette: ["#FF7A00", "#9327FF", "#6E52FF", "#FC71FF", "#FFBB2B", "#1FD7C1", "#0038FF", "#C3FF2B"],
};
// #endregion

// #region Init
/**
 * Loads contacts, ensures demo data, persists, and renders the page.
 */
async function initContacts() {
    contactsState.contacts = await loadContacts();
    ensureDemoContacts();
    await saveContacts(contactsState.contacts);
    renderContactsPage();
}

/**
 * Creates demo contacts when storage is empty.
 */
function ensureDemoContacts() {
    if (contactsState.contacts && contactsState.contacts.length) return;

    contactsState.contacts = [
        { id: createId(), name: "Anton Mayer", email: "anton@gmail.com", phone: "+49 1111 111 11 11", color: "#FF7A00" },
        { id: createId(), name: "Anja Schulz", email: "schulz@hotmail.com", phone: "+49 2222 222 22 22", color: "#9327FF" },
        { id: createId(), name: "Benedikt Ziegler", email: "benedikt@gmail.com", phone: "+49 3333 333 33 33", color: "#6E52FF" },
        { id: createId(), name: "David Eisenberg", email: "davidberg@gmail.com", phone: "+49 4444 444 44 44", color: "#FC71FF" },
        { id: createId(), name: "Eva Fischer", email: "eva@gmail.com", phone: "+49 5555 555 55 55", color: "#FFBB2B" },
        { id: createId(), name: "Emmanuel Mauer", email: "emmanuel@gmail.com", phone: "+49 6666 666 66 66", color: "#1FD7C1" },
        { id: createId(), name: "Marcel Bauer", email: "bauer@gmail.com", phone: "+49 7777 777 77 77", color: "#0038FF" },
        { id: createId(), name: "Tatjana Wolf", email: "wolf@gmail.com", phone: "+49 2222 222 22 2", color: "#C3FF2B" },
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
    renderContactsPage();
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
    const isNewContact = !contactsState.editContactId;
    if (contactsState.editContactId) updateContactInState(contactsState.editContactId, contactData);
    else addContactToState(contactData);
    await saveContacts(contactsState.contacts);
    closeContactOverlay();
    renderContactsPage();
    if (isNewContact) showSuccessToast();
    else showEditToast();
}

/**
 * Confirms and deletes a contact.
 * @param {string} contactId
 */
async function confirmAndDeleteContact(contactId) {
    const confirmed = window.confirm("Delete this contact?");
    if (!confirmed) return;
    if (contactId) contactsState.editContactId = contactId;
    await deleteActiveContact();
}

/**
 * Deletes the currently selected contact and persists changes.
 */
async function deleteActiveContact() {
    const contactId = contactsState.editContactId || contactsState.activeContactId;
    if (!contactId) return;
    contactsState.contacts = contactsState.contacts.filter((contact) => contact.id !== contactId);
    if (contactsState.editContactId) {
        contactsState.activeContactId = null;
        contactsState.editContactId = null;
    } else if (contactsState.activeContactId === contactId) {
        contactsState.activeContactId = null;
    }
    tryRemoveContactFromTasks(contactId);
    await saveContacts(contactsState.contacts);
    closeContactOverlay();
    renderContactsPage();
    showDeleteToast();
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
        console.error("Failed to remove contact from tasks:", error);
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

// #region List helpers
/**
 * Returns a sorted copy of contacts (by name).
 * @param {{id:string,name:string,email:string,phone?:string,color?:string}[]} contacts
 */
function getSortedContacts(contacts) {
    const copy = (contacts || []).slice();
    copy.sort((a, b) => normalizeName(a.name).localeCompare(normalizeName(b.name)));
    return copy;
}

/**
 * Builds groups by first letter: [{letter, items[]}].
 * @param {{id:string,name:string,email:string,phone?:string,color?:string}[]} contacts
 */
function buildLetterGroups(contacts) {
    const groups = [];
    for (let index = 0; index < contacts.length; index++) {
        const letter = getFirstLetter(contacts[index].name);
        const groupIndex = findGroupIndex(groups, letter);
        if (groupIndex === -1) groups.push({ letter, items: [contacts[index]] });
        else groups[groupIndex].items.push(contacts[index]);
    }
    return groups;
}

/**
 * Finds the index of a group by letter.
 * @param {{letter:string,items:{id:string,name:string,email:string,phone?:string,color?:string}[]}[]} groups
 * @param {string} letter
 */
function findGroupIndex(groups, letter) {
    for (let index = 0; index < groups.length; index++) {
        if (groups[index].letter === letter) return index;
    }
    return -1;
}
// #endregion

// #region View models
/**
 * Builds UI data for a contact row.
 * @param {{id:string,name:string,email:string,color?:string}} contact
 */
function buildRowViewModel(contact) {
    return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        initials: getInitials(contact.name),
        color: contact.color || "#29abe2",
        selectedClass: contactsState.activeContactId === contact.id ? "is-selected" : "",
    };
}

/**
 * Builds UI data for the detail panel.
 * @param {{id:string,name:string,email:string,phone:string,color?:string}} contact
 */
function buildDetailViewModel(contact) {
    return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        initials: getInitials(contact.name),
        color: contact.color || "#29abe2",
    };
}
// #endregion

// #region Validation
/**
 * Validates contact input data and returns field errors.
 * @param {{name:string,email:string,phone:string}} contactData
 */
function validateContact(contactData) {
    const result = { hasError: false, name: "", email: "", phone: "" };
    if (!isValidName(contactData.name)) result.name = "Please enter a name.";
    if (!isValidEmail(contactData.email)) result.email = "Please enter a valid email.";
    if (!isValidPhone(contactData.phone)) result.phone = "Please enter a valid phone number.";
    result.hasError = !!(result.name || result.email || result.phone);
    return result;
}

/**
 * Checks if the name is long enough.
 * @param {string} name
 */
function isValidName(name) {
    const normalized = String(name || "").trim();
    return normalized.length >= 2;
}

/**
 * Checks if the email looks valid.
 * @param {string} email
 */
function isValidEmail(email) {
    const normalized = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

/**
 * Checks if phone contains only allowed characters
 * @param {string} phone
 */
function isValidPhone(phone) {
    const normalized = String(phone || "").trim();
    if (!normalized) return true;
    return /^[+0-9()\s-]{6,}$/.test(normalized);
}
// #endregion

// #region Lookup / text / ids
/**
 * Finds a contact by id in state.
 * @param {string|null} contactId
 */
function findContactById(contactId) {
    if (!contactId) return null;
    for (let index = 0; index < contactsState.contacts.length; index++) {
        if (contactsState.contacts[index].id === contactId) return contactsState.contacts[index];
    }
    return null;
}

/**
 * Normalizes a name for sorting.
 * @param {string} name
 */
function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
}

/**
 * Returns the first letter for grouping (A-Z or #).
 * @param {string} name
 */
function getFirstLetter(name) {
    const normalized = String(name || "").trim();
    if (!normalized) return "#";
    const firstChar = normalized[0].toUpperCase();
    const isLetter = firstChar >= "A" && firstChar <= "Z";
    return isLetter ? firstChar : "#";
}

/**
 * Returns up to two initials for a name.
 * @param {string} name
 */
function getInitials(name) {
    const normalized = String(name || "").trim();
    if (!normalized) return "";
    const parts = normalized.split(" ").filter((part) => part.trim().length);
    const first = parts[0] ? parts[0][0].toUpperCase() : "";
    const second =
        parts.length > 1
            ? parts[parts.length - 1][0].toUpperCase()
            : parts[0] && parts[0][1]
                ? parts[0][1].toUpperCase()
                : "";
    return (first + second).slice(0, 2);
}

/**
 * Creates a simple unique id.
 */
function createId() {
    return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

/**
 * Picks a stable color for a name.
 * @param {string} name
 */
function pickColorForName(name) {
    const index = hashString(String(name || "")) % contactsState.palette.length;
    return contactsState.palette[index] || "#29abe2";
}

/**
 * Hashes a string into a stable integer.
 * @param {string} text
 */
function hashString(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    return hash;
}
// #endregion