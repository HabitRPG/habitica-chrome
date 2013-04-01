
jQuery('document').ready(function(){

    var App = {

        isRunning: false,
        //port: chrome.extension.connect(),

        init: function() {

            this.injectConfirmReplacer();

            $('body').on('keydown', function(e){

                if (location.pathname == '/' && !App.isRunning && e.keyCode == 32) {
                    App.start();
                }
            });

            $('#start').on('click', function(){App.start();});
            $('body').on('click', 'input[name=commit]', function(){App.start();});
            $(window).unload(function() { if (App.isRunning) App.stop(); });

            browser.sendMessage({type: "tomatoes.reset"});
        },

        start: function() {
            this.isRunning = true;
            browser.sendMessage({
                    type: "tomatoes.started", 
                    tomatoCount: parseInt($('.day .counter_value').text(), 10)
                });
        },

        stop: function() {
            this.isRunning = false;
            browser.sendMessage({type: "tomatoes.stopped"});
        },

        // replace the confirm window so we know when the user stopped a period
        injectConfirmReplacer: function() {
            var actualCode = [
            'var myConfirm = window.confirm;',
            'window.confirm = function(text) {',
            'var confirmed = myConfirm(text);',
            'if (confirmed)',
            'window.postMessage({ type: "tomato_stopped" }, "*")',
            'return confirmed;}'
                ].join('\n');

            var script = document.createElement('script');
            script.textContent = actualCode;
            (document.head||document.documentElement).appendChild(script);
            script.parentNode.removeChild(script);

            // we are listening to the event from the 'actualCode'
            window.addEventListener("message", function(e) {
                if (e.source != window) return;

                if (e.data.type && (e.data.type == "tomato_stopped"))
                    App.stop();
            });
        }
    };

App.init();

});
