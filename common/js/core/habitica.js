
var habitica = (function(){

    var returnObj = {
        init: function(bridge) { habitica.init(bridge); }
    },

    habitica = {

        isSandBox: false,

        controllers: undefined,

        uid: undefined,
        apiToken: undefined,

        character: undefined,

        habitUrl: "https://habitica.com/api/v2/user",

        appBridge: undefined,

        lowHP: 10,
        gold: 100,

        init: function(bridge) {

            this.appBridge = bridge;

            this.appBridge.addListener('controller.sendRequest', this.send);
            this.appBridge.addListener('controller.addTask', this.sendTask);
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
                if (params.uid != habitica.uid)
                    habitica.character = undefined;

                habitica.uid = params.uid;
            }

            if (params.apiToken !== undefined) {
                if (params.apiToken != habitica.apiToken)
                    habitica.character = undefined;

                habitica.apiToken = params.apiToken;
            }

            params.isSandBox = habitica.isSandBox;

            for (var co in habitica.controllers)
                habitica.controllers[co].setOptions(params);

            if (!habitica.character && !habitica.isSandBox) {
                habitica.appBridge.trigger('app.changeIcon', '-alert');
                habitica.appBridge.trigger('app.listenToChangeIcon', false);

                if (!habitica.uid || !habitica.apiToken) return;

                habitica.setInitialCharacterData();
            }
        },

        sendTask: function (data) {
            if (!habitica.uid || !habitica.apiToken) {
                return;
            }

            if (habitica.isSandBox) {
                habitica.appBridge.trigger('app.notify', data);

            } else {
                habitica.sendAjax({
                    type: 'GET',
                    urlSuffix: '/tasks/' + data.urlSuffix,
                    callbackError: function (response) {
                        habitica.sendAjax({
                            type: 'POST',
                            urlSuffix: '/tasks/',
                            data: $.extend({}, data.object),
                            callback: function (response) {
                                habitica.appBridge.trigger('app.notify.newtask', response);
                            }
                        });
                    }
                });
            }
        },

        send: function(data, type) {
            type = type || 'POST';
            if (!habitica.uid || !habitica.apiToken) return;

            if (habitica.isSandBox) {
                habitica.appBridge.trigger('app.notify', data);

            } else {
                habitica.sendAjax({
                    type: type,
                    urlSuffix:'/tasks/' + data.urlSuffix,
                    data: data.object || undefined,
                    callback: function(response){
                        data.score = response.delta;
                        habitica.appBridge.trigger('app.notify', data);

                        habitica.setCharacterData(response, true);
                    }
                });
            }
        },

        setInitialCharacterData: function() {
            habitica.sendAjax({ callback: function(response) {
                habitica.setCharacterData(response);
                }
            });
        },

        triggerCharacterChange: function(fromCache) {
            if (!fromCache)
                habitica.sendAjax({ callback: habitica.setCharacterData });

            habitica.appBridge.trigger('character.changed', habitica.character);
        },

        setCharacterData: function(data, onlyStats) {
            habitica.appBridge.trigger('app.listenToChangeIcon', true);
            habitica.appBridge.trigger('watcher.triggerIconChange');

            if (onlyStats) data = { stats:data };

            if (habitica.character && (data.stats.lvl > habitica.character.lvl)) {

                setTimeout(function(){
                    habitica.appBridge.trigger('app.notify', {
                        score: 1,
                        message: "Congratulations! You reached the "+data.stats.lvl+" level!"
                    });
                }, 5000);

            } else if (data.stats.hp < habitica.lowHP) {

                setTimeout(function(){
                    habitica.appBridge.trigger('app.notify', {
                        score: -1,
                        message: "Your HP is too low!("+Math.round(data.stats.hp)+") Quickly do something productive!"
                    });
                }, 5000);

            }

            if (onlyStats) habitica.character.stats = data.stats;
            else habitica.character = data;

            habitica.triggerCharacterChange(true);
        },

        sendAjax: function(options) {
            if (!options) options = {};

            var type = options.type || 'GET',
                headers = options.headers || {'x-api-user': habitica.uid, 'x-api-key': habitica.apiToken},
                url = habitica.habitUrl + (options.urlSuffix || ''),
                data = options.data || undefined,
                callback = options.callback || undefined,
                errorCallback = options.callbackError || undefined;

            $.ajax({
                type: type,
                headers: headers,
                data: data,
                url: url
            }).done(function(response) {
                if (callback) callback(response);
            }).fail(function(error){
                if(errorCallback) errorCallback(error);
            });
        }

    };

    return returnObj;

})();
