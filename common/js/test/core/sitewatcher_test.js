xdescribe('SiteWatcher tests', function(){

    var bridge = new utilies.EventDispatcher();

        SiteWatcher.init(bridge);
        SiteWatcher.setOptions({
            activatorName: 'alwayon',
            viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
            goodDomains: 'lifehacker.com\ncodecademy.com\nkhanacademy.org'
        });

    it('Enabled disabled test', function(){

        expect(SiteWatcher.isEnabled()).toBe(false);

        SiteWatcher.setOptions({siteWatcherIsActive:'true'});

        expect(SiteWatcher.isEnabled()).toBe(true);

        SiteWatcher.setOptions({siteWatcherIsActive:'false'});

        expect(SiteWatcher.isEnabled()).toBe(false);

        SiteWatcher.setOptions({siteWatcherIsActive:'true'});
    });

    it('Visit a good sites', function(){

        
        expect(SiteWatcher.getScore()).toBe(0);
        
        bridge.trigger('newUrl', 'http://lifehacker.com');

        runs(function() {
          setTimeout(function() {}, 250);
        });

        bridge.trigger('newUrl', 'http://xasdc.com');
        
        expect(SiteWatcher.getScore()).toBeGreaterThan(0);

        SiteWatcher.forceSendRequest();
        expect(SiteWatcher.getScore()).toBe(0);

    });

    it('Visit a bad sites', function(){

        bridge.trigger('newUrl', 'http://facebook.com');
        
        runs(function() {
          setTimeout(function() {}, 250);
        });

        bridge.trigger('newUrl', 'http://xasdc.com');
        
        expect(SiteWatcher.getScore()).toBeLessThan(0);
    });

});
