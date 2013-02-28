 
var appBridge = chrome.extension.getBackgroundPage().App.dispatcher,
    Browser = {

        changeIcon: function(suffix) {
            chrome.browserAction.setIcon({path: 'img/icon-48'+suffix+'.png'});
        }

    };
