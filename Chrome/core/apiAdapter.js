var apiAdapter = {
	getL10nMsg: function(msgName, replacements) {
		return chrome.i18n.getMessage(msgName, replacements);
	},
	getL10nFile: function(filename) {
		return chrome.i18n.getMessage("l10nFolder") + filename;
	},
	retrieve: function(keys) {
		var request = new $.Deferred();
		chrome.storage.local.get(keys, function(data) {
			for (var key in data) {
				var item = data[key];
				if (typeof item == "string") {
					data[key] = JSON.parse(item);
				}
			}
			request.resolve(data);
		});
		return request.promise();
	},
	store: function(key, data) {
		if (typeof data != "number" && typeof data != "boolean") {
			data = JSON.stringify(data);
		}
		var item = {};
		item[key] = data;
		chrome.storage.local.set(item);
	}
};