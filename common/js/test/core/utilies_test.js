
describe('Utilies test', function(){

    describe('Event system', function(){

        var dispatcher;

        beforeEach(function(){
             dispatcher = new utilies.EventDispatcher();
        });

        it('Add eventlistener', function(){

            expect(dispatcher.listeners.check).toBeUndefined();

            dispatcher.addListener('check', function(){});

            expect(dispatcher.listeners.check).toBeTruthy();
            expect(dispatcher.listeners.check[0]).toBeTruthy();

        });

        it('Remove eventlistener', function(){

            expect(dispatcher.listeners.check).toBeUndefined();

            var fn = function(){};
            dispatcher.addListener('check', fn);
            dispatcher.removeListener('check', fn);

            expect(dispatcher.listeners.check).toBeTruthy();
            expect(dispatcher.listeners.check[0]).toBeUndefined();

            dispatcher.removeListener('noError', fn);

        });

        it('Has eventlistener', function(){

            expect(dispatcher.listeners.check).toBeUndefined();

            var fn = function(){};

            expect(dispatcher.hasListener('check', fn)).toBe(false);

            dispatcher.addListener('check', fn);
            expect(dispatcher.hasListener('check', fn)).toBe(true);

            dispatcher.removeListener('check', fn);
            expect(dispatcher.hasListener('check', fn)).toBe(false);

        });


        it('Trigger event', function(){

           var called = false,
                fn = function(){ called= true; };


            dispatcher.addListener('check', fn);
            dispatcher.trigger('check');

            expect(called).toBe(true);

        });

        it('Event flow', function(){

           var called = false,
                on = function(){ called= true; },
                off = function(){ called= false; };


            dispatcher.addListener('turnOn', on);
            dispatcher.addListener('turnOff', off);

            dispatcher.trigger('turnOn');

            dispatcher.removeListener('turnOff', off);
            dispatcher.trigger('turnOff');

            expect(called).toBe(true);

        });        

    });


    describe('Period', function(){

        var period;

        beforeEach(function(){
             dispatcher = new utilies.Period();
        });

    });

    describe('Pomodore test', function(){

        var pomo, dispatcher;

        beforeEach(function(){
            dispatcher = new utilies.EventDispatcher();
            pomo = new utilies.Pomodore('testPommo', dispatcher);
        });

        it('Work cycle', function(){

            expect(pomo.workCount).toBe(0);
            expect(pomo.currentPeriod.type).toBe('break');
            
            pomo.start();
            expect(pomo.workCount).toBe(1);
            expect(pomo.currentPeriod.type).toBe('work');

            pomo.start();
            expect(pomo.workCount).toBe(1);
            expect(pomo.currentPeriod.type).toBe('break');

            pomo.start();
            pomo.start();
            pomo.start();
            pomo.start();
            pomo.start();

            pomo.start();
            expect(pomo.workCount).toBe(4);
            expect(pomo.currentPeriod.type).toBe('break');
            expect(pomo.currentPeriod.getExpectedLength()).toBe(15);
        });

        it('Stoping', function(){

            pomo.start();

        });
    });

});