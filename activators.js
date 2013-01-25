
function AlwaysonActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
}
FromOptionsActivator.prototype.setState = function() { this.changeStateFn(true); };



/*---------------- FromOptionsActivator ------------*/

function FromOptionsActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
}

FromOptionsActivator.prototype.setState = function(value) {
    if (value == 'true') this.changeStateFn(true);
    else if (value == 'false') this.changeStateFn(false);
};



/*---------------- PageLinkActivator ------------*/

function PageLinkActivator(changeStateFn, url) {
    this.url = url;
    this.changeStateFn = changeStateFn;
    this.isOpened = this.pageIsOpened();

    if (this.isOpened)
        this.changeStateFn(true);
    else 
        this.changeStateFn(false);

    
    chrome.tabs.onRemoved.addListener(function(tabId) {});
}

PageLinkActivator.prototype.handleUrl = function(url) {
    if (url.indexOf(this.url) === 0) {

    }
};

PageLinkActivator.prototype.pageIsOpened = function() {
    var self = this, host, win, tab, isOpened = false;

    chrome.windows.getAll({populate:true}, function(windows){
        for (var wi in windows) {
            win = windows[wi];
            for (var ti in win.tabs) {
                tab = win.tabs[ti];
                if (tab.url.indexOf(self.url) === 0) {
                    isOpened = true;
                    break;
                }
            }

            if (isOpened) break;
        }
    });

    return isOpened;
};