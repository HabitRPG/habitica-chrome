
var Popup = (function() {

    var popup = {
            bridge: undefined,
            browser: undefined,
            siteWatcherTimeLine: undefined,
            siteWatcher: undefined,
            charStats: undefined,

            init: function(appBridge, browser){

                this.browser = browser;
                this.bridge = appBridge;

                this.siteWatcher = $('#sitewatcher');
                this.charStats = $('#characterStats');

                this.siteWatcherTimeLine = timeline.init('#sitewatcher .time');

                this.bridge.addListener('character.changed', this.updateCharacter);
                this.bridge.addListener('watcher.dataChanged', this.siteWatcherDataChanged);
    
                this.getCharacterData();
                this.getSitewatcherData();
            },

            getCharacterData: function() {
                this.bridge.trigger('character.forceChange');
            },

            getSitewatcherState: function() {
                this.bridge.trigger('watcher.forceChange');
            },        

            updateCharacter: function(data) {
                for (var i in data) {
                    popup.charStats.find('.'+i+' .value').text(i == 'gp' ? Math.floor(data[i]) : Math.round(data[i]));
                }
            },

            siteWatcherDataChanged: function(data) {
                popup.sitewatcher.find('.state .value').text(data.state ? 'active' : 'inactive');
                popup.sitewatcher.find('.score .value').text(data.score.toFixed(4));

                popup.timeline.set(data.nextSend);

                if (data.score < 0) popup.browser.changeIcon('down');
                else if (data.score > 0) popup.browser.changeIcon('up');
                else popup.browser.changeIcon('');
            }

        },

        timeline = {
            view: undefined,

            goalInterval: -1,
            updateInterval: -1,

            value: 0,

            ini: function(selector) {
                this.view = $(selector);

                return this;
            },

            set: function(goalInterval) {
                if (goalInterval == this.goalInterval) return;


            }

        };

    return popup;

})();


jQuery('document').ready(function(){ Popup.init(appBridge, browser); });