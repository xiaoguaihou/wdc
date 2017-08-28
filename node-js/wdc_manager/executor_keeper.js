var Executor = require('./executor');

module.exports = class ExecutorKeeper {
    constructor() {
        //key: rmeoteIP+remotePort
        //value: wsClient
        this.clientMap = {};
        this.selector = 0;
    }

    push(key, executor) {
        this.clientMap[key] = executor;
    }

    pop(key) {
        delete this.clientMap[key];
    }

    size() {
        return Object.keys(this.clientMap).length;
    }

    getIdleExecutor() {
        var keys = Object.keys(this.clientMap);
        var len = keys.length - 1;
        var start = this.selector;

        while (len >= 0) {
            start++;

            if (this.clientMap[keys[start % keys.length]].status == Executor.STATUS.IDLE) {
                this.selector = start % keys.length;
                return this.clientMap[keys[start % keys.length]];
            }
        }
        return null;
    }
}