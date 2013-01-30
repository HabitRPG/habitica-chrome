
var utilies = (function(){


    /* ----------------- Event system ---------------- */
    function EventDispatcher(context) {
        this.listeners = {};
        this.context = context ? context : this;
    }
    EventDispatcher.prototype.addListener= function(type, fn) {
        if (!this.listeners[type])
            this.listeners[type] = [];

        if (this.listeners[type].indexOf(fn) != -1 ) return;

        this.listeners[type].push(fn);
    };
    EventDispatcher.prototype.removeListener = function(type, fn) {
        if (!this.listeners[type]) return;

        var index = this.listeners[type].indexOf(fn);

        if (index === -1) return;
        
        this.listeners[type].splice(index, 1);
        
    };
    EventDispatcher.prototype.hasListener = function(type, fn) {
        if (!this.listeners[type]) return false;
        return this.listeners[type].indexOf(fn) !== -1;
    };
    EventDispatcher.prototype.trigger = function(type, data) {
        if (!this.listeners[type]) return;

        var listeners = this.listeners[type];
        for (var i=0,len=listeners.length;i<len;i++)
            listeners[i].apply(this.context, [data]);
    };

    return {
        EventDispatcher: EventDispatcher
    };


})();