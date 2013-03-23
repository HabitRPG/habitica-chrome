var App = {

	appTest: 0, // -1 without habitrpg; +1 with habitrpg; 0 nothing logged from the app

	tabs: {},
	activeUrl: '',
	hasFocus: true,

	habitrpg: habitRPG,
	invalidTransitionTypes: ['auto_subframe', 'form_submit'],

	storage: undefined,

	notificationShowTime: 4000,

	dispatcher: new utilies.EventDispatcher(),

	init: function() {

		this.dispatcher.addListener('app.listenToChangeIcon', this.handleChangeIconListener);
		this.dispatcher.addListener('app.notify', this.showNotification);
		this.dispatcher.addListener('app.isOpenedUrl', this.isOpenedUrlHandler);
		this.dispatcher.addListener('app.newUrl', function(url){App.activeUrl = url; });
		this.dispatcher.addListener('app.getCurrentUrl', function(){ App.dispatcher.trigger('app.newUrl', App.activeUrl); });

		if (this.appTest > 0) {
			this.createLogger();
			App.habitrpg.init(this.dispatcher);

		} else if (this.appTest < 0)
			this.createLogger();

		else
			App.habitrpg.init(this.dispatcher);

		chrome.tabs.onUpdated.addListener(this.tabUpdatedHandler);
		chrome.tabs.onRemoved.addListener(this.tabRemovedHandler);
		chrome.extension.onMessage.addListener(this.messageHandler);
		chrome.tabs.onCreated.addListener(this.navCommittedHandler);
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

		chrome.storage.sync.get(defaultOptions, function(data){
			if (data && data.isCloudStorage == 'true') {
				App.storage = chrome.storage.sync;
				App.dispatcher.trigger('app.optionsChanged', data);

			} else {
				App.storage = chrome.storage.local;
				App.storage.get(defaultOptions, function(data){ App.dispatcher.trigger('app.optionsChanged', data); });
			}
		});
	},

	messageHandler: function(request, sender, sendResponse) {
		App.dispatcher.trigger(request.type, request);
	},

	navCommittedHandler: function(tab) {
		if (!tab.id || App.activeUrl == tab.url) return;

		App.triggerFirstOpenedUrl(tab.url);

		App.tabs[tab.id] = tab;
		if (App.hasFocus && tab.active && tab.url && App.invalidTransitionTypes.indexOf(tab.transitionType) == -1) {
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
			App.activeUrl = tab.url;
		}
	},

	tabUpdatedHandler: function(id, changed, tab) {
		if (App.hasFocus && tab.active && tab.url && App.activeUrl != tab.url) {
			App.triggerFirstOpenedUrl(tab.url);
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
			App.activeUrl = tab.url;
			App.tabs[tab.id] = tab;
		}
	},

	// This event fired after the remove action, so we forced to store the tabs
	tabRemovedHandler: function(tabId) {
		var url = App.tabs[tabId].url;
		delete App.tabs[tabId];

		if (!App.hasInTabs(url)) {
			App.dispatcher.trigger('app.lastClosedUrl', App.catchSpecURL(url));
		}

		App.dispatcher.trigger('app.closedUrl', App.catchSpecURL(url));
	},

	tabActivatedHandler: function(event) {
		var tab = App.tabs[event.tabId];
		if (tab) {
			App.activeUrl = tab.url;
			App.dispatcher.trigger('app.newUrl', App.catchSpecURL(tab.url));
		}
	},

	focusChangeHandler: function(winId) {
		if (winId == chrome.windows.WINDOW_ID_NONE) {
			App.hasFocus = false;
			App.dispatcher.trigger('app.newUrl', '');
			App.dispatcher.trigger('app.firstOpenedUrl', '');
		} else {
			chrome.windows.get(winId, {populate:true}, App.windowIsFocused);
		}
	},

	windowIsFocused: function(win) {
		App.hasFocus = true;
		App.dispatcher.trigger('app.lastClosedUrl', '');
		for (var i in win.tabs) {
			var url = win.tabs[i].url;
			if (win.tabs[i].active) {
				App.dispatcher.trigger('app.newUrl', App.catchSpecURL(url));
				break;
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

    handleChangeIconListener: function(bool) {
        if (bool) {
            App.dispatcher.addListener('app.changeIcon', App.changeIcon);
        } else {
            App.dispatcher.removeListener('app.changeIcon', App.changeIcon);
        }
    },

	changeIcon: function(data) {
		chrome.browserAction.setIcon({path: 'img/icon-48'+data+'.png'});
	},

	showNotification: function(data) {

		var score = !data.score ? 0 : data.score.toFixed(3),
			imgVersion = !data.score ? '' : (score < 0 ? '-down' : '-up'),
			notification = webkitNotifications.createNotification(
			"/img/icon-48" + imgVersion + ".png",
			'HabitRPG',
			data.message ? data.message.replace('{score}', score) :
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
        this.dispatcher.addListener('app.changeIcon', function(icon){console.log('icon: '+icon); });
		this.dispatcher.addListener('app.newUrl', function(url) {console.log('new: '+url); });
		this.dispatcher.addListener('app.optionsChanged', function(data){ console.log(data); });
		this.dispatcher.addListener('app.closedUrl', function(url) { console.log('closed: '+url);});
		this.dispatcher.addListener('app.lastClosedUrl', function(url) {console.log('lastClosedUrl: '+url); });
		this.dispatcher.addListener('app.firstOpenedUrl', function(url) {console.log('firstOpenedUrl: '+url); });
	}
};

/* ------------- Mainloop ---------- */

App.init();
