var habitrpgUrl = null;
chrome.extension.sendMessage({method: "getLocalStorage"}, function(response) {
  if (!response.data.uid) {
    console.log("To use the HabitRPG extension, input your UID in the options page.");
    return; //require them to input their UID, else ignore this extension
  } else {  
    var options = response.data,
      habitrpgUrl = "https://habitrpg.com/users/" + options.uid + "/tasks/productivity",
      notificationDefaults = {
        title:'HabitRPG', 
        time: 5000
      };

    var scoreDown = function(message) {
      jQuery.ajax({
        url: habitrpgUrl + '/down',
        type: 'POST'
      }).done(function(data){
        var notification = jQuery.extend(notificationDefaults, {
          icon: "img/icon-48-down.png", 
          text: "[" + data.delta.toFixed(2) + " HP] " + message
        });
        chrome.extension.sendMessage({method: "showNotification", notification: notification}, function(response) {}); 
      });
    };
    
    var scoreUp = function(message) {
      jQuery.ajax({
        url: habitrpgUrl + '/up',
        type: 'POST'
      }).done(function(data){
        var notification = jQuery.extend(notificationDefaults, {
          icon: 'img/icon-48-up.png', 
          text: '[' + data.delta.toFixed(2) + ' Exp, GP] ' + message
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