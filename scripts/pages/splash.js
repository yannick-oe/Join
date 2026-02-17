window.onload = () => {
  moveLogo();
};
/**
 * Move splash logo to header position and redirects to login page.
 * @returns {void} 
 */
function moveLogo() {
  const splash = document.getElementById("splashLogo");
  const target = document.getElementById("headerLogo");
  if (!splash || !target) return;

  const r = target.getBoundingClientRect();

  requestAnimationFrame(() => {
    splash.style.left = (r.left + r.width / 2) + "px";
    splash.style.top  = (r.top + r.height / 2) + "px";
    splash.style.width = r.width + "px";
    splash.style.transform = "translate(-50%, -50%)";
  });

  setTimeout(goToLogin, 500);
}

function goToLogin() {
  window.location.href = "/index.html";
}
