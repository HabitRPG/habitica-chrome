var defaultOptions = {
      uid:'',
      watchedUrl: '',
      sendInterval: '25',
      activatorName: 'alwayon',
      siteWatcherIsActive: 'true',
      tomatoesIsActive: 'true',
      viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
      goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org',
      days: {
          'Monday': { 
              active: true,
              start: [8,0], end: [16,30]
            },
          'Tuesday': { 
              active: true,
              start: [8,0], end: [16,30]
            },
          'Wednesday': { 
              active: true,
              start: [8,0], end: [16,30]
            },
          'Thursday': { 
              active: true,
              start: [8,0], end: [16,30]
            },
          'Friday': { 
              active: true,
              start: [8,0], end: [16,30]
            },
          'Saturday': { 
              active: false,
              start: [8,0], end: [16,30]
            },
          'Sunday': { 
              active: false,
              start: [8,0], end: [16,30]
            }
        }
  };

var utilies = (function(){


    /* ----------------- Event system ---------------- */
    function EventDispatcher(context) {
        this.listeners = {};
        this.context = context ? context : this;
    }
    EventDispatcher.prototype.addListener= function(type, fn) {
        if (!this.listeners[type])
            this.listeners[type] = [];

        if (this.listeners[type].indexOf(fn) != -1 ) return;

        this.listeners[type].push(fn);
    };
    EventDispatcher.prototype.removeListener = function(type, fn) {
        if (!this.listeners[type]) return;

        var index = this.listeners[type].indexOf(fn);

        if (index === -1) return;
        
        this.listeners[type].splice(index, 1);
        
    };
    EventDispatcher.prototype.hasListener = function(type, fn) {
        if (!this.listeners[type]) return false;
        return this.listeners[type].indexOf(fn) !== -1;
    };
    EventDispatcher.prototype.trigger = function(type, data) {
        if (!this.listeners[type]) return;

        var listeners = this.listeners[type];
        for (var i=0,len=listeners.length;i<len;i++)
            listeners[i].apply(this.context, [data]);
    };


    /* ----------------- Time Period ---------------- */
    function Period(length, type) {
        this.setExpectedLength(length);
        this.type = type;
    }

    Period.prototype.start = function() {
        this.begun = new Date().getTime();
        this.overTime = undefined;
    };

    Period.prototype.setExpectedLength = function(length) {
        this.expectedLength = length * 60000;
    };

    Period.prototype.getExpectedLength = function(length) {
        return this.expectedLength / 60000;
    };

    Period.prototype.getOverTime = function() {
        var time = new Date().getTime() - this.begun;
        return (time - this.expectedLength) / 60000;
    };

    Period.prototype.stop = function() {
        this.begun = undefined;
        this.overTime = this.getOverTime();
    };
    Period.prototype.isStarted = function() { return this.begun !== undefined; };
    Period.prototype.isFinnished = function() { return this.overTime !== undefined; };



    /* ----------------- Pomodore ---------------- */
    var Pomodore = function(parentBridge){
        this.workCount = 0;
        this.parentBridge = parentBridge;

        this.periods = {
            'work': new Period(25, 'work'),
            'break': new Period(5, 'break'),
            'bigBreak': new Period(15, 'break')
        };
        this.currentPeriod = new Period(0, 'break');

        this.maxOverTimeInterval = 60000;
        this.overTimeInterval = this.maxOverTimeInterval;
        this.timeOutId = undefined;
        this.handleOverTime();
    };

    Pomodore.prototype.isRunning = function() {
        return this.timeOutId !== undefined;
    };

    Pomodore.prototype.reset = function() {
        this.stop();
        this.workCount = 0;
    };    

    Pomodore.prototype.stop = function() {
        var wasWork = false;
        this.currentPeriod.stop();

        if (this.currentPeriod.type == 'work') {
            wasWork = true;
            this.workCount--;
            this.currentPeriod = this.periods['break'];
        } 

        this.timeOutId = clearTimeout(this.timeOutId);

        this.parentBridge.trigger('stopped', wasWork);
    };

    Pomodore.prototype.start = function() {

        var isWork, overTime = 0;

        if (!this.currentPeriod.isStarted()) {
            this.currentPeriod.stop();
            overTime = this.currentPeriod.overTime;
        }
        
        if (this.currentPeriod.type == 'break' ) {
            isWork = true;
            this.workCount++;
            this.currentPeriod = this.periods.work;

        } else if (this.workCount % 4 === 0) {
            this.currentPeriod = this.periods.bigBreak;

        } else {
            this.currentPeriod = this.periods['break'];
        }

        this.currentPeriod.start();

        clearTimeout(this.timeOutId);
        this.overTimeInterval = this.maxOverTimeInterval;
        this.timeOutId = setTimeout(this.handleOverTime, this.currentPeriod.expectedLength);

        this.parentBridge.trigger('started', {type: this.currentPeriod.type, lastOverTime: overTime });
    };

    Pomodore.prototype.handleOverTime = function() {
        var self = this;
        this.handleOverTime = function() {

            self.parentBridge.trigger('overTime', {type: self.currentPeriod.type, time:self.currentPeriod.getOverTime() });

            clearTimeout(self.timeOutId);
            self.timeOutId = setTimeout(self.handleOverTime, self.overTimeInterval);

            if (self.overTimeInterval > 15000)
                self.overTimeInterval -= 5000; 
        };
    };

    /* ----------------- return ---------------- */
    return {
        EventDispatcher: EventDispatcher,
        Pomodore:Pomodore,
        Period:Period
    };


})();

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
        this.bridge.trigger('changed', value);
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
        this.bridge.addListener('firstOpenedUrl', this.handleNewUrl);
        this.bridge.addListener('lastClosedUrl', this.handleClosedUrl);
        this.bridge.addListener('isOpened', this.isOpenedHandler);
        
        this.check();
    };
    PageLinkActivator.prototype.disable = function() {
        this.state = false;
        this.bridge.removeListener('firstOpenedUrl', this.handleNewUrl);
        this.bridge.removeListener('lastClosedUrl', this.handleClosedUrl);
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
        this.bridge.trigger('isOpenedUrl', this.url);
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
        'alwaysoff': new AlwaysActivator(false)
        };

})();


