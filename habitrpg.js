
var habitRPG = (function(){

    var habitrpg = {

        isSandBox: true,

        sendInterval: 1000,
        sendIntervalID: -1,

        goodTimeMultiplier: 0.05,
        badTimeMultiplier: 0.1,
        
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

            this.activator = this.activators.alwaysoff;
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

            for (var ac in this.activators) 
                this.activators[ac].setOptions(params);
            
            this.setValue(params, 'activatorName');
            this.setActivator(this.activatorName);
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        setActivator: function(name) {
            name = this.activators[name] ? name : 'alwayson';

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

        setActiveState: function() {
            var self = this;

            this.setActiveState = function(value) {
                if (!value) {
                    self.sendToHabitRPGHost();
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
        get: function() { return habitrpg; },
        getScore: function() { return habitrpg.score; },
        isActive: function() { return habitrpg.activator.getState(); },
        checkNewPage: function(url) { habitrpg.checkNewPage(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        sendScore: function() { return habitrpg.sendToHabitRPGHost(); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    };

})();
