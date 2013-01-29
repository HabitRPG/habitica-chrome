
var Activators = (function() {

    /* ---------------- Always on activator ------------ */

    function AlwaysActivator(value) {
        this.state = value;
    }
    AlwaysActivator.prototype.init = function(bridge) { this.bridge = bridge; };
    AlwaysActivator.prototype.enable = function() { };
    AlwaysActivator.prototype.disable = function() { };
    AlwaysActivator.prototype.setOptions = function() { };
    AlwaysActivator.prototype.setState = function(value) { 
        this.state = value;
        this.bridge.trigger('changed', this.state);
    };
    

    /*---------------- From options activator ------------*/

    function FromOptionsActivator() { this.state = false; }
    FromOptionsActivator.prototype.init = AlwaysActivator.prototype.init;
    FromOptionsActivator.prototype.enable = AlwaysActivator.prototype.enable;
    FromOptionsActivator.prototype.disable = AlwaysActivator.prototype.disable;
    FromOptionsActivator.prototype.setState = AlwaysActivator.prototype.setState;
    FromOptionsActivator.prototype.setOptions = function(params) {
        this.setState(params.isActive == 'true');
    };

    /*---------------- Page link activator ------------*/

    function PageLinkActivator() {
        this.state = false;
        this.seachForHost();
        this.handleNewHost();
        this.handleClosedHost();
    }
    PageLinkActivator.prototype.init = AlwaysActivator.prototype.init;
    PageLinkActivator.prototype.setState = AlwaysActivator.prototype.setState;
    PageLinkActivator.prototype.enable = function() {
        this.bridge.addListener('newHost', this.handleNewHost);
        this.bridge.addListener('closedHost', this.handleClosedHost);
        // todo implement the trigger's
        this.bridge.addListener('allUrlGetted', this.seachForHost);
        
        this.check();
    };
    PageLinkActivator.prototype.disable = function() {
        this.state = false;
        this.bridge.removeListener('newHost', this.handleNewHost);
        this.bridge.removeListener('closedHost', this.handleClosedHost);

        this.bridge.removeListener('allUrlGetted', this.seachForHost);
    };
    PageLinkActivator.prototype.setOptions = function(params) {
        this.host = params.watchedHost !== undefined ? params.watchedHost : this.host;
        if (this.bridge.hasListener('newHost', this.handleNewHost)) this.check();
    };

    PageLinkActivator.prototype.check = function() {

        this.handleClosedHost(this.host);
    };

    PageLinkActivator.prototype.handleNewHost = function() {
        var self = this;
        this.handleNewHost = function(host) {
            if ((!host && !this.host) || (host && this.host && this.host.indexOf(host) === 0)) {
                this.setState(true);
            }
        };
    };

    PageLinkActivator.prototype.handleClosedHost = function() {
        var self = this;
        this.handleClosedHost = function(host) {
            if (self.host == host ) 
                self.bridge.trigger('getAllUrl');
        };
    };

    PageLinkActivator.prototype.seachForHost = function() {
        var self = this;
        this.seachForHost = function(urls) {
            for (var i=0,len=urls.length;i<len;i++) {
                 if (urls[i].indexOf(self.host) === 0) {
                    self.setState(true);
                    return;
                 }
            }

            self.setState(false);
        };
    };    

     /* ---------------- Days activator ------------ */

    function DaysActivator() {
        this.state = false;
        this.timeOutId = undefined;
        this.check();
    }
    DaysActivator.prototype.init = AlwaysActivator.prototype.init;
    DaysActivator.prototype.setState = AlwaysActivator.prototype.setState;
    DaysActivator.prototype.enable = function(){ this.check(); };
    DaysActivator.prototype.disable = function() { this.timeOutId = clearTimeout(this.timeOutId); };
    DaysActivator.dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DaysActivator.prototype.setOptions = function(params) {
        this.days = params.days ? params.days : this.days;
        if (this.timeOutId) this.check();
    };

    DaysActivator.prototype.check = function(){
        var self = this;
        this.check = function() { 
            self.checkDate(new Date()); 
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

    DaysActivator.prototype.checkDate = function(now) {
        var today = this.days[this.getDayName(now)], t,
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.start[0], today.start[1]),
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), today.end[0], today.end[1]);

        if (start > end) {
            t = start;
            start = end;
            end = t;
        }

        this.setState(false);

        if (today.active && now > start && now < end)
                this.setState(true);

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
