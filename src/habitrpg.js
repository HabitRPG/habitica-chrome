
var habitRPG = (function(){

    var returnObj = {
        //get: function() { return habitrpg; },
        init: function(bridge) { habitrpg.init(bridge); }
    }, 
  
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        host: undefined,
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        parentBridge: undefined,
        dispatcher: new utilies.EventDispatcher(),

        init: function(bridge) {

            this.parentBridge = bridge;
            this.parentBridge.addListener('newUrl', this.newUrl);
            this.parentBridge.addListener('closedUrl', this.closedUrl);
            this.parentBridge.addListener('optionsChanged', this.setOptions);

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.dispatcher);
        
            this.dispatcher.addListener('sendRequest', this.send);
        },

        setOptions: function(params) {

            if (params.uid) {
                habitrpg.uid = params.uid;
                habitrpg.habitUrl = habitrpg.sourceHabitUrl.replace('{UID}', habitrpg.uid);
            }

            params.isSandBox = habitrpg.isSandBox;

            for (var co in habitrpg.controllers) 
                habitrpg.controllers[co].setOptions(params);
            
        },

        newUrl: function(url) { 
            habitrpg.dispatcher.trigger('newUrl', url); 
        },

        closedUrl: function(url) { 
            habitrpg.dispatcher.trigger('closedUrl', url); 
        },

        send: function(data) {
   
            if (habitrpg.isSandBox) {
                habitrpg.parentBridge.trigger('sended', data);
                habitrpg.scoreSendedAction(data.score, data.message);

            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.parentBridge.trigger('sended', data);
                    habitrpg.scoreSendedAction(data.score, data.message);
                });
            }
            
        }

    };

    return returnObj;

})();
