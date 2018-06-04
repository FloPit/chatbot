var express = require('express');
var router = express.Router();
var sessionrout = require('../app');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.io.emit("socketToMe", "chatbot");
  res.render('chatbot', { title: 'Chatbot Anna' , session1:req.sessionID});
//sessionrout.sendSession(req.session, req.sessionID);
});

module.exports = router;