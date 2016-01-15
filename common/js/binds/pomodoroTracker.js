/**
 * Created by balor on 16-01-15.
 */
jQuery('document').ready(function(){

    var App = {

        isRunning: false,
        //port: chrome.extension.connect(),

        init: function() {



            $('body').on('keydown', function(e){

                if (location.pathname == '/' && !App.isRunning && e.keyCode == 32) {
                    App.start();
                }
            });

            $('#start').on('click', function(){App.start();});
            $('body').on('click', 'input[name=commit]', function(){App.start(1);});
            $(window).unload(function() { if (App.isRunning) App.stop(); });

        },

        start: function(add) {
            add = add || 0;
            this.isRunning = true;
            browser.sendMessage({
                type: "tomatoes.started",
                tomatoCount: parseInt($('.day .counter_value').text(), 10) + add
            });
        },

        stop: function() {
            this.isRunning = false;
            browser.sendMessage({type: "pomTracker.pomodoro.stopped"});
        }
    };

    App.init();

});