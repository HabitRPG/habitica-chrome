var App = {

	activeTabId: -1,
	hasFocus: true,

	habitrpg: habitRPG,
	invalidTransitionTypes: ['auto_subframe', 'form_submit'],
  //storage: chrome.storage.managed,
	storage: chrome.storage.local,
	notificationShowTime: 4000,

	dispatcher: new utilies.EventDispatcher(),

	init: function() {
		chrome.webNavigation.onCommitted.addListener(this.navCommittedHandler);
		chrome.tabs.onActivated.addListener(this.tabActivatedHandler);
		chrome.windows.onFocusChanged.addListener(this.focusChangeHandler);
		chrome.storage.onChanged.addListener(this.setHabitRPGOptionsFromChange);

		habitrpg.init(this.dispatcher);

		this.storage.get({
			uid:'',
			days: '',
			watchedUrl: '',
			isActive: 'false',
			sendInterval: '5',
			activatorName: 'alwayon',
			viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
			goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org'

		}, function(data){ App.dispatcher.trigger('optionsChanged', data); });

		this.dispatcher.addListener('sended', this.showNotification);
		
	},

	navCommittedHandler: function(event){
		if (App.hasFocus && App.activeTabId == event.tabId && App.invalidTransitionTypes.indexOf(event.transitionType) == -1) {
			App.dispatcher.trigger('newUrl', App.catchSpecURL(event.url));
		}
	},

	tabActivatedHandler: function(event) {
		// TODO: find out why not find the event tabID...
		try { 
			chrome.tabs.get(event.tabId, function(tab){
				App.activeTabId = tab.id;
				App.dispatcher.trigger('newUrl', App.catchSpecURL(event.url));

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
			App.dispatcher.trigger('newUrl', '');

		} else {
			App.hasFocus = true;
			for (var i in win.tabs) {
				if (win.tabs[i].active) {
					App.dispatcher.trigger('newUrl', App.catchSpecURL(win.tabs[i].url));
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

		App.bridge.trigger('optionsChanged', obj);
		
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

	}
};

/* ------------- Mainloop ---------- */

App.init();
