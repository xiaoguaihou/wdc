var uuid = require('node-uuid');
var WebSocket = require('ws');

var TaskSubmitorReq = require('./task_submitor_req');
var Executor = require('./executor');
var ExecutorKeeper = require('./executor_keeper');

class WDCManager {

    constructor() {
        this.executorKeeper = new ExecutorKeeper();

        this.pendingTaskQueue = new Array();

        this.wsServer = null;
    }

    initWSServer(_host, _port) {
        if (this.wsServer != null) {
            console.log("WDCManager : wsServer has started!");
            return;
        }

        console.log("WDCManager: init wsServer=%s:%d", _host, _port);
        this.wsServer = new WebSocket.Server({ port: _port, host: _host, clientTracking: true });

        this.wsServer.on('connection', (client, request) => {
            console.log('[wdc_server] incoming ip: %s, port:%d',
                client.upgradeReq.socket.remoteAddress, client.upgradeReq.socket.remotePort);

            var key = client.upgradeReq.socket.remoteAddress + ':' + client.upgradeReq.socket.remotePort;
            this.executorKeeper.push(key, new Executor(client, key, (executor, event) => {
                console.log('[WDCManager] task completed : ' + JSON.stringify(event));

                if (event.eventType == Executor.EVENT.TASK_COMPLETE) {
                    event.task.callback(event.result);
                    
                    var pendingTask = this.pendingTaskQueue.shift();
                    if (pendingTask != null) {
                        this.dispatchTask(pendingTask.task, pendingTask.callback);
                    }
                } else if (event.eventType == Executor.EVENT.EXECUTOR_DEAD) {
                    this.executorKeeper.pop(executor.key);
                }
            }));
        });
    };

    dispatchTask(taskSubmitorReq, callback) {
        var executor = this.executorKeeper.getIdleExecutor();
        if (executor != null) {
            executor.executeTask({
                transactionID: uuid.v4(),
                transactionType: 'TaskReq',
                runnable: taskSubmitorReq.runnable,
                context: taskSubmitorReq.context,
                callback: callback
            });
            return true;
        } else {
            console.log('[wdc_server] : push task, executor number=%d', this.executorKeeper.size());
            this.pendingTaskQueue.push({
                    task: taskSubmitorReq,
                    callback: callback
                });
            return false;
        }
    }
}

var WDCTaskManager = new WDCManager();

module.exports = WDCTaskManager;

