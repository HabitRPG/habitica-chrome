
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

        parentBridge: undefined,
        dispatcher: new utilies.EventDispatcher(),

        activator: undefined,
        activators: undefined,

        init: function(parentBridge) {

            this.parentBridge = parentBridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].init(this.dispatcher);

            this.activator = this.activators.alwaysoff;
        },

        enable:function() {
            this.activator.enable();
            this.parentBridge.addListener('newUrl', this.checkNewUrl);
            this.parentBridge.addListener('closedUrl', this.checkClosedUrl);

            this.dispatcher.addListener('getAllUrl', this.delegateAllUrl);
        },

        disable: function() {
            this.activator.disable();
            this.parentBridge.removeListener('newUrl', this.checkNewUrl);
            this.parentBridge.removeListener('closedUrl', this.checkClosedUrl);

            this.dispatcher.removeListener('getAllUrl', this.delegateAllUrl);
        },

        delegateAllUrl: function() {
            var self = this;
            this.delegateAllUrl = function() {
                self.dispatcher.trigger('allUrlGetted', App.getAllUrls);
            };
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

            this.dispatcher.removeListener('changed', this.controllSendingState);
            this.activator.disable();
            this.activator = this.activators[name];
            this.dispatcher.addListener('changed', this.controllSendingState);
            this.activator.enable();
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

        getHost: function(url) { return url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'); },

        checkNewUrl: function(url) {
            
            var host = watcher.getHost(url);
            
            if (host == watcher.host) return;
            watcher.host = host;

            watcher.dispatcher.trigger('newHost', url);
            
            if (!watcher.activator.state) return;

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());
            
        },

        // TODO: find out has any opened host
        checkClosedUrl: function(url) {
            
            var host = watcher.getHost(url);
            
            if (host != watcher.host) return;
            
            watcher.dispatcher.trigger('closedHost', url);
            
        },

        controllSendingState: function(value) {

            if (!value) {
                watcher.triggerSendRequest();
                watcher.turnOffTheSender();

            } else if (value) {
                watcher.turnOnTheSender();
            }
            
        },

        triggerSendRequest: function() {

            watcher.addScoreFromSpentTime(watcher.getandResetSpentTime());

            if (watcher.score !== 0) {
                watcher.parentBridge.triggerEvent('sendRequest', {
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
            clearInterval(this.sendIntervalID);
        }

    };

    return {
        getScore: function() { return watcher.score; },
        isEnabled: function() { return watcher.parentBridge.hasListener('newUrl', watcher.checkNewUrl); },
        init: function(parentBridge) { watcher.init(parentBridge); },
        setOptions: function(parentBridge) { watcher.setOptions(parentBridge); },
        forceSendRequest: function() { watcher.triggerSendRequest(); }
    };

})();
    
