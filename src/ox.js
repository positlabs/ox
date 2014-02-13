define(function (require) {


	/*

	 ox is an element wrapper.
	 ox('.something'); //returns an ox instance

	 Elements in an ox object are accessible as array indexes
	 ox[0] is an Element


	* */

	function ox(selector){


	}

	ox.Events = require("Events");
	ox.FrameImpulse = require("FrameImpulse");

	window.ox = ox;
	return ox;

});
