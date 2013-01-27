
var habitRPG = (function(){

    var habitrpg = {

        isSandBox: true,

        controllers: undefined,
        
        uid: undefined,

        host: undefined,
        
        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/users/{UID}/",

        init: function() {

            this.controllers = {
                'sitewatcher': SiteWatcher 
            };

            for (var name in this.controllers) 
                this.controllers[name].init(this);
        
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

        send: function(urlSuffix, score, message) {
   
            if (this.isSandBox) {
                if (this.scoreSendedAction)
                    this.scoreSendedAction(score, message);
            } else {
                
                $.ajax({
                    type: 'POST',
                    url: this.habitUrl + urlSuffix;
                    
                }).done(function(){
                    habitrpg.scoreSendedAction(score, message);
                });
            }
            
        },

        setScoreSendedAction: function(scoreSendedAction) {
            this.scoreSendedAction = scoreSendedAction;
        }
    };

    habitrpg.init();

    return {
        get: function() { return habitrpg; },
        sendTo: habitrpg.sendTo, 
        setOptions: habitrpg.setOptions,
        checkNewPage: habitrpg.sitewatcher.checkNewPage,
        setScoreSendedAction: habitrpg.setScoreSendedAction(callback)
    };

})();
