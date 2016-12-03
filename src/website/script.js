
var baseUrl = "https://localhost:8443/"
var session = {};
const MAX_SEPARATE_ROOMS = 10;
var current_rooms = 0;
var activeTab = -1;
var chatLogs = {};
var oldChatLogs = {};


// Shows user group and pass and hides the login form
function showUserData() {
	document.getElementById('details-group').style.display = 'inline-block';

	document.getElementById('details-username').textContent = session.userData.username;
	document.getElementById('details-group').textContent = session.userData.group;
	document.getElementById('details-username').onmouseover = function ()
	{
		if(!jQuery.isEmptyObject(session))
		{
			$(this).css('width', $(this).outerWidth());
			$(this).text("LOGOUT");
		}

	};

	document.getElementById('details-username').onmouseout = function ()
	{
	if(!jQuery.isEmptyObject(session))
		$(this).text(session.userData.username);
	};

	document.getElementById('details-username').onclick = logout;
	$('#workspace').show();
	$('#chat').show();
	$('#welcome').hide();

	onSketchBookLogin();
	onSysLogin(session);
}

function hideLogin(){
	$('#login-form').slideToggle("slow");
}

function logout(){
	document.getElementById('details-username').onmouseout = function() {};
	document.getElementById('details-username').onmouseover = function() {};

	document.getElementById('details-username').textContent = "LOGIN"
	document.getElementById('details-username').style.width = "auto"
	document.getElementById('details-username').onclick = showLoginForm;
	document.getElementById('details-group').style.display = 'none';

	while (chatNav.firstChild) {
    	chatNav.removeChild(chatNav.firstChild);
	}

	while (chatDropdown.firstChild) {
			chatDropdown.removeChild(chatDropdown.firstChild);
	}

	while (searchResults.firstChild) {
			searchResults.removeChild(searchResults.firstChild);
	}

	current_rooms = 0;
	activeTab = -1;
	chatLogs = {};
	oldChatLogs = {};

	$('#dropdown-selector').hide();
	$('#workspace').hide();
	$('#chat').hide();
	$('#welcome').show();

	onSketchBookLogout();
	clearChatBox();
	clearCookie();
}

// Shows the login form
function showLoginForm() {
	$('#error_text').hide();
	$('#login-form').slideToggle("slow");
}

/* Attempts to subscribe to a room.
 * Will make a request to the server.
 */
function doSubscribe(room) {
	session.subscribedRooms = session.subscribedRooms || [];
	var payload = {
		username: session.userData.user,
		token: session.userData.token,
		room: room
	}

	var url = baseUrl + "subscribe?" + encodeQueryData(payload);
	makeRequest(url, function(err, data) {
		if (err) {
			console.error('[ERROR] while Subscribing:' ,err);
		} else {
			session.subscribedRooms.push(room);
			addRoom(room);
		}
	});
}

/*
 * Handles the login button press.
 */
function onLoginClick() {
	document.cookie = '{}';
	var username = document.getElementById('username').value;
	var pass = sha256(document.getElementById('password').value);

	var url = baseUrl + "login?";
	url += encodeQueryData({"pass": pass, "username": username});

	makeRequest(url, function(err, data) {
		if (err) {
			console.error(err);
		} else {
			if (data.success === false) {
				$('#error_text').show();
				$('#error_text').css('color', 'white');
				$('#error_text').animate({color: 'red'}, 1000);
				document.cookie = "{}";
			} else {
				// save to cookie
				document.cookie = JSON.stringify(data);
				session = data;
				hideLogin();
				showUserData();
				doSubscribe('General');
				appendChatInput();
			}
		}
	});
}



/* Clears the cookie and session data. */
function clearCookie() {
	document.cookie = '{}';
	session = {};
}

/* A currified request for ping. */
var pingRequest = (currify(makeRequest))(baseUrl + "ping/");

/* Makes a tab unactive. */
function deactivateChatTab(i) {
	if(activeTab !== -1) {
		tabs[i].className = "background-tab";
		tabs[i].children[0].className = "background-ref";
	}
}

/* Makes a tab active. */
function activateChatTab(i) {
	if(i == activeTab)
		return;

	tabs[i].className = "active-tab";
	tabs[i].children[0].className = "active-ref";
	onSketchbookChangeRoom(session.subscribedRooms[i]);

	deactivateChatTab(activeTab);
	activeTab = i;
	clearChatBox();
	printChatLogs(chatLogs);
}

/* Adds the tab drop-down when capacity is reached. */
function addTabToChat(room) {
	var newTab = document.createElement("li");
	var a = document.createElement("a");
	a.href = "#";
	a.textContent = room;
	var outer = this;

	newTab.className = "background-tab";
	a.className = 'background-ref';

	newTab.appendChild(a);
	chatNav.appendChild(newTab);

	newTab.onclick = function() {
		var i = Array.prototype.indexOf.call(chatNav.children, this);
		activateChatTab(i);
	}
}

/* Ads more rooms to the dropdown. */
function addRoomToDropdown(room) {
	var newTab = document.createElement("li");
	var a = document.createElement("a");
	a.href = "#";
	a.textContent = room;
	newTab.appendChild(a);
	chatDropdown.appendChild(newTab);
}

/* The search request. */
function makeSearchRequest(query, category, callback) {
	var payload = {
		username: session.userData.user,
		token: session.userData.token,
		query: query,
		category: category
	}
	var url = baseUrl + "search?" + encodeQueryData(payload);

	makeRequest(url, function(err, data) {
		if (err) {
			console.error(err);
		} else {
			if (data.success === false) {
				alert('Invalid credentials.');
				document.cookie = JSON.stringify();
				callback('Invalid credentials');
			} else {
				// save to cookie
				var matches = data;
				callback(null, matches);
			}
		}
	});
}

