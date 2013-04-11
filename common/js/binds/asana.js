(function(){

    var App = {

        init: function() {

            var TaskWatcher = browser.getMutationObserver(function(mutations) {

                ProcessTaskMutations.process(mutations);

                if (ProcessTaskMutations.hasAddedCompleted && ProcessTaskMutations.hasRemovedSimple)
                    App.complete();

                else if (ProcessTaskMutations.hasAddedSimple && ProcessTaskMutations.hasRemovedCompleted)
                    App.unComplete();

                });

            TaskWatcher.observe(
                            document.querySelector('body'),
                            { childList: true, subtree:true }
                            );

        },

        complete: function() {
            browser.sendMessage({ type: "todos.complete" });
        },

        unComplete: function() {
            browser.sendMessage({type: "todos.unComplete"});
        }

    },

    ProcessTaskMutations = {
        addedCompleted: false,
        removedCompleted: false,
        addedSimple: false,
        removedSimple: false,
        foundedCount: 0,

        process: function(mutations) {
            this.hasAddedCompleted= false;
            this.hasRemovedCompleted= false;
            this.hasAddedSimple= false;
            this.hasRemovedSimple= false;
            this.foundedCount = 0;

            mutations.forEach(this.forEachHandle);

            if (this.foundedCount != 2) {
                this.hasAddedCompleted= false;
                this.hasRemovedCompleted= false;
                this.hasAddedSimple= false;
                this.hasRemovedSimple= false;
            }
        },

        forEachHandle: function(mutation) {

            if (ProcessTaskMutations.setFromButton(mutation)) return;

            if (mutation.target.nodeName != 'TBODY') return;
            if (!TaskMutation.init(mutation)) return;

            if (TaskMutation.addedTr) {
                ProcessTaskMutations.foundedCount++;
                if (TaskMutation.addedTr.classList.contains('completed'))
                    ProcessTaskMutations.hasAddedCompleted = true;
                else
                    ProcessTaskMutations.hasAddedSimple = true;
            }

            if (TaskMutation.removedTr) {
                ProcessTaskMutations.foundedCount++;
                if (TaskMutation.removedTr.classList.contains('completed'))
                    ProcessTaskMutations.hasRemovedCompleted = true;
                else
                    ProcessTaskMutations.hasRemovedSimple = true;
            }

        },

        setFromButton: function(mutation) {
            if (DetectSubTaskStateChangeFromInsade.check(mutation)) {
                if (DetectSubTaskStateChangeFromInsade.addedSimple) {
                    ProcessTaskMutations.hasAddedSimple = true;
                    ProcessTaskMutations.hasRemovedCompleted = true;

                } else if (DetectSubTaskStateChangeFromInsade.addedCompleted) {
                    ProcessTaskMutations.hasAddedCompleted = true;
                    ProcessTaskMutations.hasRemovedSimple = true;
                }

                return true;
            }
            return false;
        }

    },

    DetectSubTaskStateChangeFromInsade = {

        isChanged: false,

        addedSimple: false,
        addedCompleted: false,

        check: function(mutation) {
            this.isChanged = false;
            this.addedSimple = false;
            this.addedCompleted = false;

            if (!document.querySelector('#right_pane__contents .ancestry')) return;

            if (mutation.target.nodeName != 'SPAN') return;
            var added = mutation.addedNodes.length == 1 ? mutation.addedNodes[0].querySelector('.complete-button') : undefined,
                removed = mutation.removedNodes.length == 1 ? mutation.removedNodes[0].querySelector('.complete-button') : undefined;

            if (!added || !removed)  return;

            if (added.classList.contains('mark-incomplete') && removed.classList.contains('mark-complete')) {
                this.addedCompleted = true;
                this.isChanged = true;
            } else if (added.classList.contains('mark-complete') && removed.classList.contains('mark-incomplete')) {
                this.addedSimple = true;
                this.isChanged = true;
            }

            return this.isChanged;
        }

    },

    TaskMutation = {

        obj: undefined,
        addedTr: undefined,
        removedTr: undefined,

        init: function(mutation) {
            this.obj = mutation;

            this.addedTr = undefined;
            this.removedTr = undefined;

            return this.isProcessable();
        },

        isProcessable: function() {
            this.setState('added');
            this.setState('removed');

            if (this.addedTr || this.removedTr) {
                return true;
            }

            return false;
        },

        setState: function(state) {
            var nodes = state == 'added' ? this.obj.addedNodes : this.obj.removedNodes;
            if (nodes.length == 1 && nodes[0].nodeName == 'TR') {
                this[state+'Tr'] = nodes[0].classList.contains('task-row') ? nodes[0] : undefined;
            }
        }

    };

App.init();

})();