

describe('Activators', function(){

    var fn = function(){};
    for (var name in Activators) 
        Activators[name].setChangeStateFn(fn);

    describe('Always', function(){

        var activatorTrue = Activators.alwayson;
        var activatorFalse = Activators.alwaysoff;

        it ('State is always true', function(){

            activatorTrue.init();
            activatorTrue.setOptions('true');
            activatorTrue.check();
            expect(activatorTrue.getState()).toBe(true);

            activatorTrue.setOptions('false');
            activatorTrue.check();
            expect(activatorTrue.getState()).toBe(true);
            activatorTrue.deinit();
           
        });

        it ('State is always false', function(){

            activatorFalse.init();
            activatorFalse.setOptions('true');
            activatorFalse.check();
            expect(activatorFalse.getState()).toBe(false);

            activatorFalse.setOptions('false');
            activatorFalse.check();
            expect(activatorFalse.getState()).toBe(false);
            activatorFalse.deinit();
           
        });

    });

    describe('From options', function(){

        var activator = Activators.fromOptions;

        it ('The activator state handled outside', function(){

            activator.init();
            activator.setOptions({isActive: 'true'});
            activator.check();
            expect(activator.getState()).toBe(true);

            activator.setOptions({isActive: 'false'});
            activator.check();
            expect(activator.getState()).toBe(false);
            activator.deinit();
            
        });

    });

    describe('Page link', function(){

        var activator = Activators.webpage;

        it ('Watch for setUrl call', function(){
  

            activator.setOptions({watchedUrl: 'http://habitrpg.com'});
            activator.check();
            expect(activator.getState()).toBe(false);

            activator.init();
            activator.check();
            expect(activator.getState()).toBe(true);
            
            activator.setOptions({watchedUrl: 'http://asdyxc.com'});
            activator.check();
            expect(activator.getState()).toBe(false);
  
        });

        it('Only activation for new url', function(){

            expect(activator.getState()).toBe(false);

            activator.setOptions({watchedUrl: 'http://phantomjs.org'});
            activator.check();
            expect(activator.getState()).toBe(false);

            activator.handleNewUrl('http://phantomjs.org');
            expect(activator.getState()).toBe(true);

            activator.handleNewUrl('http://asdyxc.com');
            expect(activator.getState()).toBe(true);
        });

        it ('Deactivation only if the windows not have any tab with the watched url', function(){

            expect(activator.getState()).toBe(true);
            chrome.tabs.onRemoved.trigger();
            expect(activator.getState()).toBe(false);

            activator.handleNewUrl('http://phantomjs.org');
            chrome.wins[1].tabs.push({url:'http://phantomjs.org'});

            activator.deinit();
            chrome.tabs.onRemoved.trigger();
            expect(activator.getState()).toBe(false);

            activator.init();
            chrome.tabs.onRemoved.trigger();
            expect(activator.getState()).toBe(true);

            activator.deinit();

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

        activator.setOptions({days:days});

        beforeEach(function(){

            monday = new Date(2013, 0, 21, 0);
            mondayStart = new Date(2013, 0, 21, 1);
            mondayEnd = new Date(2013, 0, 21, 8);
            sunday = new Date(2013, 0, 27, 6);
            sundayStart = new Date(2013, 0, 27, 7);
            sundayEnd = new Date(2013, 0, 27, 14);

            activator.init();

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
                
                activator.setState(monday);
                expect(activator.getState()).toBe(false);
                expect(activator.timeoutTime).toBe(mondayStart.getTime() - monday.getTime() + 100);

                activator.setState(sunday);
                expect(activator.getState()).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

            it('After start before End', function(){
                
                monday.setHours(2);
                activator.setState(monday);
                expect(activator.getState()).toBe(true);
                expect(activator.timeoutTime).toBe(mondayEnd.getTime() - monday.getTime() + 100);

                sunday.setHours(13);
                activator.setState(sunday);
                expect(activator.getState()).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

            it('After end', function(){

                monday.setHours(9);
                activator.setState(monday);
                expect(activator.getState()).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 22, 2) - monday.getTime() + 100);

                sunday.setHours(22);
                activator.setState(sunday);
                expect(activator.getState()).toBe(false);
                expect(activator.timeoutTime).toBe(new Date(2013, 0, 28, 1) - sunday.getTime() + 100);

            });

        });

    });

});