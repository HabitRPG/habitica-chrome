
function AlwaysonActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
    this.changeStateFn(true);
}
FromOptionsActivator.prototype.setState = function(value) {};


function FromOptionsActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
}

FromOptionsActivator.prototype.setState = function(value) {
    if (value == 'true') this.changeStateFn(true);
    else if (value == 'false') this.changeStateFn(false);
};

var habitRPG = (function(){

    var habitrpg = {

        isSandBox: false,

        sendInterval: 15000,
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
        
        habitUrl: 'alma',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/tasks/productivity/",

        init: function() {
            this.setActiveState();

            this.activators = {
                'alwayson': new AlwaysonActivator(this.setActiveState),
                'fromOptions': new FromOptionsActivator(this.setActiveState)
            };
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

            if (params.isActive && this.activatorName == 'fromOptions') {
                this.activator.setState(params.isActive);
            }
            
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        checkNewPage: function(url) {
            if (!this.isActive) return;

            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'), spentTime;

            if (host == this.host) return;

            this.addScoreFromSpentTime(this.getandResetSpentTime());

            this.host = host;

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
                    if (this.scoreSendCallback)
                        this.scoreSendCallback(this.score);
                } else {
                    var sc = this.score;
                    
                    $.ajax({
                        type: 'POST',
                        url: this.habitUrl + (sc < 0 ? 'down' : 'up')
                        
                    }).done(function(){
                        habitrpg.scoreSendCallback(sc);
                    });
                }
                this.score = 0;
            }
        },

        setActivator: function(name) {
            this.activator = this.activators[name] || 'alwayson';
        },

        setActiveState: function(value) {
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

        setScoreSendCallback: function(scoreSendCallback) {
            this.scoreSendCallback = scoreSendCallback;
        }
    };

    habitrpg.init();

    return {
        checkNewPage: function(url) { habitrpg.checkNewPage(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        setScoreSendCallback: function(callback) { habitrpg.setScoreSendCallback(callback); }
    };
})();

var App = {

	activeTabId: -1,
	hasFocus: true,

	habitrpg: habitRPG(),
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

		this.habitrpg.setScoreSendCallback(this.showNotification);
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

	showNotification: function(score) {

		score = score.toFixed(4);

		var notification = webkitNotifications.createNotification(
			"/img/icon-48-" + (score < 0 ? 'down' : 'up') + ".png", 
			'HabitRPG', 
			'You '+(score < 0 ? 'lost' : 'gained')+' '+score+' '+(score < 0 ? 'HP! Work or will die...' : 'Exp/Gold! Keep up the good work!')
		);
		notification.show();
		setTimeout(function(){notification.close();}, App.notificationShowTime);

	}
};

/* ------------- Mainloop ---------- */

App.init();
