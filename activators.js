
function getTestChrome() {
    var getTablist= function() {
            var tabs = [],
                arr = typeof arguments[0] == 'object' ? arguments[0] : arguments;

            for (var i=0;i<arguments.length;i++)
                tabs.push({url: arr[i]});
            
            return tabs;
        },
        getWinList= function() {
            var wins = [];
            
            for (var i=0;i<arguments.length;i++) {
                wins.push({tabs:getTablist(arguments[i])});
            }

            return wins;
        },
        wins = getWinList(['http://habitrpg.com/', 'http://gruntjs.com', 'http://github.com'], ['http://facebook.com', 'http://9gag.com']);

    return {
        getTablist: getTablist,
        getWinList: getWinList,
        wins: wins,
        tabs: {
            onRemoved: {
                addListener : function(fn) { this.trigger = fn; }
                }
            },
        windows: {
            getAll: function(opt, fn) { fn(wins); }
            }
    };
}
    

var Activators = (function() {

    try {
        if (chrome) var alma = null;
    } catch(e) {
        chrome = getTestChrome();
    } 

    function AlwaysonActivator() {
        this.changeStateFn = undefined;
        this.state = false;
    }
    AlwaysonActivator.prototype.setState = function() { this.changeStateFn(true); };
    AlwaysonActivator.prototype.setChangeStateFn = function(changeStateFn) { 
        this.changeStateFn = function(value) { 
            this.state = value;
            changeStateFn(value);
        }; 
    };


    /*---------------- FromOptionsActivator ------------*/

    function FromOptionsActivator() {}
    FromOptionsActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;

    FromOptionsActivator.prototype.setState = function(value) {
        if (value == 'true') this.changeStateFn(true);
        else if (value == 'false') this.changeStateFn(false);
    };



    /*---------------- PageLinkActivator ------------*/

    function PageLinkActivator(url) {
        this.url = url;

        var self = this;
        chrome.tabs.onRemoved.addListener(function(tabId) {
            self.pageOpened();
        });
    }
    PageLinkActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;

    PageLinkActivator.prototype.setUrl = function(url) {
        this.url = url;
        this.pageOpened();
    };

    PageLinkActivator.prototype.handleSetOptions = function() {
        this.pageOpened();
    };

    PageLinkActivator.prototype.handleNewUrl = function(url) {
        if (this.url.indexOf(url) === 0)
            this.changeStateFn(true);
    };

    PageLinkActivator.prototype.pageOpened = function() {
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

            if(isOpened)
                self.changeStateFn(true);
            else
                self.changeStateFn(false);
        });
        
    };

    return {
            'alwayson': new AlwaysonActivator(),
            'fromOptions': new FromOptionsActivator(),
            'webpage': new PageLinkActivator()
            };

})();
