var express = require('express');
var router = express.Router();
router.get('/hello', function(req, res, next) {
// res.send("Howdy!");
var greeting = "Howdy";
if (req.query.name) { greeting += " " + req.query.name + "!"; }
else { greeting += "!"; }
res.send(greeting);
});
router.get('/goodbye', function(req, res, next) {
res.send("Adios.");
});
router.get('/helloJSON', function(req, res, next) {
// var json = '{"greeting": "Howdy", "timestamp":' + Date.now() + '}'
var obj = { greeting: "Howdy!", timestamp: Date.now() }
var json = JSON.stringify(obj)
res.send(json)
});

var bodyParser = require('body-parser')
router.use(bodyParser.text())
router.post('/helloJSON', function(req, res, next) {
  console.log(req.body)
  //what does JSON.parse() do if I add it here?
  res.send(req.body)
});

router.get('/queryInfo', function(req, res, next) {
  var data = "<!doctype html><html><head><title>Page 1</title></head>"
  data += '<body><ul>';

  for (param in req.query) {
      data += '<li>' + param + ':' + req.query[param] + '</li>';
  }
  data += '<p>' + req.method + '</p>';
  data += '<p>' + req.url + '</p>';
  data += '<p>' + req.originalUrl + '</p>';
  data += '<p>' + req.path + '</p>';
  data += '</ul></body></html>';
  console.log(req);
  res.send(data);
})
module.exports = router;
