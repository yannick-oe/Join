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
            <div class="letter-group-separator"></div>
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
        <div class="contact-detail-content">
            ${getContactDetailTopTemplate(detail)}
            ${getContactDetailInfoTemplate(detail)}
        </div>
    `;
}

/**
 * Returns top area template for contact detail.
 * @param {{id:string,name:string,initials:string,color:string}} detail
 */
function getContactDetailTopTemplate(detail) {
    return `
        <div class="contact-detail-top">
            <div class="contact-detail-avatar" style="background:${detail.color}">${detail.initials}</div>
            <div>
                <h2 class="contact-detail-name">${detail.name}</h2>
                ${getContactDetailActionsTemplate(detail.id)}
            </div>
        </div>
    `;
}

/**
 * Returns action buttons template for contact detail header.
 * @param {string} contactId
 */
function getContactDetailActionsTemplate(contactId) {
    return `
        <div class="contact-detail-actions">
            <button class="link-button" type="button" onclick="openEditContactOverlay('${contactId}')"><img src="../assets/icon/edit.svg" alt="" aria-hidden="true" />Edit</button>
            <button class="link-button" type="button" onclick="confirmAndDeleteContact('${contactId}')"><img src="../assets/icon/delete.svg" alt="" aria-hidden="true" />Delete</button>
        </div>
    `;
}

/**
 * Returns contact information grid template.
 * @param {{email:string,phone:string}} detail
 */
function getContactDetailInfoTemplate(detail) {
    return `
        <div class="contact-detail-block-title">Contact Information</div>
        <div class="contact-info-grid">
            ${getContactDetailEmailRowTemplate(detail.email)}
            ${getContactDetailPhoneRowTemplate(detail.phone || "—")}
        </div>
    `;
}

/**
 * Returns email row template in detail info grid.
 * @param {string} email
 */
function getContactDetailEmailRowTemplate(email) {
    return `<div class="contact-info-row"><div class="contact-info-label">Email</div><div class="contact-info-value">${email}</div></div>`;
}

/**
 * Returns phone row template in detail info grid.
 * @param {string} phone
 */
function getContactDetailPhoneRowTemplate(phone) {
    return `<div class="contact-info-row"><div class="contact-info-label">Phone</div><div class="contact-info-value is-phone">${phone}</div></div>`;
}
// #endregion