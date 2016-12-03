
/*
 * Wrapper over elasticsearch, used for database functionalities.
 *
 */

var elasticsearch = require('elasticsearch');
var deepcopy = require('deepcopy');
var client = new elasticsearch.Client({
	host: '127.0.0.1:9200'
});


module.exports = {
	ping: ping,
	getUserData: getUserData,
	getUserDataByToken: getUserDataByToken,
	getReservationById: getReservationById,
	insertUser: insertUser,
	makeReservation: makeReservation,
	makeReport: makeReport,
	getMapData: getMapData,
	getReportsForUser: getReportsForUser
}

// Just checks if stuff is working.
function ping(callback) {
	client.ping({requestTimeout: 200}, function(err) {
		if (err) {
			console.trace(err);
			callback(err);
		} else {
			callback(null, 'OK');
		}
	});

}



/* Inserts a user. userObject should be a JSON that contains information like
 * userName, password, group and token */
function insertUser(userObject, callback) {
	var obj = deepcopy(userObject);
	// Insert a timestamp so 3rd party modules don't throw a fit.
	obj.date = new Date().toISOString();
	client.index({
			index: "user",
			type: "json",
			body: obj
		}, function(err, data) {
			if (err) {
				console.error(err);
				return callback(err);
			}
			var message = "Added user " + obj.username;
			return callback(message);
		}
	);
}

/* Makes reservation. userObject should be a JSON that contains information like
 * userName, group, projectName, category, start_time, end_time */
function makeReservation(userObject, callback) {
	var obj = deepcopy(userObject);
	// Insert a timestamp so 3rd party modules don't throw a fit.
	obj.date = new Date().toISOString().split('T')[0];
	client.index({
			index: "map",
			type: "json",
			body: obj
		}, function(err, data) {
			if (err) {
				console.error(err);
				return callback(err);
			}
			var message = "Make a reservation for " + obj.username;
			return callback(err, message);
		}
	);
}

function makeReport(userObject, callback) {
	var obj = deepcopy(userObject);
	// Insert a timestamp so 3rd party modules don't throw a fit.
	obj.date = new Date().toISOString().split('T')[0];
	client.index({
			index: "report",
			type: "json",
			body: obj
		}, function(err, data) {
			if (err) {
				console.error(err);
				return callback(err);
			}
			var message = obj.receiver + " was reported.";
			return callback(err, message);
		}
	);
}


/* Gets the data for a user by matching username and password. */
function getUserData(userName, password, callback) {
	client.search({
			index: 'user',
			body: {
				"query": {
					"bool": {
						"must": [
							{
								"match": {
									"username": userName
								},
								"match": {
									"password": password
								}
							}
						]
					}
				}
			}
		}, function(err, data) {
			if (err) { // query error
				console.error(err);
				return callback(err);
			}

			/* No match found. */
			if (data.hits.hits.length == 0) {
				return callback(null, null);
			}

			/* Return everything that was added for that user in elastic. */
			var userData = data.hits.hits[0];
			return callback(null, userData._source);
		}
	);
}

/* Gets the data for a user by matching username and token. */
function getUserDataByToken(userName, token, callback) {
	client.search({
			index: 'user',
			body: {
				"query": {
					"bool": {
						"must": [
							{
								"match": {
									"username": userName
								},
								"match": {
									"token": token
								}
							}
						]
					}
				}
			}
		}, function(err, data) {
			if (err) { // query error
				console.error(err);
				return callback(err);
			}

			/* No match found. */
			if (data.hits.hits.length == 0) {
				return callback(null, null);
			}

			/* Return everything that was added for that user in elastic. */
			var userData = data.hits.hits[0];
			return callback(null, userData._source);
		}
	);
}

function getMapData(callback) {
	// TODO: get map data for the current day (or something)
	var today = new Date().toISOString().split('T')[0];
	// Temporary fix to allow sample data to exists!

	client.search({
			index: 'map',
			body: {
				"query": {
					"match":{
						"date":today
					}
				}
			}
		}, function(err, data) {
			if (err) { // query error
				console.error(err);
				return callback(err);
			}

			/* No match found. */
			if (data.hits.hits.length == 0) {
				return callback(null, null);
			}

			/* Return everything that was added for that user in elastic. */
			var userData = [];
			for (var i = 0; i < data.hits.hits.length; i++){
				userData[i] = data.hits.hits[i]._source;
			}
			return callback(null, userData);
		}
	);
}

function getReportsForUser(user, callback) {
	// TODO: get reports for username
	client.search({
			index: 'report',
			body: {
				"query": {
					"match":{
						"receiver":user
					}
				}
			}
		}, function(err, data) {
			if (err) { // query error
				console.error(err);
				return callback(err);
			}

			/* No match found. */
			if (data.hits.hits.length == 0) {
				return callback(null, null);
			}

			/* Return everything that was added for that user in elastic. */
			var userData = [];
			for (var i = 0; i < data.hits.hits.length; i++){
				userData[i] = data.hits.hits[i]._source;
			}
			return callback(null, userData);
		}
	);
}

function getReservationById(id, callback) {
	// TODO: get map data for the current day (or something)
	client.search({
			index: 'map',
			body: {
				"query": {
					"match":{
						"id":id
					}
				}
			}
		}, function(err, data) {
			if (err) { // query error
				console.error(err);
				return callback(err);
			}

			/* No match found. */
			if (data.hits.hits.length == 0) {
				return callback(null, null);
			}

			/* Return everything that was added for that user in elastic. */
			var userData = [];
			for (var i = 0; i < data.hits.hits.length; i++){
				userData[i] = data.hits.hits[i]._source;
			}
			return callback(null, userData);
		}
	);
}
