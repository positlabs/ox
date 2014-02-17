define(function (require) {

	/**

	 ox is an element wrapper.

	 */

	function ox(selector) {
		var element = document.querySelector(selector);
		oxWrap(element);
		return element;
	}
	function oxWrap(element){
		if (element.ox == undefined)new OxElement(element);
	}

	// private constructor
	function OxElement(element) {
		this.element = element;
		this.element.ox = this;

		new ox.DOMEvents(this.element);
		this.on = element.on;
		this.once = element.once;
		this.off = element.off;
		this.trigger = element.trigger;

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
		}

	};

	ox.select = function (selector) {
		var el = document.querySelector(selector);
		oxWrap(el);
		return el;
	};
	ox.selectAll = function (selector, parent) {
		parent = parent || document;
		var els = parent.querySelectorAll(selector);
		for (var i = 0, maxi = els.length; i < maxi; i++) {
			var el = els[i];
			oxWrap(el);
		}
		return els;
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

	ox.Events = require("Events");
	ox.FrameImpulse = require("FrameImpulse");


	return ox;

});
