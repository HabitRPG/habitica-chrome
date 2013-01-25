
function AlwaysonActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
    this.changeStateFn(true);
}
FromOptionsActivator.prototype.setState = function(value) {};


function FromOptionsActivator(changeStateFn) {
    this.changeStateFn = changeStateFn;
}

FromOptionsActivator.prototype.setState = function(value) {
    if (value == 'true') this.changeStateFn(true);
    else if (value == 'false') this.changeStateFn(false);
};