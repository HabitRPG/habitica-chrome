(function(){

    var App = {

        init: function() {
            
            TaskListWatcher.init();

            var DetectTaskListOpened = browser.getMutationObserver(function(mutations) {

                    mutations.forEach(function(mutation){
                        if (mutation.target.className == 'no') {
                            if (mutation.removedNodes[0] && mutation.removedNodes[0].querySelector('#tasksiframe'))
                                TaskListWatcher.disable();
                            else if (mutation.addedNodes[0] && mutation.addedNodes[0].querySelector('#tasksiframe'))
                                TaskListWatcher.enable(mutation.addedNodes[0].querySelector('#tasksiframe'));

                        } else if (mutation.target.className == 'nH' && mutation.addedNodes[0].id == 'tasksiframe') {
                            TaskListWatcher.enable(mutation.addedNodes[0]);
                        }
                    });
                });

            DetectTaskListOpened.observe( document.querySelector('body'),  { childList: true, subtree:true } );
        }

    },

    TaskListWatcher = {
        obj: undefined,

        init: function(){
            this.obj = browser.getMutationObserver(this.handle);
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
                var addedClassList, removedNodes, cl;
                if (mutation.target.nodeName == 'TD' && mutation.target.className == 'EV') {
                    if (!mutation.addedNodes[1] && !mutation.removedNodes[1]) return;
                    if (mutation.addedNodes[2]) {
                        addedClassList = mutation.addedNodes[2].classList;
                        removedClassList = mutation.removedNodes[2].classList;
                        cl = 'Ez';
                    } else {
                        addedClassList = mutation.addedNodes[1].classList;
                        removedClassList = mutation.removedNodes[1].classList;
                        cl = 'EY';
                    }

                    if (!addedClassList.contains(cl) && !removedClassList.contains(cl)) return;

                    if (addedClassList.contains('DL') && !removedClassList.contains('DL'))
                        TaskListWatcher.complete();

                    else if (!addedClassList.contains('DL') && (removedClassList.contains('DL') || !removedClassList.contains('DL')))
                        TaskListWatcher.unComplete();
                }
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