var habitrpgUrl = null;
chrome.extension.sendMessage({method: "getLocalStorage"}, function(response) {
  if (!response.data.uid) {
    console.log("To use the HabitRPG extension, input your UID in the options page.");
    return; //require them to input their UID, else ignore this extension
  } else {  
    options = response.data;
    habitrpgUrl = 'http://habitrpg.com/' + options.uid;
    
    var gritterDefaults = {
      title:'HabitRPG', 
      image: chrome.extension.getURL("img/icon-48.png"),
      sticky: false, // (bool | optional) if you want it to fade out on its own or just sit there
      time: '' // (int | optional) the time you want it to be alive for before fading out
    }
    
    var scoreDown = function() {
      jQuery.gritter.add( 
        jQuery.extend(gritterDefaults, {
          text: '<img src="'+chrome.extension.getURL("img/remove.png")+'" /> (-1 HP) for visiting a vice-website.',
        }) 
      );
      jQuery.ajax({url: habitrpgUrl+'/down'});
    }
    
    var scoreUp = function() {
      jQuery.gritter.add( 
        jQuery.extend(gritterDefaults, {
          text: '<img src="'+chrome.extension.getURL("img/add.png")+'" /> (+1 Exp, GP)',
        }) 
      );
      jQuery.ajax({url: habitrpgUrl+'/up'}); 
    }
    
    var viceDomains = options.viceDomains.split('\n');
    var wwwViceDomains = _.map(viceDomains, function(domain){
      return 'www.'+domain
    });
    var badHosts = viceDomains.concat(wwwViceDomains);
    if (_.include(badHosts, window.location.hostname)) {
      // Dock points once they enter the site, and every 5 minutes they're on the site
      scoreDown();
      setInterval(scoreDown, 300000);
    }
    
    // Give points for completing Workflowy tasks 
    if (window.location.hostname === 'workflowy.com') {
      //TODO: figure out how to catch task completion
      /*document.documentElement.addEventListener('DOMAttrModified', function(e){
        if (e.attrName === 'class') {
          console.log('prevValue: ' + e.prevValue, 'newValue: ' + e.newValue);
        }
      }, false);
      
      document.documentElement.style.display = 'block';*/
    }
  }
});