/*var update = function() {
	habitrpgUrl = "https://habitrpg.com/v1/users/" + jQuery.trim(localStorage.uid) + "/tasks/productivity/"
      jQuery.ajax({
        url: habitrpgUrl,
		data: {apiToken:localStorage.apiToken},
        type: 'POST'
      }).done(function(data){
        console.log(data.delta);
 
      });
    };*/

jQuery('document').ready(function(){


      
  // Restore saved values
	if (localStorage.workStatus == 1){
		document.getElementById("workStatus").innerHTML = "Work Mode: ON";
	}else{
		document.getElementById("workStatus").innerHTML = "Work Mode: OFF";
	}
  

  
  
});
