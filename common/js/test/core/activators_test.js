

describe('Activators', function(){

    var bridge = new utilies.EventDispatcher();

    describe('Always', function(){

        var activatorTrue = Activators.alwayson;
        var activatorFalse = Activators.alwaysoff;
        activatorTrue.init(bridge);
        activatorFalse.init(bridge);

        it ('State is always true', function(){

            expect(activatorTrue.state).toBe(true);

            activatorTrue.enable();
            expect(activatorTrue.state).toBe(true);

            activatorTrue.disable();
            expect(activatorTrue.state).toBe(true);
           
        });

        it ('State is always false', function(){

            expect(activatorTrue.state).toBe(true);

            activatorTrue.enable();
            expect(activatorTrue.state).toBe(true);

            activatorTrue.disable();
            expect(activatorTrue.state).toBe(true);
           
        });

    });

    describe('Page link', function(){

        var activator = Activators.webpage,
            triggerOpened, notOpened;

        beforeEach(function(){
            bridge = new utilies.EventDispatcher();
            triggerOpened = function() { bridge.trigger('app.isOpened'); };
            notOpened = function(){ var alam; };

            activator.init(bridge);
        });

        it ('Watch for set options call', function(){
            
            activator.disable();

            activator.setOptions({watchedUrl: 'http://habitrpg.com'});
            expect(activator.state).toBe(false);

            bridge.addListener('app.isOpenedUrl', triggerOpened);
            activator.enable();
            expect(activator.state).toBe(true);
            
            activator.disable();
            expect(activator.state).toBe(false);
            
        });

        it('Only activation for new url', function(){
            activator.enable();

            bridge.trigger('app.firstOpenedUrl', 'http://asdyxc.com');
            expect(activator.state).toBe(false);

            activator.setOptions({watchedUrl: 'http://phantomjs.org'});
            bridge.trigger('app.firstOpenedUrl', 'http://phantomjs.org');
            expect(activator.state).toBe(true);

            activator.disable();
            expect(activator.state).toBe(false);
            bridge.trigger('app.firstOpenedUrl', 'http://phantomjs.org');
            expect(activator.state).toBe(false);

            activator.enable();
            bridge.trigger('app.firstOpenedUrl', 'http://phantomjs.org');
            expect(activator.state).toBe(true);

        });

        it ('Deactivation only if the windows not have any tab with the watched url', function() {
            activator.setOptions({watchedUrl: 'http://habitrpg.com'});
            bridge.addListener('app.isOpenedUrl', triggerOpened);
            activator.enable();

            expect(activator.state).toBe(true);
            
            bridge.trigger('app.lastClosedUrl', 'http://habitrpg.com');
            expect(activator.state).toBe(false);

            activator.disable();

            activator.setOptions({watchedUrl: 'http://gruntjs.com'});
            bridge.trigger('app.lastClosedUrl', 'http://gruntjs.com');
            expect(activator.state).toBe(false);

        });

    });

    describe('Days ans Hours', function(){

        var activator = Activators.days,
            monday, mondayStart, mondayEnd, sunday, sundayStart, sundayEnd;
            days = {
              'Monday': { active: true, start: [1,0], end: [8,0] },
              'Tuesday': { active: true, start: [2,0], end: [9,0] },
              'Wednesday': { active: true, start: [3,0], end: [10,0] },
              'Thursday': { active: true, start: [4,0], end: [11,0] },
              'Friday': { active: true, start: [5,0], end: [12,0] },
              'Saturday': { active: false, start: [6,0], end: [13,0] },
              'Sunday': { active: false, start: [7,0], end: [14,0] }
            },
            dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        activator.init(bridge);
        activator.setOptions({days:days});

        beforeEach(function(){

            monday = new Date(2013, 0, 21, 0);
            mondayStart = new Date(2013, 0, 21, 1);
            mondayEnd = new Date(2013, 0, 21, 8);
            sunday = new Date(2013, 0, 27, 6);
            sundayStart = new Date(2013, 0, 27, 7);
            sundayEnd = new Date(2013, 0, 27, 14);

        });

        it('Get day name', function(){

            for (var i in dayList) {
                expect(activator.getDayName(monday)).toBe(dayList[i]);
                monday.setDate(monday.getDate()+1);
            }

        });

        it('Get next day name', function(){
            
            for (var i=1; i < 7; i++) {
                expect(activator.getNextDayName(monday)).toBe(dayList[i === 6 ? 0 : i]);
                monday.setDate(monday.getDate()+1);
            }

        });

        it('Offset to nex day start time', function(){
            
            activator.offsetToNextStart(monday, monday);
            expect(monday.getHours()).toBe(2);

            activator.offsetToNextStart(sunday, sunday);
            expect(sunday.getHours()).toBe(1);
        });

        describe('SetTimeout value', function(){

            it('Before start', function(){
                
                expect(activator.getTimeoutTime(monday, mondayStart, mondayEnd)).toBe(mondayStart.getTime() - monday.getTime() + 100);
                expect(activator.getTimeoutTime(sunday, sundayStart, sundayEnd)).toBe(sundayStart.getTime() - sunday.getTime() + 100);

            });

            it('After start before End', function(){
                
                monday.setHours(2);
                expect(activator.getTimeoutTime(monday, mondayStart, mondayEnd)).toBe(mondayEnd.getTime() - monday.getTime() + 100);

                sunday.setHours(13);
                expect(activator.getTimeoutTime(sunday, sundayStart, sundayEnd)).toBe(sundayEnd.getTime() - sunday.getTime() + 100);
            });

            it('After end', function(){
                
                monday.setHours(9);
                expect(activator.getTimeoutTime(monday, mondayStart, mondayEnd)).toBe(new Date(2013, 0, 22, 2) - monday.getTime() + 100);

                sunday.setHours(22);
                expect(activator.getTimeoutTime(sunday, sundayStart, sundayEnd)).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);
            });
        });

        describe('Set states', function(){

            it('Before start', function(){
                
                activator.checkDate(monday);
                expect(activator.state).toBe(false);
                expect(activator.timeoutTime).toBe(mondayStart.getTime() - monday.getTime() + 100);

                activator.checkDate(sunday);
                expect(activator.state).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

            it('After start before End', function(){
                
                monday.setHours(2);
                activator.checkDate(monday);
                expect(activator.state).toBe(true);
                expect(activator.timeoutTime).toBe(mondayEnd.getTime() - monday.getTime() + 100);

                sunday.setHours(13);
                activator.checkDate(sunday);
                expect(activator.state).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

            it('After end', function(){

                monday.setHours(9);
                activator.checkDate(monday);
                expect(activator.state).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 22, 2) - monday.getTime() + 100);

                sunday.setHours(22);
                activator.checkDate(sunday);
                expect(activator.state).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

        });

    });

});