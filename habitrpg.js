var habitrpgUrl = null;
chrome.extension.sendMessage({method: "getLocalStorage"}, function(response) {
  if (!response.data.uid) {
    console.log("To use the HabitRPG extension, input your UID in the options page.");
    return; //require them to input their UID, else ignore this extension
  } else {  
    options = response.data;
    habitrpgUrl = 'http://habitrpg.com/' + options.uid;
    
    var notificationDefaults = {
      title:'HabitRPG', 
      time: 6000
    }
    
    var scoreDown = function(message) {
      notification = jQuery.extend(notificationDefaults, {
        icon: "img/icon-48-down.png", 
        text: "[-1 HP] " + message
      });
      chrome.extension.sendMessage({method: "showNotification", notification: notification}, function(response) {}); 
      jQuery.ajax({url: habitrpgUrl+'/down'});
    }
    
    var scoreUp = function(message) {
      notification = jQuery.extend(notificationDefaults, {
        icon: 'img/icon-48-up.png', 
        text: '[+1 Exp, GP] ' + message
      });
      chrome.extension.sendMessage({method: "showNotification", notification: notification}, function(response) {}); 
      jQuery.ajax({url: habitrpgUrl+'/up'}); 
    }
    
    var viceDomains = options.viceDomains.split('\n');
    var wwwViceDomains = _.map(viceDomains, function(domain){
      return 'www.'+domain
    });
    var badHosts = viceDomains.concat(wwwViceDomains);
    if (_.include(badHosts, window.location.hostname)) {
      // Dock points once they enter the site, and every 5 minutes they're on the site
      scoreDown('Visiting a vice website');
      setInterval(function(){
        scoreDown('Lingering on a vice website');
      }, 300000);
    }
    
    // Give points for completing Workflowy tasks 
    /*if (window.location.hostname === 'workflowy.com') {
      jQuery(".editor").watch('text-decoration', function(){
        console.log(jQuery(this));
      });
    }*/
  }
});