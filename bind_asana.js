(function(){

    var App = {

        init: function() {

            var classChangeWatcher = new WebKitMutationObserver(function(mutations) {

                mutations.forEach(function(mutation) {
                    var classList = mutation.target.classList;
                    if (classList.contains('task-row')) {

                        var nCl = mutation.target.className.trim(),
                            oCl = mutation.oldValue.trim();
                        if ((nCl.indexOf('completed') != -1 && oCl.indexOf('completed') != -1) ||
                            (nCl.indexOf('completed') == -1 && oCl.indexOf('completed') == -1)) 
                                return;

                        if (classList.contains('completed'))
                            App.complete();
                        else
                            App.unComplete();
                    }
                });

            }),
            watcherConfig = { attributes: true, attributeOldValue: true, attributeFilter:['class'], subtree:true };

            classChangeWatcher.observe(
                             document.querySelector('#center_pane_container #grid'), 
                             watcherConfig
                             );

            classChangeWatcher.observe(
                             document.querySelector('#right_pane__contents #grid'), 
                             watcherConfig
                             );

        },

        complete: function() {
            chrome.extension.sendMessage({ type: "todos.complete" });
        },

        unComplete: function() {
            chrome.extension.sendMessage({type: "todos.unComplete"});
        }

    };

App.init();

})();