var db = require('./db_handler.js');

//insert users in database
var object1 = {"username":"anda.florea", "password": "64da1aa4d60f4f3af3abb871792fa38950d83f028091521777f87d37eea3675c", "group":"341C4", "token": "64da675c"};
var object2 = {"username":"robert.botarleanu", "password": "18b3b54dc820a07ba6299fb138ccebea712dbf023791a52207943f7b49398137", "group":"341C4", "token":"18b38137"};
var object3 = {"username":"vlad.muscalu", "password": "caa7a58119ee40a5c9c4239f19ab3888b96c05cca335f3ff0e4903dd938a72ad", "group":"341C4", "token":"caa772ad"};
var object4 = {"username":"ionut.soare", "password": "68482803aaba8275b96565b25ecabcdc475b21b08b7ff09e018f9e798a5b9bda", "group":"331CC", "token":"68489bda" };
var object5 = {"username":"maria.tanase", "password": "3bad26af3c1b870f125926be991fef89cdc22c895c38b68297fe6762815da2ba", "group":"312CA", "token":"3bada2ba" };
var object6 = {"username":"ana.popescu", "password": "98e744922587656d04bd136292efba0fcb40038c4742d93710a0592640fdbeb5", "group":"313CB", "token":"98e7beb5"};

var users = [object1, object2, object3, object4, object5, object6];
for (i= 0; i < users.length; i++){
	db.insertUser(users[i], function(message){console.log(message);});
}

//make some reservations for these users
var res1 = {"username": "anda.florea", "group":"341C4", "id":"1", "projectName":"IOC", "category":"School", "startTime":"2016-12-03T19:00", "endTime":"2016-12-03T20:00"};
var res2 = {"username": "robert.botarleanu", "group":"341C4", "id":"2", "projectName":"IOC", "category":"School", "startTime":"2016-12-03T19:00", "endTime":"2016-12-03T21:00"};
var res3 = {"username": "vlad.muscalu", "group":"341C4",  "id":"3", "projectName":"MN", "category":"School", "startTime":"2016-12-03T19:00", "endTime":"2016-12-03T21:00"};

var reservations = [res1, res2, res3];
for (i= 0; i < reservations.length; i++){
	db.makeReservation(reservations[i], function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});
}

//select
db.getUserData("anda.florea", "64da1aa4d60f4f3af3abb871792fa38950d83f028091521777f87d37eea3675c",  function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});

db.getMapData(function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});

db.getReservationById(2, function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});

var report = {"receiver":"anda.florea", "message":"She's not here"};
db.makeReport(report, function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});

var report1 = {"receiver":"anda.florea", "message":"...."};
db.makeReport(report1, function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});


db.getReportsForUser("anda.florea",function(err, message){
				if (err)
					console.log(err)
				else
					console.log(message);
});
