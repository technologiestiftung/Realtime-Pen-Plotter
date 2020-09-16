#!/usr/bin/env node
var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var httpPort = process.env.PORT || 3000;

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

const dimensions = {
  x : 1300,
  y : 1220
}

let serialPort
try {
  SerialPort.list().then((ports) => {
    ports.forEach((port) => {
      console.log(port.path);
    });
  });
  console.log(" ")

  serialPort = new SerialPort('/dev/ttyACM0', {
    baudRate: 115200
  })
  const parser = serialPort.pipe(new Readline({ delimiter: '\r\n' }))
  parser.on('data', console.log)

} catch (error) {
  console.error(error);
}

// WEB SERVER

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });
app.use(express.static('sketches'))

io.on('connection', function(socket){
  socket.on('position', function(msg){
    // console.log(msg)
    if (msg.x < 0) msg.x = 0;
    if (msg.x > dimensions.x) msg.x = dimensions.x;
    if (msg.y < 0) msg.y = 0;
    if (msg.y > dimensions.y) msg.y = dimensions.y;

    const scale = 1
    const command = "G90 X" + (msg.x * scale) + " Y" + (msg.y * scale) + "\n"
    console.log(command)
    serialPort.write(command, function(err, results) {
      if (err) console.log('err ' + err);
      if (results) console.log('results ' + results);
    });
  });

  socket.on('positionNormalised', function(msg){
    // console.log(msg)
    if (msg.x < 0) msg.x = 0;
    if (msg.x > 1) msg.x = 1;
    if (msg.y < 0) msg.y = 0;
    if (msg.y > 1) msg.y = 1;

    const command = "G90 X" + (msg.x * dimensions.x) + " Y" + (msg.y * dimensions.y) + "\n"
    console.log(command)
    serialPort.write(command, function(err, results) {
      if (err) console.log('err ' + err);
      if (results) console.log('results ' + results);
    });
  });

  socket.on('penDown', function(penDown){
    // console.log(msg)

    const up = 5
    const down = 0
    const command = "G90 Z" + (penDown ? down : up) + "\n"
    console.log(command)
    serialPort.write(command, function(err, results) {
      if (err) console.log('err ' + err);
      if (results) console.log('results ' + results);
    });
  });
});

http.listen(httpPort, function(){
  console.log('listening on *:' + httpPort);
});

// CONNECTION TO GBRL PEN PLOTTER

if (serialPort) serialPort.on("open", async function () {

  serialPort.write("\r\n\r\n", function(err, results) {
    if (err) console.log('err ' + err);
    if (results) console.log('results ' + results);
  });

  await new Promise(r => setTimeout(r, 4000));

  serialPort.flush();

  console.log("start sending commands")
  serialPort.write("$X\n$H\nZ10\n", function(err, results) {
    if (err) console.log('err ' + err);
    if (results) console.log('results ' + results);
  });


  // port.on('data', function (data) {
  //   console.log(data);
  //   // dequeue();
  // });

  serialPort.on('error', function (err) {
    console.log(err);
  });

  serialPort.on('close', function () {
    process.exit(0);
  });
});
