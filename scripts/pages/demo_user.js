const DEMO_EMAIL = "mustermann@gmail.com";
const DEMO_PASS  = "123456";
const SESSION_KEY = "joinSession";


/**
 * Retrieves required login elements from the DOM.
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
 * Clears login input fields.
 */
function clearLoginFields(emailInput, passInput){
  if(emailInput) emailInput.value = "";
  if(passInput)  passInput.value  = "";
}


/**
 * Inserts demo display values into the login form.
 * Does NOT expose real demo credentials in UI.
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
 * Session is local-only and not server-based.
 */
function saveDemoSession(){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: DEMO_EMAIL,
    role: "demo",
    ts: Date.now()
  }));
}


/**
 * Displays success message and adjusts layout state.
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
 */
function redirectToSummary(){
  setTimeout(() => {
    window.location.href = "../pages/summary.html";
  }, 2500);
}


/**
 * Main demo login handler.
 *
 * Prevent default form behavior
 * Insert guest display values
 * Save local session
 * Show success message
 * Redirect to summary page
 *
 * @param {Event} [e]
 */
function demoLogin(e){
  if(e) e.preventDefault();

  const el = getLoginInputs();
  if(!fillDemoFields(el.email, el.pass)) return false;

  // If smart password masking is active, set internal password
  if(typeof realPassword !== "undefined"){
    realPassword = DEMO_PASS;
  }

  saveDemoSession();
  showSuccess(el.msg, el.group);
  redirectToSummary();

  return true;
}


/**
 * Resets login form state on page load.
 * Restores original input names and clears values.
 */
window.onload = function(){
  const el = getLoginInputs();

  if(el.email) el.email.setAttribute("name", "email");
  if(el.pass)  el.pass.setAttribute("name", "passwort");

  clearLoginFields(el.email, el.pass);
};


window.demoLogin = demoLogin;