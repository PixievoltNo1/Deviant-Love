/* Source: https://gist.github.com/cfinke/959868 */

var MY_EXTENSION_STRINGS = {
	"strings" : {},

	get : function (key, substitutions) {
		if (key in this.strings) {
			var bundle = this.strings[key];

			var message = this.strings[key].message;

			if ("placeholders" in bundle) {
				for (var i in bundle.placeholders) {
					var regex = new RegExp("\\$" + i + "\\$", "g");
					message = message.replace(regex, bundle.placeholders[i].content);
				}
			}

			if (typeof substitutions != 'undefined') {
				if (typeof substitutions != 'object') {
					substitutions = [ substitutions ];
				}
			}

			if (substitutions) {
				for (var i = 0, _len = substitutions.length; i < _len; i++) {
					var regex = new RegExp("\\$" + (i+1), "g");
					message = message.replace(regex, substitutions[i]);
				}
			}

			return message;
		}

		return "";
	}
};

(function (extension_namespace, string_object) {
	var localeOrder = ["en-US"];

	// Get the user's Firefox locale.
	var chromeRegService = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService();
	var xulChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIXULChromeRegistry);
	
	// The "official" locale, especially on Linux.
	var browserLocale = xulChromeReg.getSelectedLocale("global");

	if (browserLocale != localeOrder[0]) {
		localeOrder.push(browserLocale);
	}

	// The user-specified locale from prefs.
	var userLocale = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("general.useragent.").getCharPref("locale");

	if (userLocale != localeOrder[localeOrder.length - 1]) {
		localeOrder.push(userLocale);
	}

	var finalLocaleOrder = [];

	// Convert the locale codes to Chrome style.
	for (var i = 0, _len = localeOrder.length; i < _len; i++) {
		var localeParts = localeOrder[i].split("-");
		localeParts[0] = localeParts[0].toLowerCase();

		if (localeParts.length > 1) {
			localeParts[1] = localeParts[1].toUpperCase();

			// e.g., If the locale code is pt_BR, use pt as a backup.
			if (finalLocaleOrder.length == 0 || finalLocaleOrder[finalLocaleOrder.length - 1] != localeParts[0]) {
				finalLocaleOrder.push(localeParts[0]);
			}
		}

		var locale = localeParts.join("_");

		if (finalLocaleOrder.length == 0 || finalLocaleOrder[finalLocaleOrder.length - 1] != locale) {
			finalLocaleOrder.push(locale);
		}
	}

	function readNextLocale() {
		if (finalLocaleOrder.length > 0) {
			var locale = finalLocaleOrder.shift();

			var req = new XMLHttpRequest();
			req.open("GET", "chrome://" + extension_namespace + "/content/_locales/" + locale + "/messages.json", true);
			req.overrideMimeType("text/plain;charset=UTF-8");

			req.onload = function () {
				var messagesText = req.responseText;

				try {
					var messages = JSON.parse(messagesText);
				} catch (e) {
					// Invalid JSON.
					var messages = {};
				}

				for (var i in messages) {
					string_object[i] = messages[i];
				}

				readNextLocale();
			};

			req.onerror = function () {
				readNextLocale();
			};

			try {
				req.send(null);
			} catch (e) {
				// Most likely the file doesn't exist.
				readNextLocale();
			}
		}
		else {
			// At this point, you can run any localization functions now that
			// all of the locale files have been read.
		}
	}

	readNextLocale();
})(MY_EXTENSION_NAMESPACE, MY_EXTENSION_STRINGS.strings);