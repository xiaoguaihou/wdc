module.exports = class Executor {
    static get STATUS() {
        return {
            IDLE : 0,
            BUSY : 1,
            CLOSED : 2
        }
        };
    static get EVENT() {
        return {
            TASK_COMPLETE : 0,
            EXECUTOR_DEAD : 1
        }
        };

    constructor(wsClient, key, onEvent) {
        
        this.wsClient = wsClient;
        this.status = Executor.STATUS.IDLE;
        this.key = key;
        this.onEvent = onEvent;
        this.remoteIP = wsClient.upgradeReq.socket.remoteAddress;
        this.remotePort = wsClient.upgradeReq.socket.remotePort;

        this.onEvent = onEvent;
        this.curTask = null;

        wsClient.on('message', (data) => {
            this.status = Executor.STATUS.IDLE;

            if (data) {
                console.log('[Executor] message ' + data);
                var taskResult = JSON.parse(data);
                //TODO: validate response

                if (this.onEvent) {
                    this.onEvent(this, {
                        eventType : Executor.EVENT.TASK_COMPLETE,
                        task : this.curTask,
                        result: taskResult
                    });
                }
            }
        });

        wsClient.on('close', (code, message) => {
            console.log('Executor : client[%s:%d] closed, code=%d, message=%s', this.remoteIP, this.remotePort, code, message);
            this.status = Executor.STATUS.CLOSED;

            if (this.onEvent) {
                this.onEvent(this, { eventType: Executor.EVENT.EXECUTOR_DEAD });
            }
        });
    }

    executeTask(task) {
            console.log('[Executor] start to execute task [%s]', JSON.stringify(task));
            if (this.status != Executor.STATUS.IDLE) {
                console.log('[Executor] task do not in idle, %d', this.status);
                return false;
            }

            this.wsClient.send(
                JSON.stringify(task)
            );

            this.curTask = task;
            return true;
        }
}