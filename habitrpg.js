
var habitRPG = (function(){

    var habitrpg = {

        isSandBox: true,

        sendInterval: 5000,
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
        
        habitUrl: 'alma',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/tasks/productivity/",

        init: function() {
            this.setActiveState();

            this.activators = {
                'alwayson': new AlwaysonActivator(this.setActiveState),
                'fromOptions': new FromOptionsActivator(this.setActiveState)
            };
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

            if (params.isActive && this.activatorName == 'fromOptions') {
                this.activator.setState(params.isActive);
            }
            
        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        checkNewPage: function(url) {
            if (!this.isActive) return;

            var host = url.replace(/https?:\/\/w{0,3}\.?([\w.\-]+).*/, '$1'), spentTime;

            if (host == this.host) return;

            if (this.activator.handleUrl) 
                this.activator.handleUrl(url);

            this.addScoreFromSpentTime(this.getandResetSpentTime());

            this.host = host;

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
                    if (this.scoreSendCallback)
                        this.scoreSendCallback(this.score);
                } else {
                    var sc = this.score;
                    
                    $.ajax({
                        type: 'POST',
                        url: this.habitUrl + (sc < 0 ? 'down' : 'up')
                        
                    }).done(function(){
                        habitrpg.scoreSendCallback(sc);
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

        setActiveState: function(value) {
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

        setScoreSendCallback: function(scoreSendCallback) {
            this.scoreSendCallback = scoreSendCallback;
        }
    };

    habitrpg.init();

    return {
        checkNewPage: function(url) { habitrpg.checkNewPage(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        setScoreSendCallback: function(callback) { habitrpg.setScoreSendCallback(callback); }
    };
})();
