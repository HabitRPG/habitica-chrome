(function(){

    var App = {

        init: function() {
            
            TaskListWatcher.init();

            var DetectTaskListOpened = new WebKitMutationObserver(function(mutations) {

                    mutations.forEach(function(mutation){
                        if (mutation.target.className == 'no') {
                            if (mutation.removedNodes[0] && mutation.removedNodes[0].querySelector('#tasksiframe'))
                                TaskListWatcher.disable();
                            else if (mutation.addedNodes[0] && mutation.addedNodes[0].querySelector('#tasksiframe'))
                                TaskListWatcher.enable(mutation.addedNodes[0].querySelector('#tasksiframe'));
                        }
                    });
                });

            DetectTaskListOpened.observe( document.querySelector('body'),  { childList: true, subtree:true } );
        }

    },

    TaskListWatcher = {
        obj: undefined,

        init: function(){
            this.obj = new WebKitMutationObserver(this.handle);
        },

        enable: function(source) {
            source.addEventListener('load', function(){
                TaskListWatcher.obj.observe( source.contentDocument.body, 
                            { childList: true, subtree:true }
                            );
            }, false);
        },

        disable: function() {
            this.obj.disconnect();
        },

        handle: function(mutations) {
            mutations.forEach(function(mutation){
                if (mutation.target.nodeName == 'TD' && mutation.target.className == 'EV') {
                    if (!mutation.addedNodes[2] && !mutation.removedNodes[2]) return;
                    var addedClassList = mutation.addedNodes[2].classList,
                        removedClassList = mutation.removedNodes[2].classList;

                    if (!addedClassList.contains('Ez') && !removedClassList.contains('Ez')) return;

                    if (addedClassList.contains('DL') && !removedClassList.contains('DL'))
                        TaskListWatcher.complete();

                    else if (!addedClassList.contains('DL') && removedClassList.contains('DL'))
                        TaskListWatcher.unComplete();
                }
            });
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