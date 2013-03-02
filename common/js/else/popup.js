
var Popup = (function() {

    var popup = {
            bridge: undefined,
            sitewatcherTimeLine: undefined,
            sitewatcher: undefined,
            charStats: undefined,

            sitewatcherState: undefined,

            init: function(appBridge){

                this.bridge = appBridge;

                this.sitewatcher = $('#sitewatcher');
                this.charStats = $('#characterStats');

                this.sitewatcherTimeLine = timeline.init('#sitewatcher .time');

                this.bridge.addListener('character.changed', this.updateCharacter);
                this.bridge.addListener('watcher.dataChanged', this.sitewatcherDataChanged);
    
                this.getCharacterData();
                this.getSitewatcherData();
            },

            getCharacterData: function() {
                this.bridge.trigger('character.forceChange');
            },

            getSitewatcherData: function() {
                this.bridge.trigger('watcher.forceChange');
            },        

            updateCharacter: function(data) {
                for (var i in data) {
                    popup.charStats.find('.'+i+' .value').text(i == 'gp' ? Math.floor(data[i]) : Math.round(data[i]));
                }
            },

            sitewatcherDataChanged: function(data) {

                if (data.state !== undefined)
                    popup.sitewatcher.find('.state .value').text(data.state ? 'active' : 'inactive');

                if (data.nextSend !== undefined)
                    popup.timeline.set(data.nextSend);

            }

        },

        timeline = {
            view: undefined,

            goalInterval: -1,
            updateInterval: -1,

            value: 0,

            init: function(selector) {
                this.view = $(selector);

                return this;
            },

            set: function(goalInterval) {
                if (goalInterval == this.goalInterval) return;

            }

        };

    return popup;

})();


jQuery('document').ready(function(){ Popup.init(appBridge); });