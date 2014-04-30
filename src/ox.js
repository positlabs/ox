define(function (require) {

	function ox(selector) {
		return document.querySelector(selector);
	}

	ox.select = function (selector) {
		return document.querySelector(selector);
	};
	ox.selectAll = function (selector, parent) {
		parent = parent || document;
		return parent.querySelectorAll(selector);
	};

	ox.create = function(type, content){
		var el = document.createElement(type);
		if(typeof content == 'string'){
			el.innerHTML = content;
		}else if(content instanceof Element){
			el.appendChild(content);
		}
		return el;
	};

	ox.ajax = function (path, callback) {
		//TODO
		callback();
	};

	ox.loadImage = function (src, callback) {
		var img = new Image();
		img.crossOrigin = "anonymous";
		if (callback) {
			img.addEventListener('load', function () {
				callback(img);
			});
		}
		img.src = src;
		return img;
	};

	ox.wait =	function(evaluate, func, time) {
		var time = time || 1000;
		var interval = setInterval(function () {
			if (evaluate()) {
				clearInterval(interval);
				func();
			}
		}, time);
	};

	ox.Events = require("Events");
	ox.FrameImpulse = require("FrameImpulse");

	return ox;

});
