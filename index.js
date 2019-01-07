var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require('express-session');
var userConnected =[];
var expiryDate = new Date( Date.now() + 60 * 60 * 1000 ); // 1 hour

//MODELO QUE ALMACENA LOS USUARIOS QUE TIENEN SESION ABIERTA
function clientSession(socketId, nickname)
{
  this.socketID = socketId;
  this.nickname = nickname;
}

app.use(session({
  name: 'session',
  keys: ['key1', 'key2'],
  cookie: { secure: true,
            httpOnly: true,
            domain: 'example.com',
            path: 'foo/bar',
            expires: expiryDate
          }
  })
);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//EVENTO CUANDO HAY UNA CONEXION POR WEBSOCKET
io.on('connection', function(socket){
  console.log('a client connected'+socket.id);
  
  //EVENTO CUANDO UN CLIENTE SE DESCONECTA
  socket.on('disconnect', function(){
    var nickname;
    for(i=0; i<userConnected.length; i++)
    {
      if(userConnected[i].socketID === socket.id)
      {
        nickname = userConnected[i].nickname;
        userConnected.splice(i,1);
        break;
      }
    }   
    console.log('user disconnected ');
    console.log(userConnected);

    socket.broadcast.emit('show message','El usuario '+nickname+' se ha desconectado');
  });
 
  //EVENTO CUANDO UN USUARIO SE CONECTA
  socket.on('user connected',function(nick){
    console.log('a new user joined');
    userConnected.push(new clientSession(socket.id,nick));
    console.log(userConnected);
    socket.broadcast.emit('show message','El usuario '+nick+' se ha conectado.');
    io.emit('ui add user connected',JSON.stringify(userConnected));
  });

  //EVENTO CUANDO SE ENVIA UN MENSAJE
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('ui show message', msg);
    socket.broadcast.emit('ui typing','');
  });

  //EVENTO CUANDO UN USUARIO ESTA ESCRIBIENDO
  socket.on('typing',function(nick){
    socket.broadcast.emit('ui typing',nick.toString());
  });
  
});


//ABRE CANAL PARA ESCUCHAR PETICIONES
http.listen(3000, function(){
  console.log('listening on *:3000');
});
