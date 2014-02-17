define(function (require) {

	/**

	 ox is an element wrapper.

	 */

	function ox(selector) {
		var element = document.querySelector(selector);
		if (element.ox == undefined)new OxElement(selector);
		return element;
	}

	// private constructor
	function OxElement(selector) {
		this.element = document.querySelector(selector);
		this.element.ox = this;

		// convenience accessors
		this.style = this.element.style;
		this.classList = this.element.classList;
	}

	OxElement.prototype = {
		select: function (selector) {
			return ox.select(selector);
		},
		selectAll: function (selector) {
			return ox.selectAll(selector, this);
		},
		css: function (arg1, arg2) {
			if (typeof arg1 == "string") {
				this.style[arg1] = arg2;
			} else {
				// object
				for (var key in arg1) {
					this.style[key] = arg1[key];
				}
			}
		},
		attr: function (name, value) {
			this.setAttribute(name, value);
			if (value == undefined) return this.getAttribute(name);
		},
		prepend: function (element) {
			this.element.insertBefore(element, this.element.childNodes[0]);
		},
		append: function (element) {
			this.element.appendChild(element);
		},
		remove: function () {
			this.parentNode.removeChild(this.element);
		},

		// maybe use ox.Events for this. Need to modify to handle DOM events
		on: function () {
		},
		off: function () {
		},
		trigger: function () {
		}
	};


	ox.select = function (selector) {
		var el = document.querySelector(selector);
		if (el.ox == undefined) new OxElement(el);
		return el;
	};
	ox.selectAll = function (selector, parent) {
		parent = parent || document;
		var els = parent.querySelectorAll(selector);
		for (var i = 0, maxi = els.length; i < maxi; i++) {
			var el = els[i];
			if (el.ox == undefined) new OxElement(el);
		}
		return els;
	};
	ox.create = function(type, content){
		var el = document.createElement(type);
		if(typeof content == 'string'){
			el.innerHTML = content;
		}else{
			el.appendChild(content);
		}
		return el;
	};
	ox.Events = require("Events");
	ox.FrameImpulse = require("FrameImpulse");
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

	return ox;

});
