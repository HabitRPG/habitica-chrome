
var habitRPG = (function(){

    var returnObj = {
        get: function() { return habitrpg; },
        init: function(bridge) { habitrpg.init(bridge); }
    },

    habitrpg = {

        isSandBox: true,

        controllers: undefined,

        uid: undefined,
        apiToken: undefined,

        character: undefined,

        habitUrl: '',
        sourceHabitUrl: "https://habitrpg.com/v1/users/{UID}/",

        appBridge: undefined,

        lowHP: 10,
        gold: 100,

        init: function(bridge) {

            this.appBridge = bridge;
            
            this.appBridge.addListener('controller.sendRequest', this.send);
            this.appBridge.addListener('app.optionsChanged', this.setOptions);
            this.appBridge.addListener('character.forceChange', this.triggerCharacterChange);

            this.controllers = {
                'sitewatcher': SiteWatcher,
                'tomatoes': Tomatoes,
                'todos': Todos
            };

            for (var name in this.controllers)
                this.controllers[name].init(this.appBridge);

        },

        setOptions: function(params) {

            if (params.uid) {
                if (params.uid != habitrpg.uid)
                    habitrpg.character = undefined;

                habitrpg.uid = params.uid;
                habitrpg.habitUrl = habitrpg.sourceHabitUrl.replace('{UID}', habitrpg.uid);
            }

            if (params.apiToken) {
                if (params.apiToken != habitrpg.apiToken)
                    habitrpg.character = undefined;

                habitrpg.apiToken = params.apiToken;
            }

            params.isSandBox = habitrpg.isSandBox;

            for (var co in habitrpg.controllers)
                habitrpg.controllers[co].setOptions(params);

            if (!habitrpg.character && !habitrpg.isSandBox)
                habitrpg.setInitialCharacterData();
        },

        send: function(data) {

            if (!habitrpg.uid || !habitrpg.apiToken) return;

            if (habitrpg.isSandBox) {
                habitrpg.appBridge.trigger('app.notify', data);

            } else {

                $.ajax({
                    type: 'POST',
                    data: { apiToken: habitrpg.apiToken },
                    url: habitrpg.habitUrl + data.urlSuffix

                }).done(function(response){

                    data.score = response.delta;
                    habitrpg.appBridge.trigger('app.notify', data);

                    habitrpg.setCharacterData(response);
                });
            }
        },

        setInitialCharacterData: function() {

            $.ajax({
                type: 'POST',
                data: { apiToken: habitrpg.apiToken },
                url: habitrpg.habitUrl + 'tasks/extension/up'

            }).done(function(response) {

                habitrpg.appBridge.trigger('app.notify', {
                    score: response.delta,
                    message: 'Because you deserve it {score} EXP/Gold! :)'
                });

                habitrpg.appBridge.trigger('app.listenToChangeIcon', true);
                habitrpg.appBridge.trigger('watcher.triggerIconChange');

                habitrpg.setCharacterData(response);
            });

        },

        triggerCharacterChange: function() {
            habitrpg.appBridge.trigger('character.changed', habitrpg.character);
        },

        setCharacterData: function(data) {

            if (habitrpg.character && (data.lvl > habitrpg.character.lvl)) {

                setTimeout(function(){
                    habitrpg.appBridge.trigger('app.notify', {
                        score: 1,
                        message: "Congratulations! You reached the "+data.lvl+" level!"
                    });
                }, 5000);

            } else if (data.hp < habitrpg.lowHP) {

                setTimeout(function(){
                    habitrpg.appBridge.trigger('app.notify', {
                        score: -1,
                        message: "Your HP is too low!("+Math.round(data.hp)+") Quickly do something productive!"
                    });
                }, 5000);

            }

            habitrpg.character = data;
            habitrpg.triggerCharacterChange();
        }

    };

    return returnObj;

})();
