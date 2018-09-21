"use strict";
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');


const index = require('./routes/index');


const chatbot = require('./routes/chatbot');



const fs = require('fs');
const busboy = require('connect-busboy');

const app = express();


const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(function (req, res, next) {
  res.io = io;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



//express-session

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));



// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

app.use('/chatbot', chatbot);



app.use(busboy());

/*
const watson = require('watson-developer-cloud');



const conversation = watson.conversation({
  url: 'https://gateway.watsonplatform.net/assistant/api',
  username: 'c949b658-3db9-4a18-aab1-082597cd8a01',
  password: 'Qc3ojucZRW3c',
  version: 'v1',
  version_date: '2017-02-03'


});
*/

//neue Verbindung
//21.09.2018 fp: changed to new german cf einkauf org and space:
//workspace needed in 3 places; also change the url!
//was: 'https://gateway.watsonplatform.net/assistant/api'
//found: https://gateway-fra.watsonplatform.net/assistant/api/v1/workspaces/250fc637-6da4-4946-a910-6f8efc5b8b8d/message/
//new:   https://gateway-fra.watsonplatform.net/assistant/api

var watson = require('watson-developer-cloud');

var assistant = new watson.AssistantV1({
  username: '6e9459f9-000c-4c37-b9d0-f58a6fca3410',
  password: 'BhSpDUOUuwm3',
  version: '2018-02-16',
  url: 'https://gateway-fra.watsonplatform.net/assistant/api'
});

assistant.message({
  workspace_id: '250fc637-6da4-4946-a910-6f8efc5b8b8d',
  input: {'text': 'Hello'}
},  function(err, response) {
  if (err)
    console.log('error:', err);
  else
    console.log(JSON.stringify(response, null, 2));
});



/*
//var AssistantV1 = require('watson-developer-cloud/assistant/v1');
var AssistantV1 = require('watson-developer-cloud');

var watsonAssistant = new watson.AssistantV1({
    version: '2018-02-16',
    username: 'b3787e1c-1633-49f0-855b-3d4c02710d80',
    password: 'LjsQHAGV6jw1'
  });


watsonAssistant.message({
	//workspace id aus workspace->details
  workspace_id: '2580d4ac-afa9-4be6-9603-6805c2875ad8',
  input: {'text': 'Hello'}
},  function(err, response) {
  if (err)
    console.log('error:', err);
  else
    console.log(JSON.stringify(response, null, 2));
});


*/

//{
//  "url": "https://gateway.watsonplatform.net/assistant/api",
//  "username": "b3787e1c-1633-49f0-855b-3d4c02710d80",
//  "password": "LjsQHAGV6jw1"
//}


//-----------------------------------------------------get




const Chats = new Array();


function SavetoDBandDelete(sessionidtodel){
  let callbid;
     let callrecord;



  for(let i=0;i<Chats.length;i++){

    if(Chats[i]._id==sessionidtodel){
      callbid =Chats[i]._id;
      callrecord = Chats[i].response;

  
console.log("Delete Entry" + Chats[i]._id)
Chats.splice(i,1);
  }
  
  }
}

function renewcontext(contex, usrss){
  for(let i=0;i<Chats.length;i++){
    if(Chats[i]._id===usrss){
      Chats[i].response = contex;
      console.log('renewd context' + Chats[i].response);
    }
  }

}


function responseChat(usrsession,text, callback){

function chatSessionExists(){
  if(Chats.length==0){
return false;
  } else {
    let tmp= false;
    for(let i=0;i<Chats.length;i++){
      if(Chats[i]._id===usrsession){
        tmp= true;
        return true;
      }
    }
    if(tmp==false){
      return false;
    }

  }

}

function getContext(){
  for(let i =0;i<Chats.length;i++){
    console.log(Chats[i].response);
    if(Chats[i]._id===usrsession){
      return Chats[i].response;
      //console.log(Chats[i].context);
    }
  }
}

  if (chatSessionExists()==false){
    console.log("new Chat");
    assistant.message({
  workspace_id: '250fc637-6da4-4946-a910-6f8efc5b8b8d',
  input: {'text': text},
 // context: context
},  function(err, response) {
  if (err)
    console.log('error:', err);
  else
    console.log(JSON.stringify(response, null, 2));
    callback(response.output.text);
    let chat = {_id:usrsession,response:response.context};
    Chats.push(chat);
});
}else if(chatSessionExists()==true){
  let context = getContext();
 
assistant.message({
  workspace_id: '250fc637-6da4-4946-a910-6f8efc5b8b8d',
  input: {'text': text},
  context: context
},  function(err, response) {
  if (err)
    console.log('error:', err);
  else
    console.log(JSON.stringify(response, null, 2));
    renewcontext(response.context, usrsession);
    callback(response.output.text);
});
}else{
  console.log("Fehler ChatArray");
}

}


// launch ======================================================================
const SocketSessions= new Array();

function cleanupandSave(socketsession){
  for(let i=0;i<SocketSessions.length;i++){
  if(SocketSessions[i].socketio==socketsession){

SavetoDBandDelete(SocketSessions[i].usersession);
    SocketSessions.splice(i,1);
  }
  }
}

io.on('connection', function (socket) {
  
  console.log("Sockets connected.with id" + socket.id);

  socket.emit('start', 'Socket started');

  // Whenever a new client connects send them the latest data


  socket.on('disconnect', function () {
    console.log("Socket disconnected.");
    cleanupandSave(socket.id);



  });
socket.on('message', function(data,usrsession){
  let websocketsession ={socketio:socket.id,usersession:usrsession};
  SocketSessions.push(websocketsession);
  
//console.log(usrsession);
  console.log(data);
responseChat(usrsession,data,function(response){
  socket.emit('response', response);
  console.log(socket.id);
});

});
});


//--------------------------------------------------------------------------------------------
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//module.exports.sendSession=establishSession;

module.exports = { app: app, server: server };
