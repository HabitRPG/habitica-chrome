var update = function() {
	habitrpgUrl = "https://habitrpg.com/v1/users/" + jQuery.trim(localStorage.uid) + "/tasks/productivity/"
      jQuery.ajax({
        url: habitrpgUrl,
		data: {apiToken:localStorage.apiToken},
        type: 'POST'
      }).done(function(data){
        console.log(data.delta);
		        
		
   
      });
    };




jQuery('document').ready(function(){

	update();
      
  // Restore saved values
	if (localStorage.workStatus = 1){
	console.log("lololll");
		document.getElementById("workStatus").innerHTML = "You're in work mode";
	}else{
		document.getElementById("workStatus").innerHTML = "You're not in work mode!";
	}
  

  
  
});
