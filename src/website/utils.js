/* Encodes data into an URL query.
 *
 */
function encodeQueryData(data) {
   let ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

/* Performs an AJAX query.
 * The url is the target of the query.
 * The callback is a function with 2 params: err, data
 */
function makeRequest(url, callback) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			return callback(null, JSON.parse(this.responseText));
		} else if(this.readyState == 4) {
			return callback(this.status);
		}
	};

	xhttp.onerror = function () {
		return callback(this.status);
	}

	xhttp.open("GET", url, true);
	xhttp.send();
}

/* Enables functional curry-ing of procedures.
 * Example:
 *	var logger_o = function(a, b) { console.log(a, b); }
 *	var logger = currify(logger_o);
 *	var log_hello = logger('hello');
 *	log_hello('world'); <--- prints 'hello world'
 *
 */
function currify(f) {
	var arity = f.length;

	return (function encapsulator() {
		var args = Array.prototype.slice.call(arguments);
		return function() {
			var lh =  args.slice();
			Array.prototype.push.apply(lh, arguments);
			var callNext = lh.length >= arity ? f : encapsulator;
			return callNext.apply(null, lh);
		};
	}());
}
