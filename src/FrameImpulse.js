define(function (require) {

	var RAF = require("ReqAnimFrame");
	var Events = require("Events");

	var FrameImpulse = new Events();
	var _this = FrameImpulse;
	var stopFlag = false;

	function run(deltaTime) {
		if (!stopFlag) {
			RAF(run);
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