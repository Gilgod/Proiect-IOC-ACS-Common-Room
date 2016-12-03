var canvas;
var ctx;
var socket;

var lineHistory = [];

var drawing = false;
var sketchbookoldwidth, sketchbookoldheight;
var prev = {};
var scale = {x:1, y:1};

/* the interval at which to sync data to the replayDaemon in ms*/
const discreteInterval = 10;

function clearRoom() {
  clear();
  socket.emit('clear', { });
}

function onSketchBookLogin() {
  clear();
  socket.emit('login', { username: session.userData.username, token: session.userData.token });
}

function onSketchBookLogout() {
  clear();
  socket.emit('logout', { });
}

function onSketchbookChangeRoom(newRoom) {
  clear();
  socket.emit('changeroom', { room: newRoom });
}

function onScrapbookInit() {
  canvas = document.getElementById('sketchbook-canvas');
  ctx = canvas.getContext('2d');
  socket = io.connect(baseUrl);

  /* Bind all our shit here */
  socket.on('data', onDataReceive);
  socket.on('clear', clear);
  socket.on('reply', onReply);

  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseout', onMouseOut);
  canvas.addEventListener('mousemove', onMouseMove);

  /* handle resizing */
  window.addEventListener('resize', sketchbookResize, false);
  sketchbookoldwidth = 1920;
  sketchbookoldheight = 974;
  sketchbookResize();
}

function onMouseUp(e) {
  if(e.button == 0) { //LMB
    drawing = false;
    prev = {};
  }
}

function onMouseDown(e) {
  if(e.button == 0) { //LMB
    drawing = true;
    e.preventDefault();
    prev = buildMouseData(e);
  }
}

function onMouseOut(e) {
  drawing = false;
  prev = {};
}

function buildMouseData(e) {
  var rect = canvas.getBoundingClientRect();
  return {time: $.now(), x: (e.clientX - rect.left) / scale.x, y: (e.clientY - rect.top) / scale.y};
}

function onMouseMove(e) {
  if($.now() - prev.time > discreteInterval) {
    var obj = buildMouseData(e);
    drawLine(prev, obj);
    socket.emit('datainput', { last: prev, next: obj });
    lineHistory.push({ last: prev, next: obj });
    prev = obj;
  }
}

function onDataReceive(data) {
  lineHistory.push(data);
  drawLine(data.last, data.next);
}

function onReply(data) {
  if(!data.success)
    alert(data.msg);
}

/* draws a line on the canvas */
function drawLine(a, b){
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function reDraw() {
  for(var idx = 0; idx < lineHistory.length; ++idx) {
    drawLine(lineHistory[idx].last, lineHistory[idx].next);
  }
}

function clear() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.restore();

  lineHistory = [];
}

function sketchbookResize()
{
    var width  = canvas.width * (window.innerWidth / sketchbookoldwidth);
    var height = canvas.height * (window.innerWidth / sketchbookoldwidth);

    scale.x = scale.x * (window.innerWidth / sketchbookoldwidth);
    scale.y = scale.y * (window.innerWidth / sketchbookoldwidth);

    canvas.width = width;
    canvas.height = height;

    ctx.scale(scale.x, scale.y);

    reDraw();

    sketchbookoldwidth = window.innerWidth;
    sketchbookoldheight = window.innerHeight;
}
