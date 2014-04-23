
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
            site_watcher: undefined,
            char_stats: undefined,

            sitewatcherState: undefined,

            updateInterval: 1000,
            days: ['su', 'm', 't', 'w', 'th', 'f', 's'],

            init: function(appBridge){

                this.bridge = appBridge;

                this.site_watcher = $('#site_watcher');
                this.char_stats = $('#character_stats');

                this.bridge.addListener('character.changed', this.updateCharacter);
                this.bridge.addListener('watcher.dataChanged', this.sitewatcherDataChanged);

                this.getBackgroundData();

                // Update current state when button is clicked
                $('#site_watcher #state').on('click', function(){
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

                // Toggle if we have a connection with the server
                if (data) {
                    $('#NotConnected').css('display', 'none');
                    $('#Connected').css('display', 'block');
                } else {
                    $('#Connected').css('display', 'none');
                    $('#NotConnected').css('display', 'block');
                    return;
                }

                // Update player stats
                // Level Bar
                popup.char_stats.find("#char_lvl_data").text("Level: "+data.stats.lvl);
                // HP Bar
                popup.char_stats.find("#char_hp_data").text("Health: "+data.stats.hp+"/"+data.stats.maxHealth);
                popup.char_stats.find("#char_hp_bar").css({'width': Math.round((data.stats.hp / data.stats.maxHealth) * 100)+'%', 'background-color': "#d9534f" });
                // Exp Bar
                popup.char_stats.find("#char_exp_data").text("Exp: "+data.stats.exp+"/"+data.stats.toNextLevel);
                popup.char_stats.find("#char_exp_bar").css({'width': Math.round((data.stats.exp / data.stats.toNextLevel) * 100)+'%', 'background-color': "#f0ad4e" });
                // Gold Coin Bar
                popup.char_stats.find("#char_gp_data").text("Gold: "+Math.floor(data.stats.gp));

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

                // Update the button
                var btn = popup.site_watcher.find('#state');
                if (data.state < 0 ) {
                    btn.text('Inactive').addClass('btn-danger').attr('disabled', 'disabled');
                }
                else if(data.state === 0) {
                    btn.text('Activate').addClass('btn-danger').removeAttr('disabled');
                }
                else {
                    btn.text('Take break').removeClass('btn-danger');
                }

                // If there is no server, then don't do anything
                var progress_bar = popup.site_watcher.find('#time_bar');
                var progress_data = popup.site_watcher.find('#time_data');
                if (data.state <= 0) {
                    progress_data.text("");
                    progress_bar.css({"width":"0%"});
                    return;
                }
                // Update the timeline, if we have a server
                var now = new Date().getTime();
                var width = (data.nextSend - now) / (data.nextSend - data.lastSend);
                var nextDate = new Date(data.nextSend - now);
                // The score clapped between -1 and 1 but we need a number between 0 and 120
                // Score shifted to 0 and 2 then normalized and scale up
                var mappedScore = ((data.score + 1) / 2) * 120;
                // Converter need a 0-1 hue value
                var color = hsl2Hex(mappedScore/360, 0.7, 0.5);
                // Update bar with new info
                progress_data.text((nextDate.getHours() > 1 ? nextDate.getHours()+':' : '')+nextDate.getMinutes()+':'+nextDate.getSeconds());
                progress_bar.css({ width:(width * 100)+'%', 'background-color': color });
            
            }

        };

    return popup;

})();


jQuery('document').ready(function(){ Popup.init(appBridge); });