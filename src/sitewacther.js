
var SiteWatcher = (function() {

    BaseController.prototype.setOptions = function() {};
    BaseController.prototype.deinit = function() { this.enabled = false; };
    BaseController.prototype.init = function() { this.enabled = true; };


    var watcher = {

        urlPrefix: 'tasks/productivity/'

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,

        sendInterval: 1000,
        sendIntervalID: -1,

        score: 0,
        timestamp: new Date().getTime(),

        parent: undefined,
        activators: undefined,
        activator: undefined,

        init: function(parent) {

            this.parent = parent;
            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].setChangeStateFn(this.setActiveState);

            this.activator = this.activators.alwaysoff;

            this.send();
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

        checkNewPage: function(url) {
            
            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1');
            
            if (host == this.host) return;
            this.host = host;

            if (this.activator.handleNewUrl) 
                this.activator.handleNewUrl(url);

            if (!this.activator.getState()) return;

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

        send: function() {

            var self = this;

            this.send = function() {
                self.addScoreFromSpentTime(self.getandResetSpentTime());

                if (self.score !== 0) {
                    self.parent.send(self.urlPrefix+(self.score < 0 ? 'down' : 'up'), self.score);
                }
            }
        },

        setActiveState: function() {
            var self = this;

            this.setActiveState = function(value) {
                if (!value) {
                    self.send();
                    self.turnOffTheSender();
                } else if (value) {
                    if (self.uid) {
                        self.turnOnTheSender();
                    }
                }
            };
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
        checkNewPage: watcher.checkNewPage,
        getScore: function() { return watcher.score; },
        isActive: function() { return watcher.activator.getState(); }
    }

})();
    
