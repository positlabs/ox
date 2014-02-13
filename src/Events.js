define(function (require) {

	var Events = function (obj) {

		var events = obj || {};
		var listeners = {};

		events.on = function (event, callback) {
			if (!listeners[event]) listeners[event] = [];
			// add to the beginning of the array so they'll be in order when we do a reverse while loop to process them
			listeners[event].unshift(callback);
			return callback;
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