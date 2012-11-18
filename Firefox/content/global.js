var EXPORTED_SYMBOLS = ["l10n"];

Components.utils.import("resource://gre/modules/Services.jsm");

// Components.utils.import("chrome://DeviantLove/content/StringBundle.js");
// Random parameter is Wladimir Palant's idea
// https://bugzilla.mozilla.org/show_bug.cgi?id=719376
// var l10n = new StringBundle("chrome://example/locale/strings.properties?" + Math.random());
// Until I can get Mozilla Labs's StringBundle module, here is temporary code:
var stringBundle = Services.strings.createBundle("chrome://DeviantLove/locale/messages.properties" +
	"?" + Math.random());
var l10n = {
	getString: stringBundle.GetStringFromName.bind(stringBundle),
	getFormattedString: function(id, subs) {
		return stringBundle.formatStringFromName(id, subs, subs.length);
	}
};