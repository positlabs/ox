define(function (require) {

	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}

	var Events = require("Events");

	var FrameImpulse = new Events();
	var _this = FrameImpulse;
	var stopFlag = false;

	function run(deltaTime) {
		if (!stopFlag) {
			requestAnimationFrame(run);
			_this.trigger("frame", deltaTime);
		}
	}

	FrameImpulse.start = function () {
		stopFlag = false;
		run(0);
		_this.trigger("start");
	};

	FrameImpulse.stop = function () {
		_this.trigger("stop");
	};

	return FrameImpulse;

});