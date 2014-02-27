define(function (require) {

	var DOMEvents = require('DOMEvents');
	var Events = function (obj) {

		if(obj instanceof Element)return new DOMEvents(obj);
		var events = obj || {};
		var listeners = {};

		events.on = function (event, callback) {

			if (!listeners[event]) listeners[event] = [];
			// add to the beginning of the array so they'll be in order when we do a reverse while loop to process them
			listeners[event].unshift(callback);

			return callback;
		};

		events.once = function(event, callback){
			events.on(event, function(data){
				events.off(event, callback);
				callback(data);
			});
		};

		events.off = function (event, callback) {
			try {
				if (callback) {
					var callbacks = listeners[event];
					var callbackIndex = callbacks.indexOf(callback);
					listeners[event].splice(callbackIndex, 1);
				} else if (callback == undefined) {
					// remove all callbacks
					listeners[event] = null;
				}
			} catch (e) {
				// fail silently
			}
		};

		events.trigger = function (event, data) {
			var callbacks = listeners[event];
			if (!callbacks) return;
			var i = callbacks.length;
			while (i--) {
				callbacks[i](data);
			}
		};

		return events;

	};

	return Events;

});