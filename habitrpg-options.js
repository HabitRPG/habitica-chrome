jQuery('document').ready(function(){
      
  // Restores select box state to saved value from localStorage.
  var uid = localStorage["habitrpg_uid"];
  if (uid) {
    $('#habitrpg-uid').val(uid);
  }
  
  // Saves options to localStorage.
  jQuery('#save').click(function(){
    localStorage["habitrpg_uid"] = $('#habitrpg-uid').val();
    $("#status").html("Options Saved.");
    setTimeout(function() {
      $("#status").html("");
    }, 750);
  });
  
});