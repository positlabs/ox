define(function (require) {

	var DOMEvents = function (element) {

		element.on = function (event, callback) {
			element.addEventListener(event, callback);
			return callback;
		};

		element.once = function (event, callback) {
			element.on(event, function (data) {
				element.off(event, callback);
				callback(data);
			});
		};

		element.off = function (event, callback) {
			element.removeEventListener(event, callback);
		};

		element.trigger = function (eventName) {

			var event; // The custom event that will be created

			if (document.createEvent) {
				event = document.createEvent("HTMLEvents");
				event.initEvent(eventName, true, true);
			} else {
				event = document.createEventObject();
				event.eventType = eventName;
			}

			event.eventName = eventName;

			if (document.createEvent) {
				element.dispatchEvent(event);
			} else {
				element.fireEvent("on" + event.eventType, event);
			}
		}

	};

	return DOMEvents;

});