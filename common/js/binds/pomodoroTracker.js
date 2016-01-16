/**
 * Created by balor on 16-01-15.
 */
$(document).ready(function () {

    String.prototype.contains = function (it) {
        return this.indexOf(it) != -1;
    };
    var App = {

        isRunning: false,
        count: 1,
        lastTimerCount: "",
        breakSkipped: function () {
            browser.sendMessage({type: "pomTracker.break.skipped"});
        },
        breakStarted: function (breakType) {
            browser.sendMessage({
                type: "pomTracker.break.started",
                breakType: breakType
            });
        },
        breakStopped: function (breakType) {
            browser.sendMessage({
                type: "pomTracker.break.stopped",
                breakType: breakType
            });
        },
        //port: chrome.extension.connect(),

        init: function () {

            $("pomodoro .pomodoro-timer_buttons button").on("click", function () {
                var button = $(this);
                if (button.html() == "START") {
                    if (!App.isRunning) {
                        App.start();
                    }
                } else if (button.html() == "STOP") {
                    App.pomInterrupted();
                } else if (button.html() == "SKIP") {
                    App.breakSkipped();
                }
            });

            $("pomodoro .pomodoro-timer_title").contentChange(function () {
                var elem = $(this);
                if (elem.html().contains('POMODORO')) {
                    App.count = parseInt(elem.html().replace(/\D/g, ''), 10);
                }
            });

            $("pomodoro .pomodoro-timer").classChange(function () {
                var elem = $(this);
                if (elem.hasClass('short') || elem.hasClass('long')) {
                    App.pomDone();
                    if (elem.hasClass('short')) {
                        App.breakStarted('short');
                    } else {
                        App.breakStarted('long');
                    }
                } else if (elem.data('lastClass').contains('short')) {
                    App.breakStopped('short');
                } else if (elem.data('lastClass').contains('long')) {
                    App.breakStopped('long');
                }
            });

            setInterval(function(){
                if ($("pomodoro .pomodoro-timer_buttons button").html() != 'RESUME') {
                    App.lastTimerCount = $('pomodoro .pomodoro-timer span').html();
                }
            }, 1000);


            $(window).on('unload',function () {
                if (App.isRunning) {
                    App.stop();
                }
            });

        },

        start: function () {
            this.isRunning = true;
        },

        stop: function () {
            this.isRunning = false;
            var currentCount =  $('pomodoro .pomodoro-timer span').html();
            if(this.lastTimerCount != currentCount) {
                this.pomInterrupted();
            }
        },
        pomDone: function () {
            browser.sendMessage({
                type: "pomTracker.pomodoro.done",
                pomodoroCount: App.count
            });
        },
        pomInterrupted: function () {
            browser.sendMessage({type: "pomTracker.pomodoro.stopped"});
        }
    };

    App.init();

});