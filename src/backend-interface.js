var db = require('./db_handler.js');
var fs = require('fs');
var deepcopy = require('deepcopy');

/*var an1 = ["Mate1", "Mate2", "PL", "USO", "Programare", "Mate3", "Fizica", "ELTH", "MN", "SD"];
var an2 = ["IOCLA", "POO", "TS", "EA", "CN1", "ED", "PA", "AA", "PC", "PP"];
var an3 = ["EGC", "RL", "LFA", "APD", "CN2", "IP", "ASC", "SO", "PM", "BD"];
var an4 = ["IA", "IC", "IOC", "SPG", "EP", "ML", "CAD/CASE", "ECOM"];
*/
var rooms = ["General", "Mate1", "Mate2", "PL", "USO", "Programare", "Mate3", "Fizica", "ELTH", "MN", "SD","IOCLA", "POO", "TS", "EA", "CN1", "ED", "PA", "AA", "PC", "PP", "EGC", "RL", "LFA", "APD", "CN2", "IP", "ASC", "SO", "PM", "BD", "IA", "IC", "IOC", "SPG", "EP", "ML", "CAD/CASE", "ECOM"];

var wshop = [];

var chatLogsPath = "./chatlogs/chatLogs.json";
var sketchBookPath = "./chatlogs/sketchbooklogs.json";

const chatLogSaveTime = 5000;	// save chatlogs to file every 5s
const sketchbookSaveTime = 60000;	// save sketchbooks to file every 60s
const maxSketchBooks = 10000;	// save sketchbooks to file every 60s

var chatLogs = {};
var sketchbookLogs = {};

function log() {
	var timestamp = new Date();
	var args = arguments;
	var str = '';
	for (var i = 0; i < arguments.length; ++i) {
		str += arguments[i] + ' ';
	}
	console.log(timestamp + ":", str);
}

/*
 * Interface for backend functionality, used to respond to front-end requests.
 * All functions should return a JS object: {key: val}
 */

function authenticate(user, pass, callback) {
	db.getUserData(user, pass, function(err, response){
		if (err || response === null)
			return callback(null, {"success":false});
		else {
			var userData = response;
			var mapVector = db.getMapData(function(err, response){
				if (err)
				  return callback(null, {"success":false});
				else {
					return callback(null, {
						"success": true,
						"userData": userData,
						"mapData":response
					});
				}
			});
		}
	});
}

/*
 * Checks if the request holds a valid user/token pair.
 */
function verifyToken(user, token, callback) {
	db.getUserDataByToken(user, token, function(err, response){
		if (err || response === null)
			return callback({"success":false});
		else {
			return callback(null, {"success":true});
		}
	});
}

/* The user is searching for projects with the given name and category.
 * The server should return a list of strings.
 * Ex: query='APD', category='Class chat room'/'Homework discussion'/'Project discussion'/'Workshop'
 */
function searchForProject(query, category) {
	// TODO: search
	if (category === "Workshop"){
		if(query === '*')
			return wshop;
		if (wshop.indexOf(query) !== -1)
			return [query];
		else{
			wshop.push(query);
			return wshop;
		}
	}
	else{
		if(query === '*')
			return rooms;
		if (rooms.indexOf(query) !== -1){
			return [query];
		}
		else {
			rooms.push(query);
			return rooms;
		}
	}
}

function saveChatLogs() {
	fs.writeFile(chatLogsPath, JSON.stringify(chatLogs, null, 4), function(err, data) {
		if (err) {
			console.error('Error saving chat logs:', err);
		} else {
		}
	})
}

function loadChatLogs() {
	fs.readFile(chatLogsPath, function(err, data) {
		if (err) {
			console.error(err);
			chatLogs = {};
		} else {
			chatLogs = JSON.parse(data);
		}
	});
}

function getChatLogs() {
	var new_logs = deepcopy(chatLogs);
	var keys = Object.keys(new_logs);
	for (var i = 0; i < keys.length; ++i) {
		new_logs[keys[i]] = chatLogs[keys[i]].slice(Math.max(0, chatLogs[keys[i]].length - 50));
	}
	return new_logs;
}

function sendMessage(room, message) {
	if (!(room in chatLogs)) {
		chatLogs[room] = [message];
	} else {
		chatLogs[room].push(message);
	}
	console.log(chatLogs);
}

function getMapData(callback) {
	db.getMapData(function(err, response){
		if (err)
			return callback(null, {"success":false});
		else {
			return callback(null, {
				"success": true,
				"mapData":response
			});
		}
	});
}

function roomExists(room) {
	return rooms.indexOf(room) !== -1 || wshop.indexOf(room) !== -1;
}

loadChatLogs();
setInterval(saveChatLogs, chatLogSaveTime);


function saveSketchbookLogs() {
	fs.writeFile(sketchBookPath, JSON.stringify(sketchbookLogs, null, 4), function(err, data) {
		if (err) {
			console.error('Error saving sketchbook logs:', err);
		} else {
		}
	})
}

function loadSketchbookLogs() {
	fs.readFile(sketchBookPath, function(err, data) {
		if (err) {
			console.error(err);
			sketchbookLogs = {};
		} else {
			sketchbookLogs = JSON.parse(data);
		}
	});
}

function getSketchbookLogs(room) {
	if (sketchbookLogs[room] != undefined)
	{
		var new_logs = sketchbookLogs[room].slice(Math.max(0, sketchbookLogs[room].length - maxSketchBooks));
		return new_logs;
	} else {
		return [];
	}
}

function saveSketchbook(room, line_segment) {
	if (!(room in sketchbookLogs)) {
		sketchbookLogs[room] = [line_segment];
	} else {
		sketchbookLogs[room].push(line_segment);
	}
}

function clearSketchbook(room) {
		if (room in sketchbookLogs) {
			sketchbookLogs[room] = [];
	}
}

loadSketchbookLogs();
setInterval(saveSketchbookLogs, sketchbookSaveTime);

/* Export all functions. */
module.exports = {
	authenticate: authenticate,
	verifyToken: verifyToken,
	searchForProject: searchForProject,
	getChatLogs: getChatLogs,
	getSketchbookLogs: getSketchbookLogs,
	sendMessage: sendMessage,
	saveSketchbook: saveSketchbook,
	roomExists: roomExists,
	clearSketchbook: clearSketchbook,
	getMapData: getMapData
}
