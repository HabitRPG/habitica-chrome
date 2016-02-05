/**
 * Created by balor on 16-01-15.
 */
$(document).ready(function () {

    String.prototype.contains = function (it) {
        return this.indexOf(it) != -1;
    };
    var App = {

        isRunning: false,
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
        pomStarted: function () {
            browser.sendMessage({
                type: "pomTracker.pomodoro.started"
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
                    var timerElem = $("pomodoro .pomodoro-timer");
                    if (timerElem.hasClass("pomodoro")) {
                        App.pomStarted();
                    } else if (timerElem.hasClass('short')) {
                        App.breakStarted('short');
                    } else if (timerElem.hasClass('long')) {
                        App.breakStarted('long');
                    }
                }
            });

            $(document).on('pomodoro_timer_finished', function(e,mode,num){
               if(mode == "short" || mode == "long") {
                   App.breakStopped(mode);
               } else {
                   App.pomDone(num);
               }
            });

            $(document).on("pomodoro_timer_stopped", function(e) {
               App.pomInterrupted();
            });

            $("pomodoro .pomodoro-timer").classChange(function () {
                var elem = $(this);
                if (elem.hasClass('short') || elem.hasClass('long')) {
                    if ($("input[name='auto_start_break']").is(":checked")) {
                        if (elem.hasClass('short')) {
                            App.breakStarted('short');
                        } else {
                            App.breakStarted('long');
                        }
                    }
                } else if (elem.hasClass('pomodoro')) {
                    if ($("input[name='auto_start_pomodoro']").is(":checked")) {
                        App.pomStarted();
                    }
                }
            });

            setInterval(function () {
                if ($("pomodoro .pomodoro-timer_buttons button").html() != 'RESUME') {
                    App.lastTimerCount = $('pomodoro .pomodoro-timer span').html();
                }
            }, 1000);


            $(window).on('unload', function () {
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
            var currentCount = $('pomodoro .pomodoro-timer span').html();
            if (this.lastTimerCount != currentCount) {
                this.pomInterrupted();
            }
        },
        pomDone: function (num) {
            browser.sendMessage({
                type: "pomTracker.pomodoro.done",
                pomodoroCount: num
            });
        },
        pomInterrupted: function () {
            browser.sendMessage({type: "pomTracker.pomodoro.stopped"});
        }
    };

    App.init();

});