

describe('Activators', function(){

    describe('Always on', function(){

        var activator = Activators.alwayson;

        it ('State is always true', function(){

            activator.setState(true);
            expect(activator.state).toBe(true);

            activator.setState(false);
            expect(activator.state).toBe(true);
           
        });

    });

    describe('From options', function(){

        var activator = Activators.fromOptions;

        it ('The activator state handled outside', function(){

            activator.setState('true');
            expect(activator.state).toBe(true);

            activator.setState('false');
            expect(activator.state).toBe(false);
            
        });

    });

    describe('Page link', function(){

        var activator = Activators.webpage;

        it ('Watch for setUrl call', function(){
  
            activator.setUrl('http://habitrpg.com');
            expect(activator.state).toBe(true);
            
            activator.setUrl('http://asdyxc.com');
            expect(activator.state).toBe(false);
  
        });

        it('Only activation for new url', function(){

            expect(activator.state).toBe(false);
            activator.setUrl('http://phantomjs.org');
            expect(activator.state).toBe(false);

            activator.handleNewUrl('http://phantomjs.org');
            expect(activator.state).toBe(true);

            activator.handleNewUrl('http://asdyxc.com');
            expect(activator.state).toBe(true);
        });

        it ('Deactivation only if the windows not have any tab with the watched url', function(){

           expect(activator.state).toBe(true);
           chrome.tabs.onRemoved.trigger();
           expect(activator.state).toBe(false);

           activator.handleNewUrl('http://phantomjs.org');
           chrome.wins[1].tabs.push({url:'http://phantomjs.org'});
           chrome.tabs.onRemoved.trigger();
           expect(activator.state).toBe(true);

        });

    });

    xdescribe('Days ans Hours', function(){

        var activator = Activators.days,
            todayDate = new Date(),
            days = {
              'Monday': { active: true, start: [8,0], end: [16,30] },
              'Tuesday': { active: true, start: [8,0], end: [16,30] },
              'Wednesday': { active: true, start: [8,0], end: [16,30] },
              'Thursday': { active: true, start: [8,0], end: [16,30] },
              'Friday': { active: true, start: [8,0], end: [16,30] },
              'Saturday': { active: false, start: [8,0], end: [16,30] },
              'Sunday': { active: false, start: [8,0], end: [16,30] }
            },
            dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            today = days[dayList[todayDate.getDate()]];

        it('Before start', function(){

            today.start[0] = todayDate.getHours();
            today.start[1] = todayDate.getMinutes();

        });

    });

});