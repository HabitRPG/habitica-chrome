jQuery('document').ready(function(){
      
  // Restore saved values
  $('#uid').val(localStorage.uid);
  
  if(localStorage.interval) {
    $('#interval').val(localStorage.interval);
  }else {
      $('#interval').val("5");
  }
  
  if(localStorage.viceDomains) {
    $('#viceDomains').val(localStorage.viceDomains);
  }
  
  if(localStorage.goodDomains) {
    $('#goodDomains').val(localStorage.goodDomains);
  }
  
  
    
  // Saves options to localStorage.
  jQuery('#habitrpgForm').submit(function(){
    localStorage["uid"] = $('#uid').val();
	localStorage["interval"] = $('#interval').val();
    localStorage["viceDomains"] = $('#viceDomains').val();
    localStorage["goodDomains"] = $('#goodDomains').val();
    console.log(localStorage);
    $("#status").html("Options Saved.");
    return false; //don't refresh page
  });
  
});
