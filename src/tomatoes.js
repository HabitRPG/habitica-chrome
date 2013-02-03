var Tomatoes = (function() {
/*
    BaseController.prototype.init = function(appBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var tomatoes = {

        url: 'http://tomato.es',
        urlPrefix: 'tasks/tomatoes/',
        appBridge: undefined,

        init: function(appBridge) {

            this.appBridge = appBridge;

            this.injectCode();
        },

        enable:function() {            
            this.appBridge.addListener('app.newUrl', this.injectCode);
            this.appBridge.addListener('app.isOpened', this.isOpenedHandler);

        },

        disable: function() {
            this.appBridge.removeListener('app.newUrl', this.injectCode);
            this.appBridge.removeListener('app.isOpened', this.isOpenedHandler);

        },

        setOptions: function(params) {


            if (!params.isSandBox) {

            }

            if (params.tomatoesIsActive) {
                if (params.tomatoesIsActive == 'true')
                    this.enable();
                else 
                    this.disable();
            }

        },

        setValue: function(params, name) { 
            if (params[name]) this[name] = params[name];
        },

        isOpenedHandler: function() {

        },

        injectCode: function() {
            var self = this;
            this.injectCode = function(url) {
                if (url.indexOf(self.url) === 0) {

                }
            };
        }
    };


    return {
        get: function() { return tomatoes; },
        isEnabled: function() { return tomatoes.appBridge.hasListener('app.firstOpenedUrl', tomatoes.injectCode); },
        init: function(appBridge) { tomatoes.init(appBridge); },
        setOptions: function(params) { tomatoes.setOptions(params); }
    };

})();