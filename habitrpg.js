var habitrpgUrl = null;
chrome.extension.sendMessage({method: "getLocalStorage"}, function(response) {
  if (!response.data.uid) {
    console.log("To use the HabitRPG extension, input your UID in the options page.");
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

    var viceDomains = options.viceDomains.split('\n');
    var wwwViceDomains = _.map(viceDomains, function(domain){
      return 'www.'+domain
    });
    var badHosts = viceDomains.concat(wwwViceDomains);
    if (_.include(badHosts, window.location.hostname)) {
      // Dock points once they enter the site, and every 5 minutes they're on the site
      score('down', 'Visiting a vice website');
      setInterval(function(){
        score('down', 'Lingering on a vice website');
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