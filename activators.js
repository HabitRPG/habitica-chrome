

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

    PageLinkActivator.prototype.handleNewUrl = function(url) {
        if (!url && !this.url)
            this.changeStateFn(true);
        else if (url && this.url && this.url.indexOf(url) === 0)
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

     /* ---------------- Days activator ------------ */

    function DaysActivator() {
        this.days = undefined;
        this.today = undefined;

        this.runLookForActivationTime();
    }
    DaysActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;
    DaysActivator.dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DaysActivator.prototype.setDays = function(days) {
        this.days = days;
        this.lookForActivationTime();
    };

    DaysActivator.prototype.runLookForActivationTime = function(){
        var self = this;
        this.runLookForActivationTime = function() { 
            self.lookForActivationTime(); 
        };
    };

    DaysActivator.prototype.lookForActivationTime = function() {
        var now = new Date();
        var today = this.days[DaysActivator.dayList[now.getDay()-1]];

        this.changeStateFn(false);

        if (today.active) {
            var st = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.start[0], today.start[1]),
                et = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.end[0], today.end[1]);
                if (st > et) {
                    var t = st;
                    st = et;
                    et = s;
                }
            // before today start time
            if (now < st) {
                setTimeout(this.runLookForActivationTime, st.getTime() - now.getTime() + 100);

            } else {
                // beyond today end time
                if ( now > et) {
                    et.setDate(et.getDate() + 1);
                    today = this.days[DaysActivator.dayList[now.getDay() > DaysActivator.dayList.length ? 0 : now.getDay()]];
                    et.setHours( today.start[0]);
                    et.setMinutes( today.start[1]);

                } else {
                    // between the range
                    this.changeStateFn(true);        
                }

                setTimeout(this.runLookForActivationTime, et.getTime() - now.getTime() + 100);

            }
        }
    };

    /* ---------------- Return -------------------- */

    return {
            'days': new DaysActivator(),
            'webpage': new PageLinkActivator(),
            'alwayson': new AlwaysonActivator(),
            'fromOptions': new FromOptionsActivator()
            };

})();
