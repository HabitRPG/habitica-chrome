var Tomatoes = (function() {
/*
    BaseController.prototype.init = function(parentBridge) {  };
    BaseController.prototype.enable = function() {  }; // private use in setOptions
    BaseController.prototype.disable = function() {  }; // private use in setOptions
    BaseController.prototype.setOptions = function(params) { };
*/

    var tomatoes = {

        url: 'http://tomato.es',
        urlPrefix: 'tasks/tomatoes/',

        init: function(parentBridge) {

            this.parentBridge = parentBridge;

            this.injectCode();
        },

        enable:function() {            
            this.parentBridge.addListener('newUrl', this.injectCode);
            this.parentBridge.addListener('isOpened', this.isOpenedHandler);

        },

        disable: function() {
            this.parentBridge.removeListener('newUrl', this.injectCode);
            this.parentBridge.removeListener('isOpened', this.isOpenedHandler);

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
        isEnabled: function() { return tomatoes.parentBridge.hasListener('firstOpenedUrl', tomatoes.injectCode); },
        init: function(parentBridge) { tomatoes.init(parentBridge); },
        setOptions: function(params) { tomatoes.setOptions(params); }
    };

})();