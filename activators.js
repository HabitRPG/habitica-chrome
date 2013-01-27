
/* ---------------- ugly hack for testing :( ------------ */

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

    /* ---------------- Always on activator ------------ */

    function AlwaysActivator(value) {
        this.state = value;
        this.enabled = false;
    }
    AlwaysActivator.prototype.setOptions = function() {};
    AlwaysActivator.prototype.deinit = function() { this.enabled = false; };
    AlwaysActivator.prototype.init = function() { this.enabled = true; this.check(); };
    AlwaysActivator.prototype.check = function() { this.changeStateFn(this.state); };
    AlwaysActivator.prototype.getState = function() { return this.enabled ? this.state : false; };
    AlwaysActivator.prototype.setChangeStateFn = function(changeStateFn) { 
        this.changeStateFn = function(value) {
            if (this.enabled) {
                changeStateFn(value);
                this.state = value;
            }
        }; 
    };



    /*---------------- From options activator ------------*/

    function FromOptionsActivator() { this.state = false; }
    FromOptionsActivator.prototype.init = AlwaysActivator.prototype.init;
    FromOptionsActivator.prototype.deinit = AlwaysActivator.prototype.deinit;
    FromOptionsActivator.prototype.getState = AlwaysActivator.prototype.getState;
    FromOptionsActivator.prototype.setChangeStateFn = AlwaysActivator.prototype.setChangeStateFn;
    FromOptionsActivator.prototype.setOptions = function(params) {
        this.state = params.isActive == 'true' ?  true : false;
    };
    FromOptionsActivator.prototype.check = function() {
        this.changeStateFn(this.state);
    };



    /*---------------- Page link activator ------------*/

    function PageLinkActivator() {
        this.state = false;
        var self = this;
        chrome.tabs.onRemoved.addListener(function() { self.check(); });
    }
    PageLinkActivator.prototype.init = AlwaysActivator.prototype.init;
    PageLinkActivator.prototype.deinit = AlwaysActivator.prototype.deinit;
    PageLinkActivator.prototype.getState = AlwaysActivator.prototype.getState;
    PageLinkActivator.prototype.setChangeStateFn = AlwaysActivator.prototype.setChangeStateFn;

    PageLinkActivator.prototype.handleNewUrl = function(url) {
        if (!url && !this.url)
            this.changeStateFn(true);
        else if (url && this.url && this.url.indexOf(url) === 0)
            this.changeStateFn(true);
    };

    PageLinkActivator.prototype.setOptions = function(params) {
        this.url = params.watchedUrl !== undefined ? params.watchedUrl : this.url;
    };

    PageLinkActivator.prototype.check = function() {
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
        this.state = false;
        this.timeOutId = -1;
        this.check();
    }
    DaysActivator.prototype.init = AlwaysActivator.prototype.init;
    DaysActivator.prototype.getState = AlwaysActivator.prototype.getState;
    DaysActivator.prototype.setChangeStateFn = AlwaysActivator.prototype.setChangeStateFn;
    DaysActivator.prototype.deinit = function() { this.enabled = false; clearTimeout(this.timeOutId); };
    DaysActivator.dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DaysActivator.prototype.setOptions = function(params) {
        this.days = params.days ? params.days : this.days;
    };

    DaysActivator.prototype.check = function(){
        var self = this;
        this.check = function() { 
            self.setState(new Date()); 
        };
    };

    DaysActivator.prototype.getDayName = function(date) {
        return DaysActivator.dayList[date.getDay() === 0 ? 6 : date.getDay()-1];
    };

    DaysActivator.prototype.getNextDayName = function(date) {
        return DaysActivator.dayList[date.getDay() === 6 ? 0 : date.getDay()];
    };

    DaysActivator.prototype.offsetToNextStart = function(now, what) {
        var next = this.days[this.getNextDayName(now)];

        what.setDate(what.getDate() + 1);
        what.setHours( next.start[0]);
        what.setMinutes( next.start[1]);

    };

    DaysActivator.prototype.getTimeoutTime = function(now, start, end) {
         // before today start time
        if (now < start) {
            this.timeoutTime = start.getTime() - now.getTime() + 100;
            
        } else {
            // beyond today end time
            if ( now > end) 
                this.offsetToNextStart(now, end);
            
            this.timeoutTime = end.getTime() - now.getTime() + 100;
        }

        return this.timeoutTime;
        
    };    

    DaysActivator.prototype.setState = function(now) {
        var today = this.days[this.getDayName(now)], t,
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.start[0], today.start[1]),
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.end[0], today.end[1]);

        if (start > end) {
            t = start;
            start = end;
            end = t;
        }

        this.changeStateFn(false);

        if (today.active && now > start && now < end)
                this.changeStateFn(true);

        else if (!today.active)
            this.offsetToNextStart(now, start);
        
        clearTimeout(this.timeOutId);
        this.timeOutId = setTimeout(this.check, this.getTimeoutTime(now, start, end));
    };


    /* ---------------- Return -------------------- */

    return {
        'days': new DaysActivator(),
        'webpage': new PageLinkActivator(),
        'alwayson': new AlwaysActivator(true),
        'alwaysoff': new AlwaysActivator(false),
        'fromOptions': new FromOptionsActivator()
        };

})();
