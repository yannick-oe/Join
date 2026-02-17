/**
 * Stores the real password value internally.
 * The input field only shows masked characters.
 *
 * @type {string}
 */
var realPassword = "";

/**
 * Timer reference for delayed masking.
 *
 * @type {number|null}
 */
var maskTimer = null;


/**
 * Enables custom password masking behavior.
 *
 * Behavior:
 * - Each typed character is visible briefly
 * - After 1 second it is replaced with "*"
 * - Backspace works correctly
 * - Real password is stored in `realPassword`
 *
 * @returns {void}
 */
function enableSmartPasswordMask(){

  var input = document.getElementById("password");
  if(!input) return;

  input.addEventListener("input", function(){

    var currentLength = input.value.length;

    // If user deleted a character
    if(currentLength < realPassword.length){
      realPassword = realPassword.slice(0, currentLength);
    }
    // If user added a character
    else{
      var newChar = input.value.charAt(currentLength - 1);
      realPassword += newChar;
    }

    // Show all characters masked except the last one
    if(realPassword.length > 0){
      input.value =
        "*".repeat(realPassword.length - 1) +
        realPassword.charAt(realPassword.length - 1);
    }

    // Clear previous masking timer
    if(maskTimer) clearTimeout(maskTimer);

    // Mask all characters after delay
    maskTimer = setTimeout(function(){
      input.value = "*".repeat(realPassword.length);
    }, 1000);
  });
}


/**
 * Initializes password masking after page load.
 *
 * @returns {void}
 */
window.onload = function(){
  enableSmartPasswordMask();
};
