
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

        parentBridge: undefined,
        dispatcher: new utilies.EventDispatcher(),

        init: function(bridge) {

            this.parentBridge = bridge;
            this.parentBridge.addListener('newUrl', this.newUrl);
            this.parentBridge.addListener('closedUrl', this.closedUrl);
            this.parentBridge.addListener('isOpened', this.isOpenedHandler);
            this.parentBridge.addListener('optionsChanged', this.setOptions);
            this.parentBridge.addListener('lastClosedUrl', this.lastClosedUrlHandler);
            this.parentBridge.addListener('firstOpenedUrl', this.firstOpenedUrlHandler);

            this.dispatcher.addListener('sendRequest', this.send);
            this.dispatcher.addListener('isOpenedUrl', this.isOpenedUrlHandler);

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this.dispatcher);
        
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

        lastClosedUrlHandler: function(url) { 
            habitrpg.dispatcher.trigger('lastClosedUrl', url); 
        },

        firstOpenedUrlHandler: function(url) { 
            habitrpg.dispatcher.trigger('firstOpenedUrl', url); 
        },

        isOpenedHandler: function() {
            habitrpg.dispatcher.trigger('isOpened');
        },

        isOpenedUrlHandler: function(url) {
            habitrpg.parentBridge.trigger('isOpenedUrl', url);
        },

        send: function(data) {

            if (!habitrpg.uid) return;

            if (habitrpg.isSandBox) {
                habitrpg.parentBridge.trigger('sended', data);
                
            } else {
                
                $.ajax({
                    type: 'POST',
                    url: habitrpg.habitUrl + data.urlSuffix
                    
                }).done(function(){
                    habitrpg.parentBridge.trigger('sended', data);

                });
            }
            
        }

    };

    return returnObj;

})();
