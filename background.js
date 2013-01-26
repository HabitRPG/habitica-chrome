
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

            this.setValue(params, 'activatorName');
            this.setActivator(this.activatorName);

            if (params.watchedUrl && this.activator.setUrl)
                this.activator.setUrl(params.watchedUrl);
                        
            if (params.isActive && this.activatorName == 'fromOptions')
                this.activator.setState(params.isActive);            
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

            if (name == 'alwayson')
                this.activator.setState();

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
	notificationShowTime: 4000,

	init: function() {
		chrome.webNavigation.onCommitted.addListener(this.navCommittedHandler);
		chrome.tabs.onActivated.addListener(this.tabActivatedHandler);
		chrome.windows.onFocusChanged.addListener(this.focusChangeHandler);
		chrome.storage.onChanged.addListener(this.setHabitRPGOptionsFromChange);

		//var storage = chrome.storage.managed;
		var storage = chrome.storage.local;
		
		storage.get({
			uid:'',
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
