function setCookie(name,value,mins) {
	if (mins) {
		var date = new Date();
		date.setTime(date.getTime()+(mins*60*1000));
		var expires = "; expires="+date;
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}
		
function getCookie(c_name){
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++)
	{
	x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
	y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
	x=x.replace(/^\s+|\s+$/g,"");
	if (x==c_name)
    {
    return unescape(y);
    }
  }
}



var habitrpgUrl = null;
chrome.extension.sendMessage({method: "getLocalStorage"}, function(response) {
  if (!response.data.uid) {
    alert("To use the HabitRPG extension, input your UID in the options page.");
    return; //require them to input their UID, else ignore this extension
  } else {
    var options = response.data,
      habitrpgUrl = "https://habitrpg.com/users/" + jQuery.trim(options.uid) + "/tasks/productivity",
      notificationDefaults = {
        title:'HabitRPG', 
        time: 3000
      };

    var score = function(direction, message) {
      jQuery.ajax({
        url: habitrpgUrl + '/' + direction,
        type: 'POST'
      }).done(function(data){
        
		var effectedStats = 'HP';
        if (direction==='up') {
          effectedStats = 'Exp, GP';
        }
        
		var notification = jQuery.extend(notificationDefaults, {
          icon: "/img/icon-48-" + direction + ".png", 
          text: "[" + data.delta.toFixed(2) + " " + effectedStats + "] " + message
        });
        chrome.extension.sendMessage({method: "showNotification", notification: notification}, function(response) {}); 
      });
    }

	// Variables for Bad Domains
    var viceDomains = options.viceDomains.split('\n');
    var wwwViceDomains = _.map(viceDomains, function(domain){
      return 'www.'+domain
    });
    var badHosts = viceDomains.concat(wwwViceDomains);

	// Variables for Good Domains
	var goodDomains = options.goodDomains.split('\n');
    var wwwgoodDomains = _.map(goodDomains, function(domain){
      return 'www.'+domain
    });
    var goodHosts = goodDomains.concat(wwwgoodDomains);

		if (_.include(badHosts, window.location.hostname)) {
      // Dock points once they enter the site, and every 5 minutes they're on the site
     if(getCookie(window.location.hostname + "_firstVisit") == "1"){
		setCookie(window.location.hostname+ "_firstVisit", 1 ,5);
			
			console.log("Been on the website in the last 5mins.");
		}
		//Not been on site before
		else{
			//setCookie(window.location.hostname + "_firstVisit", 1 ,5);
			//console.log("Cookies Made for website" + window.location.hostname);
			//score('up', 'Visiting a productive website'); 
			setCookie(window.location.hostname+ "_firstVisit", 1 ,5);
			chrome.extension.sendMessage({method: "newSite", site: window.location.hostname, protocol: window.location.protocol, direction: "down"}, function(response) {});
			
		}
		} else if(_.include(goodHosts, window.location.hostname)){
	  // Score points once they enter the site, and every 5 minutes they're on the site
		//Been on site before
		if(getCookie(window.location.hostname + "_firstVisit") == "1"){
			setCookie(window.location.hostname+ "_firstVisit", 1 ,5);
			console.log("Been on the website in the last 5mins.");
		}
		//Not been on site before
		else{
			//setCookie(window.location.hostname + "_firstVisit", 1 ,5);
			setCookie(window.location.hostname+ "_firstVisit", 1 ,5);
			console.log("Cookies Made for website as first visit" + window.location.hostname);
			//score('up', 'Visiting a productive website'); 
			chrome.extension.sendMessage({method: "newSite", site: window.location.hostname, protocol: window.location.protocol, direction: "up"}, function(response) {});
			
		}
		
	  }
	  
    // Give points for completing Workflowy tasks 
    /*if (window.location.hostname === 'workflowy.com') {
      jQuery(".editor").watch('text-decoration', function(){
        console.log(jQuery(this));
      });
    }*/
  }
});
