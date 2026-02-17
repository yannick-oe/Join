var realPassword = "";
var maskTimer = null;

function enableSmartPasswordMask(){

  var input = document.getElementById("password");
  if(!input) return;

  input.addEventListener("input", function(e){

    var currentLength = input.value.length;

 
    if(currentLength < realPassword.length){
      realPassword = realPassword.slice(0, currentLength);
    }

    else{
      var newChar = input.value.charAt(currentLength - 1);
      realPassword += newChar;
    }

    if(realPassword.length > 0){
      input.value = "*".repeat(realPassword.length - 1) +
                    realPassword.charAt(realPassword.length - 1);
    }

    if(maskTimer) clearTimeout(maskTimer);

    maskTimer = setTimeout(function(){
      input.value = "*".repeat(realPassword.length);
    }, 1000);
  });
}

window.onload = function(){
  enableSmartPasswordMask();
};
