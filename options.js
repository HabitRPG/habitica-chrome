jQuery('document').ready(function(){
      
  // Restore saved values
  $('#uid').val(localStorage.uid);
  if(localStorage.viceDomains) {
    $('#viceDomains').val(localStorage.viceDomains);
  }
  
  // Saves options to localStorage.
  jQuery('#habitrpgForm').submit(function(){
    localStorage["uid"] = $('#uid').val();
    localStorage["viceDomains"] = $('#viceDomains').val();
    console.log(localStorage);
    $("#status").html("Options Saved.");
    return false; //don't refresh page
  });
  
});