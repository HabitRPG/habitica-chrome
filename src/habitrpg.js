
var habitRPG = (function(){

    var returnObj = {
        get: function() { return habitrpg; },
        init: function(bridge) { habitrpg.init(bridge); }
    }, 
  
    habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        appBridge: undefined,

        init: function(bridge) {

            this.appBridge = bridge;
            
            this.appBridge.addListener('controller.sendRequest', this.send);
            this.appBridge.addListener('app.optionsChanged', this.setOptions);
            

            this.controllers = {
                'sitewatcher': SiteWatcher,
                'tomatoes': Tomatoes
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.appBridge);
        
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

        send: function(data) {

            if (!habitrpg.uid) return;

            if (habitrpg.isSandBox) {
                habitrpg.appBridge.trigger('app.notify', data);
                
            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.appBridge.trigger('app.notify', data);

                });
            }
            
        }

    };

    return returnObj;

})();
