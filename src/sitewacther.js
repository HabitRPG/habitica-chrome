
var SiteWatcher = (function() {
/*
    BaseController.prototype.setOptions = function() {};
    BaseController.prototype.deinit = function() {  };
    BaseController.prototype.init = function() {  };
*/

    var watcher = {

        urlPrefix: 'tasks/productivity/'

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,

        sendInterval: 1000,
        sendIntervalID: -1,

        score: 0,
        timestamp: new Date().getTime(),

        bridge: undefined,
        activators: undefined,
        activator: undefined,

        init: function(bridge) {

            this.bridge = bridge;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].setChangeStateFn(this.controllSendingState);

            this.activator = this.activators.alwaysoff;

            this.bridge.addEventListener('newUrl', this.checkNewUrl);
            
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
        },

    }

    return {
        getScore: function() { return watcher.score; },
        checkNewPage: function() { return watcher.checkNewPage; },
        isActive: function() { return watcher.activator.getState(); }
    }

})();
    
