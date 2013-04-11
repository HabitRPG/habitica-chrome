
var habitRPG = (function(){

    var returnObj = {
        init: function(bridge) { habitrpg.init(bridge); }
    },

    habitrpg = {

        isSandBox: false,

        controllers: undefined,

        uid: undefined,
        apiToken: undefined,

        character: undefined,

        habitUrl: "https://habitrpg.com/api/v1/user",

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

            if (params.uid !== undefined) {
                if (params.uid != habitrpg.uid)
                    habitrpg.character = undefined;

                habitrpg.uid = params.uid;
            }

            if (params.apiToken !== undefined) {
                if (params.apiToken != habitrpg.apiToken)
                    habitrpg.character = undefined;

                habitrpg.apiToken = params.apiToken;
            }

            params.isSandBox = habitrpg.isSandBox;

            for (var co in habitrpg.controllers)
                habitrpg.controllers[co].setOptions(params);

            if (!habitrpg.character && !habitrpg.isSandBox) {
                habitrpg.appBridge.trigger('app.changeIcon', '-alert');
                habitrpg.appBridge.trigger('app.listenToChangeIcon', false);

                if (!habitrpg.uid || !habitrpg.apiToken) return;

                habitrpg.setInitialCharacterData();
            }
        },

        send: function(data) {

            if (!habitrpg.uid || !habitrpg.apiToken) return;

            if (habitrpg.isSandBox) {
                habitrpg.appBridge.trigger('app.notify', data);

            } else {
                habitrpg.sendAjax({
                    type:'POST',
                    urlSuffix:'/tasks/' + data.urlSuffix,
                    callback: function(response){
                        data.score = response.delta;
                        habitrpg.appBridge.trigger('app.notify', data);

                        habitrpg.setCharacterData(response, true);
                    }
                });
            }
        },

        setInitialCharacterData: function() {
            habitrpg.sendAjax({ callback: function(response) {
                habitrpg.setCharacterData(response);
                }
            });
        },

        triggerCharacterChange: function(fromCache) {
            if (!fromCache)
                habitrpg.sendAjax({ callback: habitrpg.setCharacterData });

            habitrpg.appBridge.trigger('character.changed', habitrpg.character);
        },

        setCharacterData: function(data, onlyStats) {
            habitrpg.appBridge.trigger('app.listenToChangeIcon', true);
            habitrpg.appBridge.trigger('watcher.triggerIconChange');

            if (onlyStats) data = { stats:data };

            if (habitrpg.character && (data.stats.lvl > habitrpg.character.lvl)) {

                setTimeout(function(){
                    habitrpg.appBridge.trigger('app.notify', {
                        score: 1,
                        message: "Congratulations! You reached the "+data.stats.lvl+" level!"
                    });
                }, 5000);

            } else if (data.stats.hp < habitrpg.lowHP) {

                setTimeout(function(){
                    habitrpg.appBridge.trigger('app.notify', {
                        score: -1,
                        message: "Your HP is too low!("+Math.round(data.stats.hp)+") Quickly do something productive!"
                    });
                }, 5000);

            }

            if (onlyStats) habitrpg.character.stats = data.stats;
            else habitrpg.character = data;

            habitrpg.triggerCharacterChange(true);
        },

        sendAjax: function(options) {
            if (!options) options = {};

            var type = options.type || 'GET',
                headers = options.headers || {'x-api-user': habitrpg.uid, 'x-api-key': habitrpg.apiToken},
                url = habitrpg.habitUrl + (options.urlSuffix || ''),
                data = options.data || undefined,
                callback = options.callback || undefined;

            $.ajax({
                type: type,
                headers: headers,
                data: data,
                url: url
            }).done(function(response) {
                if (callback) callback(response);
            });
        }

    };

    return returnObj;

})();
