(function(){

    var App = {

        init: function() {
            
            var MainTaskWatcher = new WebKitMutationObserver(function(mutations) {

                ProcessMainMainTaskMutations.process(mutations);

                if (ProcessMainMainTaskMutations.hasAddedCompleted && ProcessMainMainTaskMutations.hasRemovedSimple)
                    App.complete();

                else if (ProcessMainMainTaskMutations.hasAddedSimple && ProcessMainMainTaskMutations.hasRemovedCompleted)
                    App.unComplete();

                });

            MainTaskWatcher.observe(
                             document.querySelector('#center_pane__contents #grid'), 
                             { childList:true, subtree:true }
                             );

        },

        complete: function() {
            chrome.extension.sendMessage({ type: "todos.complete" });
        },

        unComplete: function() {
            chrome.extension.sendMessage({type: "todos.unComplete"});
        }

    },

    ProcessMainMainTaskMutations = {
        addedCompleted: false,
        removedCompleted: false,
        addedSimple: false,
        removedSimple: false,

        process: function(mutations) {
            this.hasAddedCompleted= false;
            this.hasRemovedCompleted= false;
            this.hasAddedSimple= false;
            this.hasRemovedSimple= false;

            mutations.forEach(this.forEachHandle);
        },

        forEachHandle: function(mutation) {
            if (!MainTaskMutation.init(mutation))
                return;

            if (MainTaskMutation.isAdded) {

                if (MainTaskMutation.tr.classList.contains('completed'))
                    ProcessMainMainTaskMutations.hasAddedCompleted = true;
                else
                    ProcessMainMainTaskMutations.hasAddedSimple = true;

            } else if (MainTaskMutation.isRemoved) {

                if (MainTaskMutation.tr.classList.contains('completed'))
                    ProcessMainMainTaskMutations.hasRemovedCompleted = true;
                else
                    ProcessMainMainTaskMutations.hasRemovedSimple = true;
            }
        }

    },

    MainTaskMutation = {

        obj: undefined,
        tr: undefined,
        isAdded: false,
        isRemoved: false,

        init: function(mutation) {
            this.obj = mutation;

            return this.isProcessAble();
        },

        isProcessAble: function() {
            if (this.setState('isAdded')) return true;
            if (this.setState('isRemoved')) return true;

            return false;
        },

        setState: function(state) {
            var nodes = state == 'isAdded' ? this.obj.addedNodes : this.obj.removedNodes;
            this[state] = nodes.length == 1;
            if (this[state] && nodes[0].nodeName == 'TR') {
                this.tr = nodes[0];
                return this.tr.classList && this.tr.classList.contains('task-row');
            }            
        }

    };




App.init();

})();