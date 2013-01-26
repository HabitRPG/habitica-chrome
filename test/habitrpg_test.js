describe('HabitRPG', function(){

    var habit = habitRPG;

    it('Shoud be 0 score and deactivated', function(){

        expect(habit.getScore()).toBe(0);
        expect(habit.isActive()).toBe(false);

    });

    describe('Good and bad sites', function(){

        it('Visit a good sites', function(){

            habit.setOptions({
                uid:'alma',
                activatorName: 'alwayon',
                viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
                goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org'
            });

            expect(habit.getScore()).toBe(0);
            expect(habit.isActive()).toBe(true);
            
            habit.checkNewPage('http://lifehacker.com');

            runs(function() {
              setTimeout(function() {}, 250);
            });

            habit.checkNewPage('http://xasdc.com');
            expect(habit.getScore()).toBeGreaterThan(0);

            habit.sendScore();
            expect(habit.getScore()).toBe(0);

        });

        it('Visit a bad sites', function(){

            habit.checkNewPage('http://facebook.com');

            runs(function() {
              setTimeout(function() {}, 250);
            });

            habit.checkNewPage('http://xasdc.com');
            expect(habit.getScore()).toBeLessThan(0);
        });

    });

});