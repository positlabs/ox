ox = (function() {
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

define('Simplizr',['require'],function (require) {

	var s;
	var Simplizr = s = {}, classes = [];

	var check = function (feature, test) {
		var result = test();
		s[feature] = (result) ? true : false;
		classes.push((result) ? feature : "no-" + feature);
	};

	s.pixelRatio = window.devicePixelRatio || 1;

	var prefix = (function () {
		var styles, pre, dom;
		//wrapped into a try catch because IE8 doesn't support getComputedStyle and that regex match returns null in IE8
		try {
			styles = window.getComputedStyle(document.documentElement, '');
			pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
			dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
		} catch (e) {
			//assume IE8
			styles = '';
			pre = 'ms';
			dom = 'MS';
		}


		return {
			dom: dom,
			lowercase: pre,
			css: '-' + pre + '-',
			js: pre[0].toUpperCase() + pre.substr(1)
		};
	})();

	s["prefix"] = prefix;
	classes.push(prefix.lowercase);

	/**
	 *    Note on detecting some CSS features:
	 *
	 *    After reading this (https://github.com/zamiang/detect-css3-3d-transform)
	 *    I realized detecting css3d transforms is unreliable. But also - we don't really need it
	 *    because typically the only browser we need to support that doesn't do css 3d transforms
	 *    is IE9 and IE8 so why not do some good old browser sniffing. Then, I found the snippet below.
	 *
	 *    (as a reminder: IE9 - only 2d transforms, no transrion, no animarions, IE8 - not even 2d)
	 */

	var ie = (function () {
		var v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');
		while (
				div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
						all[0]
				);
		return v > 4 ? v : null;
	})();


	s["ie"] = ie ? ie : false;
	classes.push((ie) ? "ie-" + ie : "no-ie");

	// Now add some css features that might be useful
	check("css3d", function () {
//		return !ie || ie >= 10;
		var div = document.createElement("div");
		div.style[this.prefix + "Transform"] = '';
		div.style[this.prefix + "Transform"] = 'rotateY(90deg)';
		return div.style[this.prefix + "Transform"] !== '' && (!ie || ie >= 10);
	});
	check("csstransitions", function () {
		return !ie || ie >= 10;
	});
	check("cssanimations", function () {
		return !ie || ie >= 10;
	});
	check("css2d", function () {
		return !ie || ie >= 9;
	});

	check("touch", function () {
		return 'ontouchstart' in document;
	});

	check("pointer", function () {
		return (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 1);
	});

	check("webrct", function () {
		return ('getUserMedia' in navigator || 'webkitGetUserMedia' in navigator);
	});

	check("canvas", function () {
		try {
			var canvas = document.createElement('canvas');
			return canvas.getContext('2d');
		} catch (e) {
			return false;
		}
	});

	check("ios", function() {
		if (/iP(hone|od|ad)/.test(navigator.platform)) {
			var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
			return "" + parseInt(v[1], 10)+ parseInt(v[2], 10) + parseInt(v[3] || 0, 10);
		}else return false;
	});

	check("history", function () {
		return !!(window.history && history.pushState);
	});

	// has to be a function because document.body isn't guaranteed to exist at init-time.
	// this is needed for ext.scroll
	s.boxModel = function () {
		var div = document.createElement("div");
		div.style.width = div.style.paddingLeft = "1px";
		document.body.appendChild(div);
		var supported = div.offsetWidth === 2;
		document.body.removeChild(div).style.display = 'none';
		s.boxModel = function () {
			return supported
		};
		return supported;
	};

	document.documentElement.setAttribute("class", classes.join(" "));

	return Simplizr;

});

define('Transform',['require','Simplizr'],function (require) {

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






define('DOMEvents',['require'],function (require) {

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
define('Events',['require','DOMEvents'],function (require) {

	var DOMEvents = require('DOMEvents');
	var Events = function (obj) {

		if(obj instanceof Element)return new DOMEvents(obj);
		var events = obj || {};
		var listeners = {};

		events.on = function (event, callback) {

			if (!listeners[event]) listeners[event] = [];
			// add to the beginning of the array so they'll be in order when we do a reverse while loop to process them
			listeners[event].unshift(callback);

			return callback;
		};

		events.once = function(event, callback){
			events.on(event, function(data){
				events.off(event, callback);
				callback(data);
			});
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
		};

		return events;

	};

	return Events;

});
define('Model',['require','Events'],function (require) {

	var Events = require('Events');

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

define('ReqAnimFrame',['require'],function (require) {
	

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

	return window.requestAnimationFrame;

});
define('FrameImpulse',['require','ReqAnimFrame','Events'],function (require) {

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
define('ox',['require','Transform','Model','Events','FrameImpulse'],function (require) {

	var Transform = require('Transform');

	/**

	 ox is an element wrapper.

	 */

	function ox(selector) {
		var element = document.querySelector(selector);
		if(element == null){
			throw new Error('query found no node: ' + selector);
			return;
		}
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

		new Transform(this, this.element);
		new ox.Events(this.element);

		this.on = element.on;
		this.once = element.once;
		this.off = element.off;
		this.trigger = element.trigger;
		element.transform = this.transform;

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
			if (value == undefined){
				return this.element.getAttribute(name);	
			}else{
				this.element.setAttribute(name, value);
			}
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
		oxWrap(el);
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

	ox.Model = require('Model');
	ox.Events = require("Events");
	ox.FrameImpulse = require("FrameImpulse");

	return ox;

});

	return require('ox');
}());