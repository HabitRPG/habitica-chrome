var Todos = (function() {
/*
    BaseController.prototype.init = function(appBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var todos = {

        urlPrefix: 'tasks/todos/',

        init: function(appBridge) {

            this.appBridge = appBridge;
        },

        enable: function() {
            this.appBridge.addListener('todos.complete', this.completeHandler);
            this.appBridge.addListener('todos.unComplete', this.unCompleteHandler);
            this.appBridge.addListener('todos.dueDateOver', this.dueDateOverHandler);
        },

        disbale: function() {
            this.appBridge.removeListener('todos.complete', this.completeHandler);
            this.appBridge.removeListener('todos.unComplete', this.unCompleteHandler);
            this.appBridge.removeListener('todos.dueDateOver', this.dueDateOverHandler);
        },

        setOptions: function(params) {

            if (params.todosIsActive) {
                if (params.todosIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }

        },

        completeHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: 1,
                urlSuffix: todos.urlPrefix,
                message: "Yupi! Just completed a task! [+1] Exp/Gold"
            });
        },

        unCompleteHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: -1,
                urlSuffix: todos.urlPrefix,
                message: "I thought it was done :( [-1] HP"
            });
        },

        dueDateOverHandler: function(data) {
            todos.appBridge.trigger('controller.sendRequest', {
                score: -1,
                urlSuffix: todos.urlPrefix,
                message: "Hurry! You are late! [-1] HP"
            });  
        }
    };


    return {
        get: function() { return todos; },
        isEnabled: function() { return todos.appBridge.hasListener('todos.complete', todos.completeHandler); },
        init: function(appBridge) { todos.init(appBridge); },
        setOptions: function(params) { todos.setOptions(params); }
    };

})();