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