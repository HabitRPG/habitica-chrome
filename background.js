var defaultOptions = {
      uid:'',
      watchedUrl: '',
      sendInterval: '25',
      activatorName: 'alwayon',
      siteWatcherIsActive: 'true',
      tomatoesIsActive: 'true',
      todosIsActive: 'true',
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
    var Pomodore = function(eventNamespace, parentBridge){
        this.workCount = 0;
        this.parentBridge = parentBridge;
        this.eventNamespace = eventNamespace || 'pomodore';

        this.periods = {
            'work': new Period(25, 'work'),
            'break': new Period(5, 'break'),
            'bigBreak': new Period(15, 'break')
        };
        this.currentPeriod = new Period(0, 'break');

        this.maxOverTimeInterval = 45000;
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

    Pomodore.prototype.stop = function(isSilent) {
        var wasWork = false;
        this.currentPeriod.stop();

        if (this.currentPeriod.type == 'work') {
            wasWork = true;
            this.workCount--;
            this.currentPeriod = this.periods['break'];
        } 

        this.timeOutId = clearTimeout(this.timeOutId);

        if (!isSilent)
            this.parentBridge.trigger(this.eventNamespace+'.stopped', wasWork);
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
        this.timeOutId = setTimeout(this.handleOverTime, this.currentPeriod.expectedLength + this.maxOverTimeInterval);

        this.parentBridge.trigger(this.eventNamespace+'.started', {
                type: this.currentPeriod.type, 
                tomatoCount: this.workCount, 
                lastOverTime: overTime 
            });
    };

    Pomodore.prototype.handleOverTime = function() {
        var self = this;
        this.handleOverTime = function() {

            self.parentBridge.trigger(self.eventNamespace+'.overTime', {type: self.currentPeriod.type, time:self.currentPeriod.getOverTime() });

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


var SiteWatcher = (function() {
/*
    BaseController.prototype.init = function(appBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function() { };
*/

    var watcher = {

        urlPrefix: 'tasks/productivity/',

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,

        isSwapped: false,

        sendInterval: 3000,
        sendIntervalID: 0,

        score: 0,
        timestamp: new Date().getTime(),

        appBridge: undefined,
        
        activator: undefined,
        activators: undefined,

        productivityState: 0,

        init: function(appBridge) {

            this.appBridge = appBridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].init(this.appBridge);

            this.activator = this.activators.alwaysoff;
        },

        enable:function() {
            this.appBridge.addListener('app.newUrl', this.checkNewUrl);
            this.appBridge.addListener('watcher.swapHosts', this.swapHosts);
            this.appBridge.addListener('watcher.activator.changed', this.controllSendingState);
        },

        disable: function() {

            this.setProductivityState();
            this.triggerSendRequest();

            this.appBridge.removeListener('app.newUrl', this.checkNewUrl);
            this.appBridge.removeListener('watcher.swapHosts', this.swapHosts);
            this.appBridge.removeListener('watcher.activator.changed', this.controllSendingState);
        },

        setOptions: function(params) {

            this.setValue(params, 'viceDomains');
            this.setValue(params, 'goodDomains');
            this.swapHosts(this.isSwapped);

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

        getHost: function(url) { return url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'); },

        checkNewUrl: function(url) {
            
            var host = watcher.getHost(url);
            
            if (host == watcher.host) return;
            
            watcher.host = host;

            watcher.setProductivityState(watcher.activator.state);

            if (!watcher.activator.state) return;
            
            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());
            
        },
        
        getandResetSpentTime: function() {
            var spent = new Date().getTime() - this.timestamp;

            this.timestamp = new Date().getTime();

            return spent * 0.001 / 60;
        },

        addScoreFromSpentTime: function(spentTime) {
            var score = 0;

            if (this.productivityState > 0)
                score = spentTime * this.goodTimeMultiplier;
            else if (this.productivityState < 0)
                score = (spentTime * this.badTimeMultiplier) * -1;

            this.score += score;
        },
        
        setProductivityState: function(notify) {
            var state = 0, data;
            if (this.goodHosts.indexOf(this.host) != -1)
                state = 1;
            else if (this.badHosts.indexOf(this.host) != -1)
                state = -1;

            if (!this.productivityState)
                this.timestamp = new Date().getTime();
            
            if (this.productivityState !== state) {
                if (state > 0) {
                    data = {
                        score: 0,
                        message: 'Great!'+(this.isSwapped ? ' Just relax :)' : ' Maybe started working:)')
                    };
                } else if (state < 0) {
                    data = {
                        score: 0,
                        message: "I'm watching you!"+(this.isSwapped ? "Do not work now!" :" Lets go to work!")
                    };
                }

                this.productivityState = state;

                if (notify && data)
                    this.appBridge.trigger('app.notify', data);
            }
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
                watcher.appBridge.trigger('controller.sendRequest', {
                    urlSuffix: watcher.urlPrefix+(watcher.score < 0 ? 'down' : 'up'), 
                    score: watcher.score < 0 ? -1 : 1
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
        },

        swapHosts: function(isSwapped) {
            if (isSwapped) { 
                watcher.badHosts = watcher.goodDomains.split('\n');
                watcher.goodHosts = watcher.viceDomains.split('\n');
            } else {
                watcher.badHosts = watcher.viceDomains.split('\n');
                watcher.goodHosts = watcher.goodDomains.split('\n');
            }

            watcher.isSwapped = isSwapped;
        }

    };

    return {
        get: function() { return watcher; },
        getScore: function() { return watcher.score; },
        isEnabled: function() { return watcher.appBridge.hasListener('app.newUrl', watcher.checkNewUrl); },
        init: function(appBridge) { watcher.init(appBridge); },
        setOptions: function(params) { watcher.setOptions(params); },
        forceSendRequest: function() { watcher.triggerSendRequest(); }
    };

})();
    

var Todos = (function() {
/*
    BaseController.prototype.init = function(appBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var todos = {

        urlPrefix: 'tasks/todos/',

        init: function(appBridge) {

            this.appBridge = appBridge;
        },

        enable: function() {
            this.appBridge.addListener('todos.complete', this.completeHandler);
            this.appBridge.addListener('todos.unComplete', this.unCompleteHandler);
            this.appBridge.addListener('todos.dueDateOver', this.dueDateOverHandler);
        },

        disbale: function() {
            this.appBridge.removeListener('todos.complete', this.completeHandler);
            this.appBridge.removeListener('todos.unComplete', this.unCompleteHandler);
            this.appBridge.removeListener('todos.dueDateOver', this.dueDateOverHandler);
        },

        setOptions: function(params) {

            if (params.todosIsActive) {
                if (params.todosIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }

        },

        completeHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: 1,
                urlSuffix: todos.urlPrefix,
                message: "Yupi! Just completed a task! [+1] Exp/Gold"
            });
        },

        unCompleteHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: -1,
                urlSuffix: todos.urlPrefix,
                message: "I thought it was done :( [-1] HP"
            });
        },

        dueDateOverHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: -1,
                urlSuffix: todos.urlPrefix,
                message: "Hurry! You are late! [-1] HP"
            });  
        }
    };


    return {
        get: function() { return todos; },
        isEnabled: function() { return todos.appBridge.hasListener('todos.complete', todos.completeHandler); },
        init: function(appBridge) { todos.init(appBridge); },
        setOptions: function(params) { todos.setOptions(params); }
    };

})();
var Tomatoes = (function() {
/*
    BaseController.prototype.init = function(appBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var tomatoes = {

        url: 'http://tomato.es',

        urlPrefix: 'tasks/tomatoes/',
        pomodore: undefined,

        appBridge: undefined,
        overTimeCounter: 0,

        init: function(appBridge) {

            this.appBridge = appBridge;
            this.pomodore = new utilies.Pomodore('tomatoes.pom', appBridge);

        },

        enable:function() {            
            this.appBridge.addListener('tomatoes.reset', this.resetHandler);
            this.appBridge.addListener('tomatoes.started', this.startedFromPageHandler);
            this.appBridge.addListener('tomatoes.stopped', this.stoppedFromPageHandler);
            this.appBridge.addListener('tomatoes.pom.started', this.startedHandler);
            this.appBridge.addListener('tomatoes.pom.overTime', this.overTimeHandler);
        },

        disable: function() {
            this.appBridge.removeListener('tomatoes.reset', this.resetHandler);
            this.appBridge.removeListener('tomatoes.started', this.startedFromPageHandler);
            this.appBridge.removeListener('tomatoes.stopped', this.stoppedFromPageHandler);
            this.appBridge.removeListener('tomatoes.pom.started', this.startedHandler);
            this.appBridge.removeListener('tomatoes.pom.overTime', this.overTimeHandler);
        },

        setOptions: function(params) {

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

        resetHandler: function() {
            tomatoes.pomodore.stop(true);
            tomatoes.overTimeCounter= 0;
        },

        startedFromPageHandler: function(data) {
            tomatoes.pomodore.workCount = data.tomatoCount;
            tomatoes.pomodore.start();
            tomatoes.overTimeCounter= 0;
        },

        stoppedFromPageHandler: function() {
            tomatoes.pomodore.stop();
            tomatoes.appBridge.trigger('controller.sendRequest', {
                score:-1, 
                urlSuffix: tomatoes.urlPrefix,
                message: 'You breaked the flow!! [-1] HP...'
                });
        },

        startedHandler: function(data) {
            if (data.type == 'break')
                tomatoes.appBridge.trigger('controller.sendRequest', {
                    score:1, 
                    urlSuffix: tomatoes.urlPrefix,
                    message: 'You made your '+(data.tomatoCount+1)+' tomato! Well done [+1] Exp/Gold!' 
                });
        },

        overTimeHandler: function(data) {
            var message = 'You are over '+(data.type == 'work' ? 'working' : 'breaking');
            if (tomatoes.overTimeCounter % 2 == 1)
                tomatoes.appBridge.trigger('app.notify', {
                        score:0, 
                        urlSuffix: tomatoes.urlPrefix,
                        message: message+'! Next time you will lose HP!'
                    });
            else 
                tomatoes.appBridge.trigger('controller.sendRequest', {
                    score:-1, 
                    urlSuffix: tomatoes.urlPrefix,
                    message: message+' [-1] HP!!' 
                });


            tomatoes.overTimeCounter++;
        }
    };


    return {
        get: function() { return tomatoes; },
        isEnabled: function() { return tomatoes.appBridge.hasListener('tomatoes.started', tomatoes.startedFromPageHandler); },
        init: function(appBridge) { tomatoes.init(appBridge); },
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

        appBridge: undefined,

        init: function(bridge) {

            this.appBridge = bridge;
            
            this.appBridge.addListener('controller.sendRequest', this.send);
            this.appBridge.addListener('app.optionsChanged', this.setOptions);
            

            this.controllers = {
                'sitewatcher': SiteWatcher,
                'tomatoes': Tomatoes,
                'todos': Todos
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.appBridge);
        
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

        send: function(data) {

            if (!habitrpg.uid) return;

            if (habitrpg.isSandBox) {
                habitrpg.appBridge.trigger('app.notify', data);
                
            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.appBridge.trigger('app.notify', data);

                });
            }
            
        }

    };

    return returnObj;

})();

var App = {

	appTest: 0, // -1 without habitrpg; +1 with habitrpg; 0 nothing logged from the app

	tabs: {},
	activeUrl: '',
	hasFocus: true,

	habitrpg: habitRPG,
	invalidTransitionTypes: ['auto_subframe', 'form_submit'],

  //storage: chrome.storage.managed,
	storage: chrome.storage.local,

	notificationShowTime: 4000,

	dispatcher: new utilies.EventDispatcher(),

	init: function() {

		this.dispatcher.addListener('app.notify', this.showNotification);
		this.dispatcher.addListener('app.isOpenedUrl', this.isOpenedUrlHandler);
		this.dispatcher.addListener('app.newUrl', function(url){App.activeUrl = url; });

		if (this.appTest > 0) {
			this.createLogger();
			App.habitrpg.init(this.dispatcher);

		} else if (this.appTest < 0)
			this.createLogger();

		else 
			App.habitrpg.init(this.dispatcher);

		chrome.tabs.onCreated.addListener(this.tabCreatedHandler);
		chrome.tabs.onUpdated.addListener(this.tabUpdatedHandler);
		chrome.tabs.onRemoved.addListener(this.tabRemovedHandler);
		chrome.extension.onMessage.addListener(this.messageHandler);
		chrome.tabs.onActivated.addListener(this.tabActivatedHandler);
		chrome.webNavigation.onCommitted.addListener(this.navCommittedHandler);
		
		chrome.windows.onFocusChanged.addListener(this.focusChangeHandler);		
		chrome.storage.onChanged.addListener(this.setHabitRPGOptionsFromChange);

		chrome.windows.getAll({populate:true}, function(windows){
            for (var wi in windows) {
                win = windows[wi];
                for (var ti in win.tabs) {
                    tab = win.tabs[ti];
                    App.tabs[tab.id] = tab;
                }
            }
        });

        this.storage.get(defaultOptions, function(data){ App.dispatcher.trigger('app.optionsChanged', data); });

	},

	messageHandler: function(request, sender, sendResponse) {
		App.dispatcher.trigger(request.type, request);
	},

	navCommittedHandler: function(tab) {
		if (!tab.id) return;

		App.triggerFirstOpenedUrl(tab.url);

		App.tabs[tab.id] = tab;
		if (App.hasFocus && tab.active && tab.url && App.invalidTransitionTypes.indexOf(tab.transitionType) == -1) {
			App.triggerFirstOpenedUrl(tab.url);
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
			App.activeUrl = tab.url;
		}
	},

	tabCreatedHandler: function(tab) {
		if (!tab.id) return;

		App.triggerFirstOpenedUrl(tab.url);

		App.tabs[tab.id] = tab;
		App.tabUpdatedHandler(undefined, undefined, tab);
	},

	tabUpdatedHandler: function(id, changed, tab) {
		if (App.hasFocus && tab.active && tab.url && App.activeUrl != tab.url) {
			App.triggerFirstOpenedUrl(tab.url);
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
			App.activeUrl = tab.url;
		}
	},

	// This event fired after the remove action, so we forced to store the tabs
	tabRemovedHandler: function(tabId) {
		var url = App.tabs[tabId].url;
		delete App.tabs[tabId];
		
		if (!App.hasInTabs(url))
			App.dispatcher.trigger('app.lastClosedUrl', App.catchSpecURL(url));

		App.dispatcher.trigger('app.closedUrl', App.catchSpecURL(url));
	},

	tabActivatedHandler: function(event) {
		var tab = App.tabs[event.tabId];
		if (tab) {
			App.activeUrl = tab.url;
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
		}
	},

	focusChangeHandler: function() {
		chrome.windows.getLastFocused({populate:true}, App.windowIsFocused);
	},

	windowIsFocused: function(win) {

		if (!win.focused) {
			App.hasFocus = false;
			App.dispatcher.trigger('app.newUrl', '');
			App.dispatcher.trigger('app.firstOpenedUrl', '');

		} else {
			App.hasFocus = true;
			App.dispatcher.trigger('app.lastClosedUrl', '');
			for (var i in win.tabs) {
				var url = win.tabs[i].url;
				if (win.tabs[i].active && App.activeUrl != url) {
					App.dispatcher.trigger('app.newUrl', App.catchSpecURL(url));
					break;
				}
			}
		}
	},

	catchSpecURL: function(url) {

		if (url.indexOf('chrome-devtools') === 0)
			url = 'chrome-devtools';

		return url;
	},

	setHabitRPGOptionsFromChange: function(params) {
		var obj = {}, name;
		for (name in params) 
			obj[name] = params[name].newValue;

		App.dispatcher.trigger('app.optionsChanged', obj);
		
	},

	showNotification: function(data) {

		var score = data.score.toFixed(4),
			imgVersion = !data.score ? '' : (score < 0 ? '-down' : '-up'),
			notification = webkitNotifications.createNotification(
			"/img/icon-48" + imgVersion + ".png", 
			'HabitRPG', 
			data.message ? data.message :
			('You '+(score < 0 ? 'lost' : 'gained')+' '+score+' '+(score < 0 ? 'HP! Lets go...' : 'Exp/Gold! Keep up!'))
		);
		notification.show();
		setTimeout(function(){notification.close();}, App.notificationShowTime);
	},

	isOpenedUrlHandler: function(url) {
		if (App.hasInTabs(url))
			App.dispatcher.trigger('app.isOpened');
	},

	triggerFirstOpenedUrl: function(url) {
		if (!App.hasInTabs(url))
			App.dispatcher.trigger('app.firstOpenedUrl', App.catchSpecURL(url));
	},

	hasInTabs: function(url) {
		var urls = $.map(App.tabs, App.filterUrlsWrap(App.getHost(url)));
		if (urls.indexOf(true) === -1 ) return false;

		return true;
	},

	filterUrlsWrap: function(refUrl){
		return function(tab){
			var url = App.getHost(tab.url);
			if (refUrl == url) return true;
			return false;
		};
	},

	filterUrls: function(refUrl, tab) {
	},

	getHost: function(url) { 
		return url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'); 
	},

	createLogger: function() {
		this.dispatcher.addListener('app.newUrl', function(url) {console.log('new: '+url); });
		this.dispatcher.addListener('app.optionsChanged', function(data){ console.log(data); });
		this.dispatcher.addListener('app.closedUrl', function(url) { console.log('closed: '+url);});
		this.dispatcher.addListener('app.lastClosedUrl', function(url) {console.log('lastClosedUrl: '+url); });
		this.dispatcher.addListener('app.firstOpenedUrl', function(url) {console.log('firstOpenedUrl: '+url); });
	}
};

/* ------------- Mainloop ---------- */

App.init();
