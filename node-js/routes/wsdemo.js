var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('wsdemo.html', { title: 'ws-WDC' });
});

router.post('/submitTask', function(req, res, next) {

  console.log('[wsProxy] received request : %s', JSON.stringify(req.body));
  req.app.locals.wdcManager.dispatchTask(req.body, function(taskResult) {
    console.log('[wxProxy] response, ' + JSON.stringify(taskResult));
    res.json(taskResult);
  });
});

module.exports = router;