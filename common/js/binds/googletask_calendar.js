(function(){

    var App = {

        init: function() {
            
            TaskListWatcher.init();

            var DetectTaskListOpened = browser.getMutationObserver(function(mutations) {
                    mutations.forEach(function(mutation){
                        if (mutation.addedNodes[0] &&
                                // When on home page
                                (mutation.target.classList.contains('sn-container') || (
                                    // When accessing an event page directly
                                    mutation.target.nodeName == 'DIV' && mutation.target.childNodes[0] && 
                                    mutation.target.childNodes[0].nodeName == 'IFRAME' &&
                                    mutation.target.offsetParent &&
                                    mutation.target.offsetParent.classList.contains('sn-container')))) {
                            // FIXME (maybe) For some reason it isn't avalaible immediately 
                            // the first time the documents load so we use setTimeout if undefined...
                            if (mutation.target.getElementsByTagName('iframe')[0]) {
                                TaskListWatcher.enable(mutation.target.getElementsByTagName('iframe')[0]);
                            } else {
                                setTimeout(function(){
                                    TaskListWatcher.enable(mutation.target.getElementsByTagName('iframe')[0]);
                                }, 1000)
                            }
                            
                        } else if (mutation.removedNodes[0] && mutation.target.classList.contains('sn-container')) {
                            // FIXME (maybe) It seems impossible to examine mutation.target's children so we can't check for it having
                            // an iframe, maybe removed before...
                            TaskListWatcher.disable();
                        }
                    });
                });

            DetectTaskListOpened.observe( document.querySelector('body'),  { childList: true, subtree:true } );        }

    },

    TaskListWatcher = {
        obj: undefined,

        init: function(){
            this.obj = browser.getMutationObserver(this.handle);
        },

        enable: function(source) {
            // FIXME (maybe) Load event not avalaible, probably because iframe's src
            // is javascript function, but it seems to work anyway
            TaskListWatcher.obj.observe( source.contentDocument.body, 
                        { childList: true, subtree:true }
                        );
        },

        disable: function() {
            this.obj.disconnect();
        },

        handle: function(mutations) {
            mutations.forEach(function(mutation){
                if(mutation.target.nodeName == 'TD' && mutation.target.classList.contains('i')){
                    var el = mutation.target.querySelector('.z div')
                    if (el.classList.contains('d')) {
                        TaskListWatcher.complete();
                    } else if (el.classList.contains('c')){
                        TaskListWatcher.unComplete();
                    };
                };
            });
        },

        complete: function() {
            browser.sendMessage({ type: "todos.complete" });
        },

        unComplete: function() {
            browser.sendMessage({type: "todos.unComplete"});
        }
    };

App.init();

})();