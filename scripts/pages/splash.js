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
  applySplashTargetPosition(splash, target.getBoundingClientRect());
  setTimeout(goToLogin, 500);
}

/**
 * Applies computed target position for splash animation.
 * @param {HTMLElement} splash
 * @param {DOMRect} rect
 */
function applySplashTargetPosition(splash, rect) {
  requestAnimationFrame(() => {
    splash.style.left = (rect.left + rect.width / 2) + "px";
    splash.style.top = (rect.top + rect.height / 2) + "px";
    splash.style.width = rect.width + "px";
    splash.style.transform = "translate(-50%, -50%)";
  });
}

function goToLogin() {
  window.location.href = "/index.html";
}