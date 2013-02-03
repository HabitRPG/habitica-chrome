
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

            this.setProductivityState();
            this.triggerSendRequest();

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
    
