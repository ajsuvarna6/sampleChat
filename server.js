var express=require('express');
var app=express();
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);
var mongoose=require('mongoose');
var users={};

server.listen(3001);
console.log("server running on http://localhost:3001/");

mongoose.connect("mongodb://localhost/chatApp",function(err){
  if(err) console.log(err);
  else console.log("connected to mongodb");
});

var chatSchema=mongoose.Schema({
    email:{type:String},
    socketid: {type: String},
    created:{type:Date,default:Date.now}
});

var chat=mongoose.model('ActiveUsers',chatSchema);

app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
  //res.json(io.sockets);
});
//app.use(express.static(__dirname + '/'));


io.sockets.on('connection',function(socket){

  socket.on('newuser',function(data,callback){
    var newChat=new chat({email:data,socketid:socket.id});
    newChat.save(function(err){
      if(err) throw err;
      console.log(data,socket.id);
    });
    if(data in users) {
      callback(false);
    } else {
      callback(true);
      socket.email=data;
      users[socket.email]=socket;
      updatenicknames();
      //console.log(socket);
    }
  });

  function updatenicknames() {
      io.sockets.emit("usernames",Object.keys(users));
  }

  socket.on('disconnect',function(data){
    if(!socket.email) return;
    chat.remove({socketid:socket.id},function(err,rem){
      console.log(err,rem.result);
    });
    console.log("disconnected:",socket.id);
    delete users[socket.email]
    updatenicknames();
  })

  socket.on('sendmessage',function(data,callback){
    var message=data.trim();
    if(message.substring(0,3)==='/w '){
      message=message.substr(3);
      var ind=message.indexOf(' ');
      if(ind!== -1) {
        var name=message.substring(0,ind);
        var message=message.substring(ind+1);
        if(name in users) {
          users[name].emit('whisper',{msg:message,nickname: socket.email})
        } else {
          callback('error enter valid user');
        }
      }else{
        callback("Please enter a messagefor your whisper");
      }
    }else {
      io.sockets.emit('newmessage',{msg:message,email:socket.email});
    }
  });
});
