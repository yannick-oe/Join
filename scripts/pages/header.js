/**
 * Function to open menu, header
*/
function openMenu() {
    let myDropdown = document.getElementById("myDropdown");
    myDropdown.classList.toggle('d_none');
}

/**
 * Function to close menu, header
 */
function closeMenu() {
    let myDropdown = document.getElementById("myDropdown");
    myDropdown.classList.add('d_none');
}