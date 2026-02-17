// #region Storage state
const storageState = {
  useFirebase: true,
  firebaseBaseUrl: "https://join-41a54-default-rtdb.europe-west1.firebasedatabase.app/",
  contactsKey: "joinContacts",
  tasksKey: "joinTasks",
};
// #endregion

// #region Public API
/**
 * Loads contacts from the active storage provider.
 */
async function loadContacts() {
  if (!storageState.useFirebase) return loadContactsFromLocal();
  return await loadContactsFromFirebase();
}

/**
 * Saves contacts to the active storage provider.
 * @param {Array} list
 */
async function saveContacts(list) {
  if (!storageState.useFirebase) {
    saveContactsToLocal(list);
    return true;
  }
  return await saveContactsToFirebase(list);
}

/**
 * Loads tasks from the active storage provider.
 */
async function loadTasks() {
  if (!storageState.useFirebase) return loadTasksFromLocal();
  return await loadTasksFromFirebase();
}

/**
 * Saves tasks to the active storage provider.
 * @param {Array} list
 */
async function saveTasks(list) {
  if (!storageState.useFirebase) {
    saveTasksToLocal(list);
    return true;
  }
  return await saveTasksToFirebase(list);
}

/**
 * Removes a contact id from all task team member lists.
 * @param {string} contactId
 */
async function removeContactFromTasks(contactId) {
  if (!contactId) return;
  const tasks = await loadTasks();
  const updatedTasks = removeTeamMemberFromTasks(tasks, contactId);
  await saveTasks(updatedTasks);
}
// #endregion

// #region Local storage
/**
 * Loads contacts from localStorage.
 */
function loadContactsFromLocal() {
  const raw = localStorage.getItem(storageState.contactsKey);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

/**
 * Saves contacts to localStorage.
 * @param {Array} list
 */
function saveContactsToLocal(list) {
  localStorage.setItem(storageState.contactsKey, JSON.stringify(list || []));
}

/**
 * Loads tasks from localStorage.
 */
function loadTasksFromLocal() {
  const raw = localStorage.getItem(storageState.tasksKey);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

/**
 * Saves tasks to localStorage.
 * @param {Array} list
 */
function saveTasksToLocal(list) {
  localStorage.setItem(storageState.tasksKey, JSON.stringify(list || []));
}
// #endregion

// #region Firebase
/**
 * Loads contacts from Firebase Realtime Database.
 */
async function loadContactsFromFirebase() {
  const url = buildFirebaseUrl("contacts.json");
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  if (!data || data.error) return [];
  if (!data) return [];
  const list = Object.values(data).filter((contact) => contact && typeof contact === "object" && contact.id);
  return Array.isArray(list) ? list : [];
}

/**
 * Saves contacts to Firebase Realtime Database.
 * @param {Array} list
 */
async function saveContactsToFirebase(list) {
  const url = buildFirebaseUrl("contacts.json");
  const body = buildFirebaseContactsPayload(list || []);
  const response = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
  return response.ok;
}

/**
 * Loads tasks from Firebase Realtime Database.
 */
async function loadTasksFromFirebase() {
  const url = buildFirebaseUrl("tasks.json");
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  if (!data || data.error) return [];
  return normalizeTasksData(data);
}

/**
 * Saves tasks to Firebase Realtime Database.
 * @param {Array} list
 */
async function saveTasksToFirebase(list) {
  const url = buildFirebaseUrl("tasks.json");
  const body = JSON.stringify(list || []);
  const response = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
  return response.ok;
}

/**
 * Builds the Firebase payload as an object keyed by contact id.
 * @param {Array} list
 */
function buildFirebaseContactsPayload(list) {
  const payload = {};
  for (let index = 0; index < list.length; index++) payload[list[index].id] = list[index];
  return JSON.stringify(payload);
}

/**
 * Builds a normalized Firebase URL for a given path.
 * @param {string} path
 */
function buildFirebaseUrl(path) {
  const baseUrl = String(storageState.firebaseBaseUrl || "").trim();
  if (!baseUrl) return path;
  return (baseUrl.endsWith("/") ? baseUrl : baseUrl + "/") + path;
}

/**
 * Normalizes Firebase tasks payload.
 * @param {Array|Object} data
 */
function normalizeTasksData(data) {
  if (Array.isArray(data)) return data.filter((task) => task && typeof task === "object");
  if (!data || typeof data !== "object") return [];
  return Object.values(data).filter((task) => task && typeof task === "object");
}

/**
 * Removes one team member id from all tasks.
 * @param {Array} tasks
 * @param {string} contactId
 */
function removeTeamMemberFromTasks(tasks, contactId) {
  const list = Array.isArray(tasks) ? tasks : [];
  return list.map((task) => mapTaskWithoutTeamMember(task, contactId));
}

/**
 * Builds one updated task without the removed team member.
 * @param {Object} task
 * @param {string} contactId
 */
function mapTaskWithoutTeamMember(task, contactId) {
  const nextTeamMembers = filterTaskTeamMembers(task.teamMembers, contactId);
  const nextLegacy = filterTaskTeamMembers(task.assignees, contactId);
  return { ...task, teamMembers: nextTeamMembers, assignees: nextLegacy };
}

/**
 * Filters team member ids in a task list.
 * @param {Array} teamMembers
 * @param {string} contactId
 */
function filterTaskTeamMembers(teamMembers, contactId) {
  const list = Array.isArray(teamMembers) ? teamMembers : [];
  return list.filter((memberId) => memberId !== contactId);
}
// #endregion