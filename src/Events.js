define(function (require) {

	var Events = function (obj) {

		//TODO: handle dom events

		var events = obj || {};
		var listeners = {};

		var catchDomEvents = obj instanceof Element;

		events.on = function (event, callback) {
			if (!listeners[event]) listeners[event] = [];
			// add to the beginning of the array so they'll be in order when we do a reverse while loop to process them
			listeners[event].unshift(callback);


			//TODO: DOM
			// try something like if( ('on' + event) in obj ){...} to check if it's a dom event
			// add listener to dom element that calls .trigger



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

			//TODO: how do we create and fire a dom event?
		};

		return events;

	};

	return Events;

});