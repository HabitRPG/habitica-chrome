 
var appBridge = chrome.extension.getBackgroundPage().App.dispatcher,
    saveSiteWatcherState = function(state) {
        chrome.extension.getBackgroundPage().App.storage.set({siteWatcherIsActive: state});
    };

    