var SiteWatcher = (function() {
/*
    BaseController.prototype.init = function() {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function() { };
*/

    var watcher = {

        urlPrefix: 'tasks/productivity/',

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,

        sendInterval: 3000,
        sendIntervalID: 0,

        score: 0,
        timestamp: new Date().getTime(),

        parentBridge: undefined,
        dispatcher: new utilies.EventDispatcher(),

        activator: undefined,
        activators: undefined,

        productivityState: 0,

        init: function(parentBridge) {

            this.parentBridge = parentBridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].init(this.dispatcher);

            this.activator = this.activators.alwaysoff;
        },

        enable:function() {
            this.parentBridge.addListener('newUrl', this.checkNewUrl);
            this.parentBridge.addListener('lastClosedUrl', this.lastClosedUrlHandler);
            this.parentBridge.addListener('firstOpenedUrl', this.firstOpenedUrlHandler);
            this.parentBridge.addListener('isOpened', this.isOpenedHandler);

            this.dispatcher.addListener('changed', this.controllSendingState);
            this.dispatcher.addListener('isOpenedUrl', this.isOpenedUrlHandler);
        },

        disable: function() {

            this.turnOffTheSender();

            this.parentBridge.removeListener('newUrl', this.checkNewUrl);
            this.parentBridge.removeListener('lastClosedUrl', this.lastClosedUrlHandler);
            this.parentBridge.removeListener('firstOpenedUrl', this.firstOpenedUrlHandler);
            this.parentBridge.removeListener('isOpened', this.isOpenedHandler);

            this.dispatcher.removeListener('changed', this.controllSendingState);
            this.dispatcher.removeListener('isOpenedUrl', this.isOpenedUrlHandler);
        },

        setOptions: function(params) {

            this.setValue(params, 'viceDomains');
            this.badHosts = this.viceDomains.split('\n');

            this.setValue(params, 'goodDomains');
            this.goodHosts = this.goodDomains.split('\n');

            if (!params.isSandBox) {
                if (params.sendInterval) {
                    this.sendInterval = params.sendInterval * 1000 * 60;
                    if (this.sendInterval < 60000 ) this.sendInterval = 60000;
                    if (this.sendIntervalID)
                        this.turnOnTheSender();
                }
            }

            if (params.siteWatcherIsActive) {
                if (params.siteWatcherIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }

            for (var ac in this.activators) 
                this.activators[ac].setOptions(params);

            this.setValue(params, 'activatorName');
            this.setActivator(this.activatorName);

        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        setActivator: function(name) {
            name = this.activators[name] ? name : 'alwaysoff';
            
            this.activator.disable();
            this.activator = this.activators[name];
            this.activator.enable();
        },

        setProductivityState: function() {
            var state = 0, data;
            if (this.goodHosts.indexOf(this.host) != -1)
                state = 1;
            else if (this.badHosts.indexOf(this.host) != -1)
                state = -1;

            if (this.productivityState !== state) {
                if (state > 0) {
                    data = {
                        score: 1,
                        message: 'Great! Maybe you are started working:)'
                    };
                } else if (state < 0) {
                    data = {
                        score: -1,
                        message: "I'm watching you! Lets go to work!"
                    };
                }

                this.productivityState = state;

                if (data)
                    this.parentBridge.trigger('notify', data);
            }
        },

        addScoreFromSpentTime: function(spentTime) {
            var score = 0;
            if (this.productivityState > 0)
                score = spentTime * this.goodTimeMultiplier;
            else if (this.productivityState < 0)
                score = (spentTime * this.badTimeMultiplier) * -1;

            this.score += score;
        },

        getandResetSpentTime: function() {
            var spent = new Date().getTime() - this.timestamp;

            this.timestamp = new Date().getTime();

            return spent * 0.001 / 60;
        },

        getHost: function(url) { return url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'); },

        checkNewUrl: function(url) {
            
            var host = watcher.getHost(url);
            
            if (host == watcher.host) return;
            watcher.host = host;
            
            if (!watcher.activator.state) return;
            
            watcher.setProductivityState();

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());
            
        },

        isOpenedHandler: function() {
            watcher.dispatcher.trigger('isOpened');
        },

        isOpenedUrlHandler: function(url) {
            watcher.parentBridge.trigger('isOpenedUrl', url);
        },

        firstOpenedUrlHandler: function(url) {
            watcher.dispatcher.trigger('firstOpenedUrl', url);
        },

        lastClosedUrlHandler: function(url) {
            watcher.dispatcher.trigger('lastClosedUrl', url);
        },
        
        controllSendingState: function(value) {

            if (watcher.activator.state && !value) {
                watcher.triggerSendRequest();
                watcher.turnOffTheSender();

            } else if (!watcher.activator.state && value) {
                watcher.turnOnTheSender();

            } else if (watcher.activator.state && value && !watcher.sendIntervalID) {
                watcher.turnOnTheSender();

            } else if (!watcher.activator.state && !value && watcher.sendIntervalID) {
                watcher.triggerSendRequest();
                watcher.turnOffTheSender();
            }            
        },

        triggerSendRequest: function() {

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());
            
            if (watcher.score !== 0) {
                watcher.parentBridge.trigger('sendRequest', {
                    urlSuffix: watcher.urlPrefix+(watcher.score < 0 ? 'down' : 'up'), 
                    score: watcher.score 
                });

                watcher.score = 0;
            }
        },

        turnOnTheSender: function() {
            this.turnOffTheSender();
            this.sendIntervalID = setInterval(this.triggerSendRequest, this.sendInterval);
        },

        turnOffTheSender: function() {
            this.sendIntervalID = clearInterval(this.sendIntervalID);
        }

    };

    return {
        get: function() { return watcher; },
        getScore: function() { return watcher.score; },
        isEnabled: function() { return watcher.parentBridge.hasListener('newUrl', watcher.checkNewUrl); },
        init: function(parentBridge) { watcher.init(parentBridge); },
        setOptions: function(parentBridge) { watcher.setOptions(parentBridge); },
        forceSendRequest: function() { watcher.triggerSendRequest(); }
    };

})();
    

