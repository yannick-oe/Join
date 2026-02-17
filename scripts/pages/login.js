let realPassword = "";
let maskTimer = null;

/**
 * Handles password input updates.
 */
function handlePasswordInput(){
  const i = document.getElementById("password");
  if(!i) return;
  updatePasswordState(i);
  maskPassword(i);
}

/**
 * Updates internal password and handles masking.
 */
function updatePasswordState(i){
  const l = i.value.length;
  realPassword = l < realPassword.length
    ? realPassword.slice(0,l)
    : realPassword + i.value.charAt(l-1);

  i.value = realPassword
    ? "*".repeat(realPassword.length-1) + realPassword.at(-1)
    : "";

  if(maskTimer) clearTimeout(maskTimer);
  maskTimer = setTimeout(()=>i.value="*".repeat(realPassword.length),1000);
}
