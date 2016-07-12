var express=require('express');
var app=express();
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);
var users={};

server.listen(3001);
console.log("server running on http://localhost:3001/");

app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
  //res.json(io.sockets);
});
//app.use(express.static(__dirname + '/'));

io.sockets.on('connection',function(socket){

  socket.on('newuser',function(data,callback){
    if(data in users) {
      callback(false);
    } else {
      callback(true);
      socket.nickname=data;
      users[socket.nickname]=socket;
      updatenicknames();
      //console.log(socket);
    }
  });

  function updatenicknames() {
      io.sockets.emit("usernames",Object.keys(users));
  }

  socket.on('disconnect',function(data){
    if(!socket.nickname) return;
    delete users[socket.nickname]
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

          users[name].emit('whisper',{msg:message,nickname: socket.nickname})
            //console.log("whisper",io.sockets);

        } else {
          callback('error enter valid user');
        }

      }else{
        callback("Please enter a messagefor your whisper");
      }
    }else {
    io.sockets.emit('newmessage',{msg:message,nickname:socket.nickname});
    }
  });
});
