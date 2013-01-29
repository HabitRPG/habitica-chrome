
var habitRPG = (function(){

    var returnObj = {
        //get: function() { return habitrpg; },
        newUrl: function(url) { habitrpg.newUrl(url); },
        setOptions: function(params) { habitrpg.setOptions(params); },
        setScoreSendedAction: function(callback) { habitrpg.setScoreSendedAction(callback); }
    }, 
  
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        host: undefined,
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        dispatcher: new utilies.EventDispatcher(),

        init: function() {

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.dispatcher);
        
            this.dispatcher.addListener('sendRequest', this.send);
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

        newUrl: function(url) { 
            this.dispatcher.trigger('newUrl', url); 
        },

        send: function(data) {
   
            if (habitrpg.isSandBox) {
                habitrpg.scoreSendedAction(data.score, data.message);

            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.scoreSendedAction(data.score, data.message);
                });
            }
            
        },

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        }
    };

    habitrpg.init();

    return returnObj;

})();
