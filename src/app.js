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

		this.dispatcher.addListener('sended', this.showNotification);
		this.dispatcher.addListener('isOpenedUrl', this.isOpenedUrlHandler);
		this.dispatcher.addListener('newUrl', function(url){App.activeUrl = url; });

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

        this.storage.get(defaultOptions, function(data){ App.dispatcher.trigger('optionsChanged', data); });

	},

	navCommittedHandler: function(tab) {
		if (!tab.id) return;

		App.triggerFirstOpenedUrl(tab.url);

		App.tabs[tab.id] = tab;
		if (App.hasFocus && tab.active && tab.url && App.invalidTransitionTypes.indexOf(tab.transitionType) == -1) {
			App.triggerFirstOpenedUrl(tab.url);
			App.dispatcher.trigger('newUrl', App.catchSpecURL(tab.url));
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
			App.dispatcher.trigger('newUrl', App.catchSpecURL(tab.url));
			App.activeUrl = tab.url;
		}
	},

	// This event fired after the remove action, so we forced to store the tabs
	tabRemovedHandler: function(tabId) {
		var url = App.tabs[tabId].url;
		delete App.tabs[tabId];
		
		if (!App.hasInTabs(url))
			App.dispatcher.trigger('lastClosedUrl', App.catchSpecURL(url));

		App.dispatcher.trigger('closedUrl', App.catchSpecURL(url));
	},

	tabActivatedHandler: function(event) {
		var tab = App.tabs[event.tabId];
		if (tab) {
			App.activeUrl = tab.url;
			App.dispatcher.trigger('newUrl', App.catchSpecURL(tab.url));
		}
	},

	focusChangeHandler: function() {
		chrome.windows.getLastFocused({populate:true}, App.windowIsFocused);
	},

	windowIsFocused: function(win) {

		if (!win.focused) {
			App.hasFocus = false;
			App.dispatcher.trigger('newUrl', '');

		} else {
			App.hasFocus = true;
			for (var i in win.tabs) {
				var url = win.tabs[i].url;
				if (win.tabs[i].active && App.activeUrl != url) {
					App.dispatcher.trigger('newUrl', App.catchSpecURL(url));
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

		App.dispatcher.trigger('optionsChanged', obj);
		
	},

	showNotification: function(data) {

		var score = data.score.toFixed(4),
			notification = webkitNotifications.createNotification(
			"/img/icon-48-" + (score < 0 ? 'down' : 'up') + ".png", 
			'HabitRPG', 
			data.message ? data.message :
			('You '+(score < 0 ? 'lost' : 'gained')+' '+score+' '+(score < 0 ? 'HP! Work or will die...' : 'Exp/Gold! Keep up the good work!'))
		);
		notification.show();
		setTimeout(function(){notification.close();}, App.notificationShowTime);
	},

	isOpenedUrlHandler: function(url) {
		if (App.hasInTabs(url))
			App.dispatcher.trigger('isOpened');
	},

	triggerFirstOpenedUrl: function(url) {
		if (!App.hasInTabs(url))
			App.dispatcher.trigger('firstOpenedUrl', App.catchSpecURL(url));
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
		this.dispatcher.addListener('newUrl', function(url) {console.log('new: '+url); });
		this.dispatcher.addListener('optionsChanged', function(data){ console.log(data); });
		this.dispatcher.addListener('closedUrl', function(url) { console.log('closed: '+url);});
		this.dispatcher.addListener('lastClosedUrl', function(url) {console.log('lastClosedUrl: '+url); });
		this.dispatcher.addListener('firstOpenedUrl', function(url) {console.log('firstOpenedUrl: '+url); });
	}
};

/* ------------- Mainloop ---------- */

App.init();
