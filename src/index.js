/*
 * Router for serving the front-end content.
 *
 */

var fs = require('fs');
var https	= require('https');
var express = require("express");
var app = express();
var router = express.Router();
var path = __dirname + '/website/';
var server = require('./backend-interface.js');
var db = require('./db_handler.js');
var io = require('socket.io')

var sslKey      = fs.readFileSync(__dirname + '/../keys/certificate.key');
var sslCert     = fs.readFileSync(__dirname + '/../keys/certificate.crt');
var credentials = {
	key: sslKey,
	cert: sslCert
};

router.use(function (req,res,next) {
  next();
});

router.get("/",function(req,res){
  res.sendFile(path + "index.html");
});

// Serve the index.html page
router.get("/index",function(req,res){
  res.sendFile(path + "index.html");
});

/* Login target
 *
 * Sends an object of format: {"success": true/false}
 */
router.get('/login', function(req, res) {
	server.authenticate(req.query.username, req.query.pass, function(err, data){
	if (err)
		return err;
	res.send(data);
	});
});

/* The user will search for a project name and category, the server will respond with a list
 * of the closest matches.
 * The list should only contain strings, chat rooms should exist for the
 * returned objects.
 */
router.get('/search', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
			var matches = server.searchForProject(req.query.query, req.query.category);
			res.send(matches);
		}
	});
});


router.get('/report', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
			var accused = req.query.accused;
			var message = req.query.message;
			var input = {"receiver":accused, "message":message};
			db.makeReport(input, function(err, message){
				if (err)
					return err;
				res.send({"success":true});
			});
		}
	});
});

router.get('/getReport', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
			var accused = req.query.accused;
			db.makeReport(accused, function(err, message){
				if (err)
					return err;
				res.send({"success":true, "listaReports":message});
			});
		}
	});
});


router.get('/getMapData', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
				server.getMapData(function (err, data) {
					res.send(data);
				});
			}
	});
});

/* The user could make a reservation.
	{"username": "anda.florea", "group":"341C4", "id":"1", "projectName":"IOC", "category":"School", "startTime":"2016-12-05T19:00", "endTime":"2016-12-05T20:00"};
 */
router.get('/addReservation', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
			var username = req.query.username;
			var group = req.query.group;
			var id = req.query.id;
			var projectName = req.query.projectName;
			var category = req.query.category;
			var startTime = req.query.startTime;
			var endTime = req.query.endTime;
			var input = {"username":username, "group":group, "id":id, "projectName":projectName, "category":category, "startTime":startTime, "endTime":endTime};
			db.getReservationById(input.id, function(err, data){
				if (err)
					return err;
				if(data)
					for (var i =0; i < data.length; i++){
						if ((new Date(input.endTime) < new Date(data[i].startTime)) || (new Date(input.startTime) > new Date(data[i].endTime))){
							continue;
						}
						else {
							res.send({"success":false, "msg": "The desk is occupied"});
							return;
						}
					}
				db.makeReservation(input, function(err, message){
					if (err)
						return err;
					res.send({"success":true});
				});
			});
		}
	});
});

/* Chat service subscription target.
 * The user session will make a query to this and (if his token is validated)
 * the server will check if the room exists.
 */
router.get('/subscribe', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data){
		if (err)
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		else {
			var room = req.query.room || 'General';
			var user = req.query.username;
			if (server.roomExists(room)) {
				res.send({'error': false});
			} else {
				res.send({'error': true});
			}
		}
	});
});

/* User will call this periodically, the server will return a json containing
 * the chat messages ONLY for the rooms he is subscribed to.
 *
 * The server will send a JS object with the following format:
 *
 * {
 *     "chatRoom1" : [
 *			["user11", "grupa_user11", "msg11"],  <---- IN CHRONOLOGICAL ORDER!
 *			["user12", "grupa_user12", "msg12"],
 *			["user13", "grupa_user13", "msg13"]
 *		]
 *		"chatRoom2" : [
 *			["user21", "grupa_user21", "msg21"],
 *			["user22", "grupa_user22", "msg22"]
 *		]
 * }
 */
router.get('/ping', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data) {
		if (err) {
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		} else {
			res.send(server.getChatLogs());
		}
	});
});

