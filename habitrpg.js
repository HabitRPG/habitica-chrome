
var habitRPG = (function(){

    var habitrpg = {

        isSandBox: true,

        sendInterval: 1000,
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
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/tasks/productivity/",

        init: function() {

            this.setActiveState();

            this.activators = Activators;

            for (var name in this.activators) 
                this.activators[name].setChangeStateFn(this.setActiveState);
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

            if (params.watchedUrl !== undefined && this.activator.setUrl)
                this.activator.setUrl(params.watchedUrl);

            else if (params.days !== undefined && this.activator.setDays)
                this.activator.setDays(params.days);
                        
            if (params.isActive && this.activatorName == 'fromOptions')
                this.activator.setState(params.isActive);            
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        checkNewPage: function(url) {
            
            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1');
            
            if (host == this.host) return;
            this.host = host;

            if (this.activator.handleNewUrl) 
                this.activator.handleNewUrl(url);

            if (!this.isActive) return;

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

        setActivator: function(name) {
            name = this.activators[name] ? name : 'alwayson';
            this.activator = this.activators[name];

            if (name == 'alwayson')
                this.activator.setState();

        },

        setActiveState: function() {
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

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        }
    };

    habitrpg.init();

    return {
        getScore: function() { return habitrpg.score; },
        isActive: function() { return habitrpg.isActive; },
        checkNewPage: function(url) { habitrpg.checkNewPage(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        sendScore: function() { return habitrpg.sendToHabitRPGHost(); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    };

})();
