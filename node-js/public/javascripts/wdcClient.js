function WDCClient(wsUrl, taskCallback, resultCallback) {
    console.log("wsClient: url");
    var wsClient = new WebSocket(wsUrl);

    var taskCB = taskCallback;
    var resultCB = resultCallback;

    wsClient.onopen = function() {
        console.log("wsClient: connected !");
    }

    wsClient.onmessage = function(msg) {
        console.log("wsClient: message[%s]", msg);
        onTask(msg);
    }

    wsClient.onclose = function(msg) {
        console.log("wsClient: close [%s]", msg);
    }

    function onTaskComplete(taskResult) {
        console.log("wsClient: task complete [%s]", taskResult);
        unloadTaskJS(taskResult);

        var resultString = JSON.stringify(taskResult);
        wsClient.send(resultString);

        resultCB(resultString);
    }

    function onTask(msg) {

        var task = taskParser(msg);
        
        if (task != null) {
            loadTaskJS(task);

            wdcTask(task.context, onTaskComplete);
        }

        taskCB(msg.data);
    }

    function taskParser(msg) {
        var task = null;
        if (msg.data) {
            console.log("wsClient: task json string [%s]", msg.data);
            task = JSON.parse(msg.data);

            if (task == null || task == undefined ||
                task.transactionID == undefined || task.transactionID == null
                || task.transactionType == undefined || task.transactionType == null
                || task.runnable == undefined || task.runnable == null) {
                task = null;
            }
        }
        return task;   
    }

    function loadTaskJS(task) {
        var jsHolder = document.getElementById(task.transactionID);
        if (jsHolder != null) {
            jsHolder.parentNode.removeChild(jsHolder);
        }

        jsHolder = document.createElement('script');
        jsHolder.language = 'javascript';
        jsHolder.type = 'text/javascript';
        jsHolder.id = task.transactionID;
        jsHolder.defer = false;
        jsHolder.text = decodeURI(task.runnable);
        document.body.appendChild(jsHolder);
    }

    function unloadTaskJS(task) {
        var jsHolder = document.getElementById(task.transactionID);
        if (jsHolder != null) {
            jsHolder.parentNode.removeChild(jsHolder);
        }
    }
}