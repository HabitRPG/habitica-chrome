
var Popup = (function() {

    function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    function hsl2Hex(h, s, l){
        var r, g, b;

        if(s === 0){
            r = g = b = l;
        }else{

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return "#" + Math.round((1 << 24) + ((r * 255) << 16) + ((g * 255) << 8) + (b * 255)).toString(16).slice(1);
    }

    var popup = {
            bridge: undefined,
            sitewatcherTimeLine: undefined,
            sitewatcher: undefined,
            charStats: undefined,

            sitewatcherState: undefined,

            updateInterval: 1000,

            init: function(appBridge){

                this.bridge = appBridge;

                this.sitewatcher = $('#Sitewatcher');
                this.charStats = $('#CharacterStats');

                this.sitewatcherTimeLine = $('#Sitewatcher .time .bar div');

                this.bridge.addListener('character.changed', this.updateCharacter);
                this.bridge.addListener('watcher.dataChanged', this.sitewatcherDataChanged);
    
                this.getBackgroundData();

                setInterval(
                    function(){
                        popup.bridge.trigger('watcher.forceChange');

                }, popup.updateInterval);
            },

            getBackgroundData: function() {
                popup.bridge.trigger('character.forceChange');
                popup.bridge.trigger('watcher.forceChange');
            },

            updateCharacter: function(data) {
                for (var i in data) {
                    popup.charStats.find('.'+i+' .value').text(i == 'gp' ? Math.floor(data[i]) : Math.round(data[i]));
                }
            },

            sitewatcherDataChanged: function(data) {
                popup.sitewatcher.find('.state .value').text(data.state ? 'active' : 'inactive');
                
                // update the timeline
                var now = new Date().getTime(), 
                    width = (data.nextSend - now) / (data.nextSend - data.lastSend),
                    // the score clapped between -1 and 1 but we need a number between 0 and 120
                    // score shifted to 0 and 2 then normalized and scale up
                    mappedScore = ((data.score + 1) / 2) * 120,
                    // converter need a 0-1 hue value 
                    color = hsl2Hex(mappedScore/360, 0.9, 0.5);
                
                popup.sitewatcherTimeLine.css({ width:(width * 100)+'%', 'background-color': color });

            }

        };

    return popup;

})();


jQuery('document').ready(function(){ Popup.init(appBridge); });