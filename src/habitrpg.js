
var habitRPG = (function(){

    var returnObj = {
        get: function() { return habitrpg; },
        newUrl: function(url) { habitrpg.newUrl(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    }, 
    controllerBridge = {
        triggerEvent: function(type, fn) { habitrpg.triggerEvent(type, data); },
        addEventListener: function(type, fn) { habitrpg.addEventListener(type, fn); },
        removeEventListener: function(type, fn) { habitrpg.removeEventListener(type, fn); },
    },
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        host: undefined,
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        events: { },

        init: function() {

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(controllerBridge);
        
            this.addEventListener('sendRequest', this.send);
        },

        setOptions: function(params) {

            if (params.uid) {
                this.uid = params.uid;
                this.habitUrl = this.sourceHabitUrl.replace('{UID}', this.uid);
            }

            params.isSandBox = this.isSandBox;

            for (var co in this.controllers) 
                this.controllers[co].setOptions(params);
            
        },

        newUrl: function(url) { this.triggerEvent('newUrl', url); },

        send: function(data) {
   
            if (habitrpg.isSandBox) {
                habitrpg.scoreSendedAction(data.score, data.message);

            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix;
                    
                }).done(function(){
                    habitrpg.scoreSendedAction(data.score, data.message);
                });
            }
            
        },

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        },

        removeEventListener: function(type, fn) {
            if (!this.events[type]) return;

            var index = this.events[type].indexOf(fn);

            if (!index == -1) return;

            this.events[type].slice(index, 1);

        },

        addEventListener: function(type, fn) {
            if (!this.events[type])
                this.events[type] = [];

            if (this.events[type].indexOf(fn) != -1 ) return;

            this.events.push(fn);
        },

        triggerEvent: function(type, data) {
            if (!this.events[type]) return;

            var listeners = this.events[type];
            for (var i=0,len=listeners.length;i<len;i++)
                listeners.apply(controllerBridge, [data])
            
        }
    };

    habitrpg.init();

    return returnObj;

})();