var Tomatoes = (function() {
/*
    BaseController.prototype.init = function(parentBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var tomatoes = {

        url: 'http://tomato.es',
        urlPrefix: 'tasks/tomatoes/',

        init: function(parentBridge) {

            this.parentBridge = parentBridge;

            this.injectCode();
        },

        enable:function() {            
            this.parentBridge.addListener('newUrl', this.injectCode);
            this.parentBridge.addListener('isOpened', this.isOpenedHandler);

        },

        disable: function() {
            this.parentBridge.removeListener('newUrl', this.injectCode);
            this.parentBridge.removeListener('isOpened', this.isOpenedHandler);

        },

        setOptions: function(params) {


            if (!params.isSandBox) {

            }

            if (params.tomatoesIsActive) {
                if (params.tomatoesIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }

        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        isOpenedHandler: function() {

        },

        injectCode: function() {
            var self = this;
            this.injectCode = function(url) {
                if (url.indexOf(self.url) === 0) {

                }
            };
        }
    };


    return {
        get: function() { return tomatoes; },
        isEnabled: function() { return tomatoes.parentBridge.hasListener('firstOpenedUrl', tomatoes.injectCode); },
        init: function(parentBridge) { tomatoes.init(parentBridge); },
        setOptions: function(params) { tomatoes.setOptions(params); }
    };

})();

var habitRPG = (function(){

    var returnObj = {
        get: function() { return habitrpg; },
        init: function(bridge) { habitrpg.init(bridge); }
    }, 
  
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        parentBridge: undefined,
        dispatcher: new utilies.EventDispatcher(),

        init: function(bridge) {

            this.parentBridge = bridge;
            this.parentBridge.addListener('newUrl', this.newUrl);
            this.parentBridge.addListener('closedUrl', this.closedUrl);
            this.parentBridge.addListener('isOpened', this.isOpenedHandler);
            this.parentBridge.addListener('optionsChanged', this.setOptions);
            this.parentBridge.addListener('lastClosedUrl', this.lastClosedUrlHandler);
            this.parentBridge.addListener('firstOpenedUrl', this.firstOpenedUrlHandler);

            this.dispatcher.addListener('sendRequest', this.send);
            this.dispatcher.addListener('isOpenedUrl', this.isOpenedUrlHandler);
            this.dispatcher.addListener('notify', this.delegateNotifyRequest);

            this.controllers = {
                'sitewatcher': SiteWatcher,
                'tomatoes': Tomatoes
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.dispatcher);
        
        },

        setOptions: function(params) {

            if (params.uid) {
                habitrpg.uid = params.uid;
                habitrpg.habitUrl = habitrpg.sourceHabitUrl.replace('{UID}', habitrpg.uid);
            }

            params.isSandBox = habitrpg.isSandBox;

            for (var co in habitrpg.controllers) 
                habitrpg.controllers[co].setOptions(params);
            
        },

        newUrl: function(url) { 
            habitrpg.dispatcher.trigger('newUrl', url); 
        },

        closedUrl: function(url) { 
            habitrpg.dispatcher.trigger('closedUrl', url); 
        },

        lastClosedUrlHandler: function(url) { 
            habitrpg.dispatcher.trigger('lastClosedUrl', url); 
        },

        firstOpenedUrlHandler: function(url) { 
            habitrpg.dispatcher.trigger('firstOpenedUrl', url); 
        },

        isOpenedHandler: function() {
            habitrpg.dispatcher.trigger('isOpened');
        },

        isOpenedUrlHandler: function(url) {
            habitrpg.parentBridge.trigger('isOpenedUrl', url);
        },

        delegateNotifyRequest: function(data) {
            habitrpg.parentBridge.trigger('notify', data);
        },

        send: function(data) {

            if (!habitrpg.uid) return;

            if (habitrpg.isSandBox) {
                habitrpg.parentBridge.trigger('notify', data);
                
            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.parentBridge.trigger('notify', data);

                });
            }
            
        }

    };

    return returnObj;

})();
