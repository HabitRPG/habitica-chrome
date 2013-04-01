var browser = {
    sendMessage: function(data) {
        chrome.extension.sendMessage(data);
    }, 
    getMutationObserver: function(callback) {
        return new WebKitMutationObserver(callback);
    }
};