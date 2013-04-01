
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
        for (var i=0,len=listeners.length;i<len;i++) {
            if (listeners[i])
                listeners[i].apply(this.context, [data]);

        }
    };


    /* ----------------- Time Period ---------------- */
    function Period(length, type) {
        this.setExpectedLength(length);
        this.type = type;
    }

    Period.prototype.start = function() {
        this.begun = new Date().getTime();
        this.overTime = undefined;
    };

    Period.prototype.setExpectedLength = function(length) {
        this.expectedLength = length * 60000;
    };

    Period.prototype.getExpectedLength = function(length) {
        return this.expectedLength / 60000;
    };

    Period.prototype.getOverTime = function() {
        var time = new Date().getTime() - this.begun;
        return (time - this.expectedLength) / 60000;
    };

    Period.prototype.stop = function() {
        this.begun = undefined;
        this.overTime = this.getOverTime();
    };
    Period.prototype.isStarted = function() { return this.begun !== undefined; };
    Period.prototype.isFinnished = function() { return this.overTime !== undefined; };



    /* ----------------- Pomodore ---------------- */
    var Pomodore = function(eventNamespace, parentBridge){
        this.workCount = 0;
        this.parentBridge = parentBridge;
        this.eventNamespace = eventNamespace || 'pomodore';

        this.periods = {
            'work': new Period(25, 'work'),
            'break': new Period(5, 'break'),
            'bigBreak': new Period(15, 'break')
        };
        this.currentPeriod = new Period(0, 'break');

        this.maxOverTimeInterval = 45000;
        this.overTimeInterval = this.maxOverTimeInterval;
        this.timeOutId = undefined;
        this.handleOverTime();
    };

    Pomodore.prototype.isRunning = function() {
        return this.timeOutId !== undefined;
    };

    Pomodore.prototype.reset = function() {
        this.stop();
        this.workCount = 0;
    };

    Pomodore.prototype.stop = function(isSilent) {
        var wasWork = false;
        this.currentPeriod.stop();

        if (this.currentPeriod.type == 'work') {
            wasWork = true;
            this.workCount--;
            this.currentPeriod = this.periods['break'];
        }

        this.timeOutId = clearTimeout(this.timeOutId);

        if (!isSilent)
            this.parentBridge.trigger(this.eventNamespace+'.stopped', wasWork);
    };

    Pomodore.prototype.start = function() {

        var isWork, overTime = 0;

        if (!this.currentPeriod.isStarted()) {
            this.currentPeriod.stop();
            overTime = this.currentPeriod.overTime;
        }

        if (this.currentPeriod.type == 'break' ) {
            isWork = true;
            this.workCount++;
            this.currentPeriod = this.periods.work;

        } else if (this.workCount % 4 === 0) {
            this.currentPeriod = this.periods.bigBreak;

        } else {
            this.currentPeriod = this.periods['break'];
        }

        this.currentPeriod.start();

        clearTimeout(this.timeOutId);
        this.overTimeInterval = this.maxOverTimeInterval;
        this.timeOutId = setTimeout(this.handleOverTime, this.currentPeriod.expectedLength + this.maxOverTimeInterval);

        this.parentBridge.trigger(this.eventNamespace+'.started', {
                type: this.currentPeriod.type,
                tomatoCount: this.workCount,
                lastOverTime: overTime
            });
    };

    Pomodore.prototype.handleOverTime = function() {
        var self = this;
        this.handleOverTime = function() {

            self.parentBridge.trigger(self.eventNamespace+'.overTime', {type: self.currentPeriod.type, time:self.currentPeriod.getOverTime() });

            clearTimeout(self.timeOutId);
            self.timeOutId = setTimeout(self.handleOverTime, self.overTimeInterval);

            if (self.overTimeInterval > 15000)
                self.overTimeInterval -= 5000;
        };
    };

    /* ----------------- return ---------------- */
    return {
        EventDispatcher: EventDispatcher,
        Pomodore:Pomodore,
        Period:Period
    };


})();