
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
            days: ['su', 'm', 't', 'w', 'th', 'f', 's'],

            init: function(appBridge){

                this.bridge = appBridge;

                this.sitewatcher = $('#Sitewatcher');
                this.charStats = $('#CharacterStats');

                this.sitewatcherTimeLine = $('#Sitewatcher .time .bar div');

                this.bridge.addListener('character.changed', this.updateCharacter);
                this.bridge.addListener('watcher.dataChanged', this.sitewatcherDataChanged);

                this.getBackgroundData();

                $('#Sitewatcher .state .value').on('click', function(){
                    if (popup.sitewatcherState < 0) return;

                    if (popup.sitewatcherState == 1) {
                        saveSiteWatcherState('false');
                        popup.sitewatcherState = 0;
                    } else {
                        saveSiteWatcherState('true');
                        popup.sitewatcherState = 1;
                    }
                });

                setInterval(
                    function(){
                        popup.bridge.trigger('watcher.forceChange');

                }, popup.updateInterval);

                setTimeout(function(){
                    $('#Main *:focus').blur();
                }, 100);
            },

            getBackgroundData: function() {
                popup.bridge.trigger('character.forceChange');
                popup.bridge.trigger('watcher.forceChange');
            },

            updateCharacter: function(data) {

                if (data) {
                    $('#NotConnected').css('display', 'none');
                    $('#Connected').css('display', 'block');
                } else {
                    $('#Connected').css('display', 'none');
                    $('#NotConnected').css('display', 'block');
                    return;
                }

                for (var i in data.stats) {
                    popup.charStats.find('.'+i+' .value').text(i == 'gp' ? Math.floor(data.stats[i]) : Math.round(data.stats[i]));
                }
                var hp = popup.charStats.find('.hp .bar div'),
                    exp = popup.charStats.find('.exp .bar div');

                hp.css('width', Math.round((data.stats.hp / data.stats.maxHealth) * 100)+'%');
                exp.css('width', Math.round((data.stats.exp / data.stats.toNextLevel) * 100)+'%');

                popup.updateUncompletedTasks(data.tasks);
            },

            updateUncompletedTasks: function(tasks) {
                var ucd = $('#UncompletedDailyTasks ul').empty(), task,
                    currentDay = new Date().getDay();
                for (var i in tasks) {
                    task = tasks[i];
                    if (task.type=='daily' && !task.completed) {
                        if (!task.repeat || task.repeat[popup.days[currentDay]]) {
                            ucd.append('<li>'+task.text+'</li>');
                        }
                    }
                }

                if (ucd.children().length) {
                    $('#UncompletedDailyTasks').css('display', 'block');
                } else {
                    $('#UncompletedDailyTasks').css('display', 'none');
                }
            },

            sitewatcherDataChanged: function(data) {
                popup.sitewatcherState = data.state;

                var btn = popup.sitewatcher.find('.state .value');

                if (data.state < 0 )
                    btn.text('Inactive').addClass('red').attr('disabled', 'disabled');
                else
                    btn.text('Activate').addClass('red').removeAttr('disabled');

                if (data.state <= 0) {
                    popup.sitewatcherTimeLine.width(0).parent().attr('title', '');
                    popup.sitewatcherTimeLine.prev().text('');
                    return;
                }

                btn.text('Take break').removeClass('red');

                popup.sitewatcherTimeLine.parent().attr('title', data.score.toFixed(2));

                // update the timeline
                var now = new Date().getTime(),
                    width = (data.nextSend - now) / (data.nextSend - data.lastSend),
                    nextDate = new Date(data.nextSend - now),
                    // the score clapped between -1 and 1 but we need a number between 0 and 120
                    // score shifted to 0 and 2 then normalized and scale up
                    mappedScore = ((data.score + 1) / 2) * 120,
                    // converter need a 0-1 hue value
                    color = hsl2Hex(mappedScore/360, 0.9, 0.5);

                popup.sitewatcherTimeLine.css({ width:(width * 100)+'%', 'background-color': color });
                popup.sitewatcherTimeLine.prev().text((nextDate.getHours() > 1 ? nextDate.getHours()+':' : '')+nextDate.getMinutes()+':'+nextDate.getSeconds());
            }

        };

    return popup;

})();


jQuery('document').ready(function(){ Popup.init(appBridge); });