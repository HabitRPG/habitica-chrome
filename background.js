
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

    function AlwaysonActivator() {
        this.state = true;
    }
    AlwaysonActivator.prototype.setOptions = function() {};
    AlwaysonActivator.prototype.check = function() {this.changeStateFn(true);};
    AlwaysonActivator.prototype.setChangeStateFn = function(changeStateFn) { 
        this.changeStateFn = function(value) { 
            this.state = value;
            changeStateFn(value);
        }; 
    };



    /*---------------- From options activator ------------*/

    function FromOptionsActivator() {}
    FromOptionsActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;
    FromOptionsActivator.prototype.setOptions = function(params) {
        this.value = params.isActive == 'true' ?  true : false;
    };
    FromOptionsActivator.prototype.check = function(value) {
        this.changeStateFn(this.value);
    };



    /*---------------- Page link activator ------------*/

    function PageLinkActivator() {
        var self = this;
        chrome.tabs.onRemoved.addListener(function() {
            self.check();
        });
    }
    PageLinkActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;

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
        this.check();
    }
    DaysActivator.prototype.setChangeStateFn = AlwaysonActivator.prototype.setChangeStateFn;
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
        
        setTimeout(this.check, this.getTimeoutTime(now, start, end));
    };


    /* ---------------- Return -------------------- */

    return {
        'days': new DaysActivator(),
        'webpage': new PageLinkActivator(),
        'alwayson': new AlwaysonActivator(),
        'fromOptions': new FromOptionsActivator()
        };

})();


var habitRPG = (function(){

    var habitrpg = {

        isSandBox: true,

        sendInterval: 1000,
        sendIntervalID: -1,

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,
        
        isActive: false,
        activators: undefined,
        activator: undefined,
        uid: undefined,

        score: 0,

        host: undefined,
        timestamp: new Date().getTime(),
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/tasks/productivity/",

        init: function() {

            this.setActiveState();

            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].setChangeStateFn(this.setActiveState);
        },

        setOptions: function(params) {

            if (params.uid) {
                this.uid = params.uid;
                this.habitUrl = this.sourceHabitUrl.replace('{UID}', this.uid);
            }

            this.setValue(params, 'viceDomains');
            this.badHosts = this.viceDomains.split('\n');

            this.setValue(params, 'goodDomains');
            this.goodHosts = this.goodDomains.split('\n');

            if (!this.isSandBox) {
                if (params.sendInterval) 
                    this.sendInterval = params.sendInterval * 1000 * 60;
                
                if (this.sendInterval < 60000 ) this.sendInterval = 60000;
            }

            for (var ac in this.activators) 
                this.activators[ac].setOptions(params);
            
            this.setValue(params, 'activatorName');
            this.setActivator(this.activatorName);
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        checkNewPage: function(url) {
            
            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1');
            
            if (host == this.host) return;
            this.host = host;

            if (this.activator.handleNewUrl) 
                this.activator.handleNewUrl(url);

            if (!this.isActive) return;

            this.addScoreFromSpentTime(this.getandResetSpentTime());

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

        canSend: function() { return this.score !== 0; },

        sendToHabitRPGHost: function() {

            this.addScoreFromSpentTime(this.getandResetSpentTime());

            if (this.canSend()) {
                
                if (this.isSandBox) {
                    if (this.scoreSendedAction)
                        this.scoreSendedAction(this.score);
                } else {
                    var sc = this.score;
                    
                    $.ajax({
                        type: 'POST',
                        url: this.habitUrl + (sc < 0 ? 'down' : 'up')
                        
                    }).done(function(){
                        habitrpg.scoreSendedAction(sc);
                    });
                }
                this.score = 0;
            }
        },

        setActivator: function(name) {
            name = this.activators[name] ? name : 'alwayson';
            this.activator = this.activators[name];

            this.activator.check();
        },

        setActiveState: function() {
            var self = this;

            this.setActiveState = function(value) {
                if (self.isActive && !value) {
                    self.isActive = false;
                    self.sendToHabitRPGHost();
                    self.turnOffTheSender();
                } else if (!self.isActive && value) {
                    if (self.uid) {
                        self.isActive = true;
                        self.turnOnTheSender();
                    }
                }
            };
        },

        turnOnTheSender: function() {
            this.sendIntervalID = setInterval(function(){habitrpg.sendToHabitRPGHost();}, this.sendInterval);
        },

        turnOffTheSender: function() {
            clearInterval(this.sendIntervalID);
        },

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        }
    };

    habitrpg.init();

    return {
        getScore: function() { return habitrpg.score; },
        isActive: function() { return habitrpg.isActive; },
        checkNewPage: function(url) { habitrpg.checkNewPage(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        sendScore: function() { return habitrpg.sendToHabitRPGHost(); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    };

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
			App.habitrpg.checkNewPage(App.catchSpecURL(event.url));
		}
	},

	tabActivatedHandler: function(event) {
		// TODO: find out why not find the event tabID...
		try { 
			chrome.tabs.get(event.tabId, function(tab){
				App.activeTabId = tab.id;
				App.habitrpg.checkNewPage(App.catchSpecURL(tab.url));

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
			App.habitrpg.checkNewPage('');

		} else {
			App.hasFocus = true;
			for (var i in win.tabs) {
				if (win.tabs[i].active) {
					App.habitrpg.checkNewPage(App.catchSpecURL(win.tabs[i].url));
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
