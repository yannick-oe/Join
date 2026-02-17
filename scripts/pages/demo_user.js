const DEMO_EMAIL = "mustermann@gmail.com";
const DEMO_PASS  = "123456";
const SESSION_KEY = "joinSession";

/**
 * Retrieves required login elements from the DOM.
 *
 * @returns {{
 *   email: HTMLInputElement|null,
 *   pass: HTMLInputElement|null,
 *   msg: HTMLElement|null,
 *   group: HTMLElement|null
 * }}
 */
function getLoginInputs(){
  return {
    email: document.getElementById("email"),
    pass:  document.getElementById("password"),
    msg:   document.getElementById("loginMessage"),
    group: document.getElementById("btnGroup")
  };
}

/**
 * Clears login input fields (prevents browser from keeping old values).
 *
 * @param {HTMLInputElement|null} emailInput
 * @param {HTMLInputElement|null} passInput
 * @returns {void}
 */
function clearLoginFields(emailInput, passInput){
  if(emailInput) emailInput.value = "";
  if(passInput)  passInput.value  = "";
}

/**
 * Inserts demo credentials into the login form.
 *
 * @param {HTMLInputElement|null} emailInput
 * @param {HTMLInputElement|null} passInput
 * @returns {boolean}
 */
function fillDemoFields(emailInput, passInput){
  if(!emailInput || !passInput) return false;

  emailInput.setAttribute("name", "demo_email");
  passInput.setAttribute("name", "demo_password");

  emailInput.value = "Guest";
  passInput.value  = "******";

  return true;
}



/**
 * Stores demo user session in localStorage.
 *
 * @returns {void}
 */
function saveDemoSession(){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: DEMO_EMAIL,
    role: "demo",
    ts: Date.now()
  }));
}

/**
 * Displays success message and adjusts layout.
 *
 * @param {HTMLElement|null} msg
 * @param {HTMLElement|null} group
 * @returns {void}
 */
function showSuccess(msg, group){
  if(msg){
    msg.textContent = "Login successful.";
    msg.className = "success";
  }
  if(group){
    group.classList.add("success_active");
  }
}

/**
 * Redirects user to summary page after delay.
 *
 * @returns {void}
 */
function redirectToSummary(){
  setTimeout(function(){
    window.location.href = "../pages/summary.html";
  }, 2500);
}

/**
 * Main demo login handler.
 * - Prevents default form behavior
 * - Fills demo credentials
 * - Saves local session
 * - Shows success message
 * - Redirects user
 *
 * @param {Event} [e]
 * @returns {boolean}
 */
function demoLogin(e){
  if(e) e.preventDefault();

var el = getLoginInputs();
if(!fillDemoFields(el.email, el.pass)) return false;

if(typeof realPassword !== "undefined") realPassword = DEMO_PASS;


  saveDemoSession();
  showSuccess(el.msg, el.group);
  redirectToSummary();

  return true;
}

/**
 * Clears inputs on page load to avoid showing old values after logout/back.
 */
window.onload = function(){
  var el = getLoginInputs();

  if(el.email) el.email.setAttribute("name", "email");
  if(el.pass)  el.pass.setAttribute("name", "passwort");

  clearLoginFields(el.email, el.pass);
};


window.demoLogin = demoLogin;
