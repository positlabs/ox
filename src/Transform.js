define(function (require) {

	var Simplizr = require('Simplizr');

	var Transform = function (ext, element) {

		ext.rect = function () {
			return element.getBoundingClientRect();
		};

		ext.width = function (v) {
			if (v) element.style.width = v + "px";
			return ext.rect().width;
		};

		ext.height = function (v) {
			if (v) element.style.height = v + "px";
			return ext.rect().height;
		};

		// faster (+cross-browser) method of getting scroll position.
		// ext.scroll.top() is 32% faster than ext.rect().top
		// alternatively, we could just use ext.rect().top
		ext.scroll = {
			top: function () {
				return getScroll("Top");
			},
			left: function () {
				return getScroll("Left");
			}
		};

		function getScroll(method) {
			method = 'scroll' + method;
			var rtn = (element == window || element == document) ? (
					self[(method == 'scrollTop') ? 'pageYOffset' : 'pageXOffset'] ||
							(Simplizr.boxModel() && document.documentElement[method]) ||
							document.body[method]
					) : element[method];
			return rtn;
		}

		ext.x = 0;
		ext.y = 0;
		ext.z = 0;
		ext.rotX = 0;
		ext.rotY = 0;
		ext.rotZ = 0;
		ext.scaleX = 1;
		ext.scaleY = 1;
		ext.scaleZ = 1;

		ext.transformToString = function (values, force2d) {
			values = values || ext;

			var t = "";

			if (values.x !== undefined) t += "translateX(" + values.x + "px)";
			if (values.y !== undefined) t += "translateY(" + values.y + "px)";
			if ((values.z !== undefined) && Simplizr.css3d && !force2d) t += "translateZ(" + values.z + "px)";

			if (values.rotX && Simplizr.css3d && !force2d) t += "rotateX(" + values.rotX + "deg)";
			if (values.rotY && Simplizr.css3d && !force2d) t += "rotateY(" + values.rotY + "deg)";
			if (values.rotZ && Simplizr.css3d && !force2d) t += "rotateZ(" + values.rotZ + "deg)";
			else if (values.rotZ) t += "rotate(" + values.rotZ + "deg)";

			if (values.scaleX != 1) t += "scaleX(" + values.scaleX + ")";
			if (values.scaleY != 1) t += "scaleY(" + values.scaleY + ")";
			if (values.scaleZ != 1 && Simplizr.css3d && !force2d) t += "scaleZ(" + values.scaleZ + ")";

			return t;
		};

		ext.transform = function (values, force2d) {
			if (values) {
				for (var i in values) {
					ext[i] = values[i];
				}
			}

			var t = ext.transformToString(ext, force2d);
			//needs to be ms or -ms- for IE, but Simplrz.prefix.js returns Ms
			var prefix = (Simplizr.prefix.js == "Ms") ? Simplizr.prefix.lowercase : Simplizr.prefix.js;
			element.style[prefix + "Transform"] = t;
			// element.style["transform"] = t;
		};

		var anim;

		// Used to set frame based animation, created with ../Animation.js
		ext.setAnimation = function (anm, delay) {
			if (anim) anim.cancel();

			anim = anm.applyTo(ext).onUpdate(function (v) {
				ext.transform();
			}).onEnd(function () {
						anim = null;
					}).start(delay);

			return anim;
		}
	};

	return Transform;

});