/*
 * User sends a message.
 * The message will be added to the chatlog for the room he's sending it to.
 * A list of chatlogs can be held in memory as a list of objects of format:
 * {    "chatRoomName" : [
 *			["user11", "grupa_user11", "msg11"],  <---- IN CHRONOLOGICAL ORDER!
 *			["user12", "grupa_user12", "msg12"],
 *			["user13", "grupa_user13", "msg13"]
 *		]
 *	}
 * This list of objects can be used to construct the ping response.
 * For backup, each chat room object is saved to an object and loaded on server
 * start-up (the folder used for the chat logs is src/chatlogs.
 */
router.get('/send', function(req, res) {
	server.verifyToken(req.query.username, req.query.token, function(err, data) {
		if (err) {
			res.send({'error': true, 'msg': 'Invalid token for this user!'});
		} else {
			var user = req.query.username;
			var group = req.query.group;
			var message = req.query.message;
			var room = req.query.room;
			if (!server.roomExists(room)) {
				res.send({'error': true, 'msg': 'Room does not exist'});
			} else {
				server.sendMessage(room, [user, group, message]);
				res.send({'error': false});
			}
		}
	});
});

app.use("/",router);

// Redirect to the page
app.use("*",function(req,res){
  res.sendFile(path + req.baseUrl);
});


var httpsServer = https.createServer(credentials, app);
var replayDaemon = io.listen(httpsServer);

httpsServer.listen(8443, function() {
	var host = httpsServer.address().address;
	var port = httpsServer.address().port;
	console.log("Server is running on [%s:%s]...", host, port);
});

httpsServer.on('error', function(err) {
	if (err.code === 'EADDRINUSE') {
		console.error('ERROR! ADDRESS IS ALREADY IN USE');
	} else {
		console.error(err.code);
	}
})


var sysSockets = {};

function burstData(socket) {
	var room = sysSockets[socket.id].room;
	var logs = server.getSketchbookLogs(room);

	console.log('[replayDaemon][' + socket.id + '] BURSTING ' + logs.length);

	for(var i = 0; i < logs.length; ++i)
		socket.emit('data', logs[i]);
}

replayDaemon.sockets.on('connection', function (socket) {
	sysSockets[socket.id] = { room:'Generic', auth: false, username: '' };

	console.log('[replayDaemon][' + socket.id + '] connected');

	socket.on('login', function (data) {
		sysSockets[socket.id].username = data.username;
		server.verifyToken(data.username, data.token, function(err, data) {
			if (err) {
				console.log('[replayDaemon][' + socket.id + '] Invalid session token!');
				socket.emit('reply', { success: false, msg: 'Invalid login' });
			} else {
					sysSockets[socket.id].auth = true;
					console.log('[replayDaemon][' + socket.id + '] ' + sysSockets[socket.id].username + ' logged in');
					socket.emit('reply', { success: true, msg: '' });
			}
		});
	});

	socket.on('logout', function (data) {
		if(sysSockets[socket.id].auth) {
			sysSockets[socket.id].auth = false;
			console.log('[replayDaemon][' + socket.id + '] ' + sysSockets[socket.id].username + ' logged out');
			socket.emit('reply', { success: true, msg: '' });
		} else {
			socket.emit('reply', { success: false, msg: 'not logged in' });
		}
	});

	socket.on('changeroom', function (data) {
		if(sysSockets[socket.id].auth) {
			socket.join(data.room);
			socket.leave(sysSockets[socket.id].room);
			sysSockets[socket.id].room = data.room;
			burstData(socket);
			console.log('[replayDaemon][' + socket.id + '] ' + sysSockets[socket.id].username + ' switched room to ' + data.room);
			socket.emit('reply', { success: true, msg: '' });
		} else {
			socket.emit('reply', { success: false, msg: 'not logged in' });
		}
});

	socket.on('datainput', function (data) {
		server.saveSketchbook(sysSockets[socket.id].room, data);
		socket.broadcast.to(sysSockets[socket.id].room).emit('data', data);
	});

	socket.on('clear', function (data) {
		server.clearSketchbook(sysSockets[socket.id].room);
		socket.broadcast.to(sysSockets[socket.id].room).emit('clear', data);
	});

	socket.once('disconnect', function () {
		console.log('[replayDaemon][' + socket.id + '] disconnected');
		sysSockets[socket.id] = null;
	});

});
