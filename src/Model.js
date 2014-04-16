define(function (require) {

	var Events = require('Events');

	//TODO: make this into a behavior, not a class.

	function Model(attributes) {
		new Events(this);
		if (attributes) {
			this.attributes = extend({}, attributes);
		} else {
			this.attributes = {};
		}
	}

	Model.prototype.set = function (attr, val) {
		this.attributes[attr] = val;
		this.trigger('change', {attr: attr, value: val});
		this.trigger('change:' + attr, val);
	};

	Model.prototype.get = function (attr) {
		return this.attributes[attr];
	};

	function extend(dest, source) {
		for (var k in source) {
			if (source.hasOwnProperty(k)) {
				var value = source[k];
				if (dest.hasOwnProperty(k) && typeof dest[k] === "object" && typeof value === "object") {
					extend(dest[k], value);
				} else {
					dest[k] = value;
				}
			}
		}
		return dest;
	}

	return Model;

});
