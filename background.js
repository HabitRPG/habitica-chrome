
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

    return {
        EventDispatcher: EventDispatcher
    };


})();

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

        sendInterval: 1000,
        sendIntervalID: -1,

        score: 0,
        timestamp: new Date().getTime(),

        bridge: undefined,
        activator: undefined,
        activators: undefined,

        init: function(bridge) {

            this.bridge = bridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].setChangeStateFn(this.controllSendingState);

            this.activator = this.activators.alwaysoff;
        },

        enable:function() {
            this.activator.init();
            this.bridge.addListener('newUrl', this.checkNewUrl);
        },

        disable: function() {
            this.activator.deinit();
            this.bridge.removeListener('newUrl', this.checkNewUrl);
        },

        setOptions: function(params) {

            this.setValue(params, 'viceDomains');
            this.badHosts = this.viceDomains.split('\n');

            this.setValue(params, 'goodDomains');
            this.goodHosts = this.goodDomains.split('\n');

            if (!params.isSandBox) {
                if (params.sendInterval) 
                    this.sendInterval = params.sendInterval * 1000 * 60;
                
                if (this.sendInterval < 60000 ) this.sendInterval = 60000;
            }

            for (var ac in this.activators) 
                this.activators[ac].setOptions(params);

            this.setValue(params, 'activatorName');
            this.setActivator(this.activatorName);

            if (params.siteWatcherIsActive) {
                if (params.siteWatcherIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        setActivator: function(name) {
            name = this.activators[name] ? name : 'alwaysoff';

            this.activator.deinit();
            this.activator = this.activators[name];
            this.activator.init();
        },

        addScoreFromSpentTime: function(spentTime) {
            var score = 0;
            if (this.goodHosts.indexOf(this.host) != -1)
                score = spentTime * this.goodTimeMultiplier;
            else if (this.badHosts.indexOf(this.host) != -1)
                score = (spentTime * this.badTimeMultiplier) * -1;

            this.score += score;
        },

        getandResetSpentTime: function() {
            var spent = new Date().getTime() - this.timestamp;

            this.timestamp = new Date().getTime();

            return spent * 0.001 / 60;
        },

        checkNewUrl: function(url) {
            
            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1');
            
            if (host == watcher.host) return;
            watcher.host = host;

            if (watcher.activator.handleNewUrl) 
                watcher.activator.handleNewUrl(url);

            if (!watcher.activator.getState()) return;

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());
            
        },

        send: function() {

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());

            if (watcher.score !== 0) 
                watcher.bridge.triggerEvent('sendRequest', {
                    urlSuffix: watcher.urlPrefix+(watcher.score < 0 ? 'down' : 'up'), 
                    score: watcher.score 
                });
        },

        controllSendingState: function(value) {

            if (!value) {
                watcher.send();
                watcher.turnOffTheSender();

            } else if (value) {
                watcher.turnOnTheSender();
            }
            
        },

        turnOnTheSender: function() {
            this.turnOffTheSender();
            this.sendIntervalID = setInterval(this.send, this.sendInterval);
        },

        turnOffTheSender: function() {
            clearInterval(this.sendIntervalID);
        }

    };

    return {
        getScore: function() { return watcher.score; },
        isEnabled: function() { return watcher.bridge.hasListener('newUrl', watcher.checkNewUrl); },
        init: function(bridge) { watcher.init(bridge); },
        setOptions: function(bridge) { watcher.setOptions(bridge); }
    };

})();
    


var habitRPG = (function(){

    var returnObj = {
        //get: function() { return habitrpg; },
        newUrl: function(url) { habitrpg.newUrl(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    }, 
  
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        host: undefined,
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        dispatcher: new utilies.EventDispatcher(),

        init: function() {

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.dispatcher);
        
            this.dispatcher.addListener('sendRequest', this.send);
        },

        setOptions: function(params) {

            if (params.uid) {
                this.uid = params.uid;
                this.habitUrl = this.sourceHabitUrl.replace('{UID}', this.uid);
            }

            params.isSandBox = this.isSandBox;

            for (var co in this.controllers) 
                this.controllers[co].setOptions(params);
            
        },

        newUrl: function(url) { 
            this.dispatcher.trigger('newUrl', url); 
        },

        send: function(data) {
   
            if (habitrpg.isSandBox) {
                habitrpg.scoreSendedAction(data.score, data.message);

            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.scoreSendedAction(data.score, data.message);
                });
            }
            
        },

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        }
    };

    habitrpg.init();

    return returnObj;

})();

var App = {

	activeTabId: -1,
	hasFocus: true,

	habitrpg: habitRPG,
	invalidTransitionTypes: ['auto_subframe', 'form_submit'],
  //storage: chrome.storage.managed,
	storage: chrome.storage.local,
	notificationShowTime: 4000,


	init: function() {
		chrome.webNavigation.onCommitted.addListener(this.navCommittedHandler);
		chrome.tabs.onActivated.addListener(this.tabActivatedHandler);
		chrome.windows.onFocusChanged.addListener(this.focusChangeHandler);
		chrome.storage.onChanged.addListener(this.setHabitRPGOptionsFromChange);

		this.storage.get({
			uid:'',
			days: '',
			watchedUrl: '',
			isActive: 'false',
			sendInterval: '5',
			activatorName: 'alwayon',
			viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
			goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org'
		}, this.habitrpg.setOptions);

		this.habitrpg.setScoreSendedAction(this.showNotification);
		
	},

	navCommittedHandler: function(event){
		if (App.hasFocus && App.activeTabId == event.tabId && App.invalidTransitionTypes.indexOf(event.transitionType) == -1) {
			App.habitrpg.newUrl(App.catchSpecURL(event.url));
		}
	},

	tabActivatedHandler: function(event) {
		// TODO: find out why not find the event tabID...
		try { 
			chrome.tabs.get(event.tabId, function(tab){
				App.activeTabId = tab.id;
				App.habitrpg.newUrl(App.catchSpecURL(tab.url));

			});
		} catch (e) {

		}
	},

	focusChangeHandler: function() {
		chrome.windows.getLastFocused({populate:true}, App.windowIsFocused);
	},

	windowIsFocused: function(win) {

		if (!win.focused) {
			App.hasFocus = false;
			App.habitrpg.newUrl('');

		} else {
			App.hasFocus = true;
			for (var i in win.tabs) {
				if (win.tabs[i].active) {
					App.habitrpg.newUrl(App.catchSpecURL(win.tabs[i].url));
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

		App.habitrpg.setOptions(obj);
		
	},

	showNotification: function(score, message) {

		score = score.toFixed(4);

		var notification = webkitNotifications.createNotification(
			"/img/icon-48-" + (score < 0 ? 'down' : 'up') + ".png", 
			'HabitRPG', 
			message ? message :
			('You '+(score < 0 ? 'lost' : 'gained')+' '+score+' '+(score < 0 ? 'HP! Work or will die...' : 'Exp/Gold! Keep up the good work!'))
		);
		notification.show();
		setTimeout(function(){notification.close();}, App.notificationShowTime);

	}
};

/* ------------- Mainloop ---------- */

App.init();