/* Adds a room as a chat tab or as a dropdown item. */
function addRoom(room) {
	if (current_rooms < MAX_SEPARATE_ROOMS) {
		addTabToChat(room);
		++current_rooms;
	} else {
		$('#dropdown-selector').show();
		addRoomToDropdown(room);
	}
	tabs = $("ul.chat-tabs").find("li");


	if (tabs.length === 1)
	{
		activateChatTab(0);
	}
}

/* Toggles the search box. */
function toggleSearchBox() {
	$('#search-form').slideToggle('slow');
}

/* Creates a result in the search form. */
function makeResult(text) {
	// <label><input type="checkbox" value="">Option 1</label>
	if (session.subscribedRooms.indexOf(text) !== -1)
		return;
	var div = document.createElement('div');
	div.class = "checkbox";
	var label = document.createElement('label');
	var input = document.createElement('input');
	input.type = 'checkbox';
	input.onchange = onCheckboxChange;
	input.class = "result_checkbox";
	div.appendChild(input);
	label.appendChild(document.createTextNode(text));
	div.appendChild(label);
	searchResults.appendChild(div);
}

function onCheckboxChange(e) {
	var room = this.parentNode.lastChild.textContent;
	if (this.checked) {
		if (session.subscribedRooms && session.subscribedRooms.indexOf(room) === -1) {
			doSubscribe(room);
		}
	} else {
		// blah
	}
}

function sendMessage(msg) {
	var payload = {
		token: session.userData.token,
		username: session.userData.username,
		group: session.userData.group,
		message: msg,
		room: session.subscribedRooms[activeTab]
	};

	var url = baseUrl + 'send?' + encodeQueryData(payload);
	makeRequest(url, function(err, data) {
		if(err) {
			console.error(err);
		} else {
			chatinputbox.children[0].value = '';
		}
	});
}

function handleChatInput(e) {
	if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (e.keyCode == '13') { // endl
    	var msg = this.value;
    	sendMessage(msg);
    }
}

function handleSendInput(e) {
	if (!e) e = window.event;
	var input = document.getElementById('user-input-text');
	if(input.value !== '')
	{
		sendMessage(input.value);
	}
}

function makeChatMessage(message) {
	// <div class="msg_holder">
	// 		 <span class="label label-default">asteroid.vasile</span>
	// 		 <input type="text" class="messages" disabled value="hello">
	// 	</div>
	var div = document.createElement('div');
	var span = document.createElement('span');
	var input = document.createElement('span');

	div.className = 'msg_holder';

	span.textContent = message[0];
	span.id = 'msg_label';

	input.textContent = message[2];
	input.id = 'msg_value';

	if (message[0] == session.userData.username) {
		span.textContent = 'you';
		div.appendChild(span);
		div.appendChild(input);
	} else {
		input.style.borderRight = '1px solid #a09e9e';
		input.style.borderLeft = '0px';
		input.style.textAlign = 'right';
		div.appendChild(input);
		div.appendChild(span);
	}

	chatbox.appendChild(div);
	input.style.width = div.clientWidth  - span.offsetWidth - 25 + "px" ;

	updateScroll();
}

function testCompareMessage(msg1, msg2){
	if(msg1.length !== msg2.length)
		return false;

	for(var i = 0; i < msg1.length; ++i)
		if(msg1[i] !== msg2[i])
			return false;

	return true;
}

function filter(oldLog, newLog) {
    var result = {};
    for (room in newLog) {
    	var old_msg = oldLog[room];
    	var new_msg = newLog[room];
    	result[room] = [];
    	if (!old_msg && !new_msg)
    		continue;
    	if (!old_msg && new_msg)
    		result[room] = new_msg;
    	else {
    		if(old_msg.length === 50 && new_msg.length === 50)
    		{
    			if(!testCompareMessage(old_msg[49], new_msg[49]))
    			{
					result[room] = [new_msg[new_msg.length - 1]];
    			}
    		}
    		else
    		{
    			for(var i = old_msg.length; i < new_msg.length; ++i)
    				result[room].push(new_msg[i]);
    		}

    	}

    }

    return result;
}

function clearChatBox() {
	while (chatbox.childNodes.length > 0) {
		chatbox.removeChild(chatbox.firstChild);
	}
}

function printChatLogs(logs) {
	if (!chatLogs)
		return;

	var room = session.subscribedRooms[activeTab];
	if (!(logs[room]))
		return;
	for (var i = 0; i < logs[room].length; ++i) {
		makeChatMessage(logs[room][i]);
	}
}

function updateChatLogs() {
	if(!jQuery.isEmptyObject(session))
	{
		var payload = {
			token: session.userData.token,
			username: session.userData.username,
		};

		var url = baseUrl + "ping?" + encodeQueryData(payload);
		makeRequest(url, function(err, data) {
			if (err) {
				console.error('Error:', JSON.stringify(err, null, 4));
			} else {
				oldChatLogs = chatLogs;
				chatLogs = data;

				printChatLogs(filter(oldChatLogs, chatLogs));
			}
		})
	}
}

function updateScroll(){
    var element = document.getElementById("chatbox");
    element.scrollTop = element.scrollHeight;
}

setInterval(updateChatLogs, 50);

function onSysResize(){
	var element = document.getElementById("chatbox");
	var nodes = element.children;

	for(i=0; i< nodes.length; ++i) {
		var div = nodes[i];
		var label = nodes[i].querySelector('#msg_label');
		var textsdsa = nodes[i].querySelector('#msg_value');

		textsdsa.style.width = div.clientWidth  - label.offsetWidth - 25 + "px" ;
	}

}
