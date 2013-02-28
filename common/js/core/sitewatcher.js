
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
        isVerbose: true,

        init: function(appBridge) {

            this.appBridge = appBridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].init(this.appBridge);

            this.activator = this.activators.alwaysoff;

            this.appBridge.addListener('watcher.forceChange', this.spreadData);
        },

        isEnabled: function() {
            return watcher.appBridge.hasListener('app.newUrl', watcher.checkNewUrl);
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

        spreadState: function() {
            var isActive = watcher.isEnabled();
            isActive = isActive ? watcher.activator.state : false;

            watcher.appBridge.trigger('watcher.activator.changed', {
                isActive: isActive,
                score: watcher.score
                // TODO: store the last sended time for can compute the next one
            });

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

            this.isVerbose = params.isVerboseSiteWatcher == 'true' ? true : false;

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

            watcher.setProductivityState(watcher.activator.state && watcher.isVerbose);

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
                        message: 'Great!'+(this.isSwapped ? ' Just relax :)' : ' Maybe started working:)')
                    };

                } else if (state < 0) {
                    data = {
                        score: -1,
                        message: "I'm watching you!"+(this.isSwapped ? "Do not work now!" :" Lets go to work!")
                    };

                } else if (!state) {
                    data = {
                        message: 'You are entering a neutral zone!'
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
                    urlSuffix: watcher.urlPrefix+(watcher.score < 0 ? 'down' : 'up')
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
    
