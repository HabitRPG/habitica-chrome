(function(){

    var App = {

        init: function() {

            var classChangeWatcher = new WebKitMutationObserver(function(mutations) {

                mutations.forEach(function(mutation) {
                    var classList = mutation.target.classList;
                    if (classList.contains('task')) {

                        var nCl = mutation.target.className.trim(),
                            oCl = mutation.oldValue.trim();
                        if ((nCl.indexOf('done') != -1 && oCl.indexOf('done') != -1) ||
                            (nCl.indexOf('done') == -1 && oCl.indexOf('done') == -1)) 
                                return;

                        if (classList.contains('done'))
                            App.complete();
                        else
                            App.unComplete();
                    }
                });

            });
  
            classChangeWatcher.observe(
                             document.querySelector('#pageContainer'), 
                             { attributes: true, attributeOldValue: true, attributeFilter:['class'], subtree:true }
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