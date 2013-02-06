jQuery('document').ready(function(){
      
  // Restore saved values
  $('#uid').val(localStorage.uid);
  
    if(localStorage.workStart) {
    $('#workStart').val(localStorage.workStart);
  }else {
      $('#workStart').val("9");
  }
  
  if(localStorage.workEnd) {
    $('#workEnd').val(localStorage.workEnd);
  }else {
      $('#workEnd').val("6");
  }
  
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
	
	var work1 = parseInt($('#workStart').val());
	var work2 = parseInt($('#workEnd').val());
	
	if( work1 >= work2 ){
	document.getElementById("status").style.backgroundColor="red"
	$("#status").html("Work Hours Error: The first number must be lower than the second");
	} else {
	localStorage["workStart"] = $('#workStart').val();
	localStorage["workEnd"] = $('#workEnd').val();
	console.log(localStorage);
    $("#status").html("Options Saved.");
	}
    return false; //don't refresh page
  });
  
});
