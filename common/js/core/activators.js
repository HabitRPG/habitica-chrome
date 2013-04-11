
var Activators = (function() {

    /* ---------------- Always on activator ------------ */

    function AlwaysActivator(value) {
        this.state = value;
    }
    AlwaysActivator.prototype.init = function(bridge) { this.bridge = bridge; };
    AlwaysActivator.prototype.enable = function() { this.setState(this.state); };
    AlwaysActivator.prototype.disable = function() { };
    AlwaysActivator.prototype.setOptions = function() { };
    AlwaysActivator.prototype.setState = function(value) {
        this.bridge.trigger('watcher.activator.changed', value);
        this.state = value;
    };

    /*---------------- Page link activator ------------*/

    function PageLinkActivator() {
        this.state = false;
        this.handleNewUrl();
        this.isOpenedHandler();
        this.handleClosedUrl();
    }
    PageLinkActivator.prototype.init = AlwaysActivator.prototype.init;
    PageLinkActivator.prototype.setState = AlwaysActivator.prototype.setState;
    PageLinkActivator.prototype.enable = function() {
        this.bridge.addListener('app.firstOpenedUrl', this.handleNewUrl);
        this.bridge.addListener('app.lastClosedUrl', this.handleClosedUrl);
        this.bridge.addListener('app.isOpened', this.isOpenedHandler);

        this.check();
    };
    PageLinkActivator.prototype.disable = function() {
        this.state = false;
        this.bridge.removeListener('app.firstOpenedUrl', this.handleNewUrl);
        this.bridge.removeListener('app.lastClosedUrl', this.handleClosedUrl);
    };
    PageLinkActivator.prototype.setOptions = function(params) {
        this.url = params.watchedUrl !== undefined ? params.watchedUrl : this.url;
    };

    PageLinkActivator.prototype.isWachedFocusLost = function(url) {
        return !url && !this.url;
    };

    PageLinkActivator.prototype.isWatchedUrl = function(url) {
        return url && this.url && url.indexOf(this.url) === 0;
    };

    PageLinkActivator.prototype.check = function() {
        this.bridge.trigger('app.isOpenedUrl', this.url);
    };

    PageLinkActivator.prototype.isOpenedHandler = function() {
        var self = this;
        this.isOpenedHandler = function() {
            self.setState(true);
        };
    };

    PageLinkActivator.prototype.handleNewUrl = function() {
        var self = this;
        this.handleNewUrl = function(url) {
            if (!self.url)
                if (self.isWachedFocusLost(url))
                    self.setState(true);
                else
                    self.setState(false);

            else if (self.isWatchedUrl(url))
                self.setState(true);

        };
    };

    PageLinkActivator.prototype.handleClosedUrl = function() {
        var self = this;
        this.handleClosedUrl = function(url) {
            if (self.isWachedFocusLost(url)) self.setState(false);
            else if (self.isWatchedUrl(url)) self.setState(false);
        };
    };

     /* ---------------- Days activator ------------ */

    function DaysActivator() {
        this.state = false;
        this.timeOutId = undefined;
    }
    DaysActivator.prototype.init = AlwaysActivator.prototype.init;
    DaysActivator.prototype.setState = AlwaysActivator.prototype.setState;
    DaysActivator.prototype.enable = function(){ this.check(); };
    DaysActivator.prototype.disable = function() { this.timeOutId = clearTimeout(this.timeOutId); };
    DaysActivator.dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DaysActivator.prototype.setOptions = function(params) {
        this.days = params.days ? params.days : this.days;

        if (this.state) this.check();
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

    /* ---------------- Tomatoes activator ------------ */

    function TomatoesActivator(value) {
        this.state = value;
        this.stopHandler();
        this.startHandler();
    }
    TomatoesActivator.prototype.init = AlwaysActivator.prototype.init;
    TomatoesActivator.prototype.setState = AlwaysActivator.prototype.setState;
    TomatoesActivator.prototype.setOptions = AlwaysActivator.prototype.setOptions;
    TomatoesActivator.prototype.enable = function(){
        this.bridge.addListener('tomatoes.reset', this.stopHandler);
        this.bridge.addListener('tomatoes.stopped', this.stopHandler);
        this.bridge.addListener('tomatoes.pom.started', this.startHandler);
    };
    TomatoesActivator.prototype.disable = function() {
        this.bridge.removeListener('tomatoes.reset', this.stopHandler);
        this.bridge.removeListener('tomatoes.stopped', this.stopHandler);
        this.bridge.removeListener('tomatoes.pom.started', this.startHandler);
    };
    TomatoesActivator.prototype.stopHandler = function() {
        var self = this;
        this.stopHandler = function(data) {
            self.bridge.trigger('watcher.swapHosts', false);
            self.setState(false);
        };
    };
    TomatoesActivator.prototype.startHandler = function() {
        var self = this;
        this.startHandler = function(data) {
            self.bridge.trigger('watcher.swapHosts', data.type == 'break');
            self.setState(true);
        };
    };

    /* ---------------- Return -------------------- */

    return {
        'days': new DaysActivator(),
        'webpage': new PageLinkActivator(),
        'tomatoes': new TomatoesActivator(),
        'alwayson': new AlwaysActivator(true),
        'alwaysoff': new AlwaysActivator(false)
        };

})();
