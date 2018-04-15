var strings = [];
export function cacheMessages(...msgs) {
	strings.push(...msgs);
}
export function setUpStoreL10nCache(store) {
	store.compute("l10nCache", ["l10n"], (l10n) => {
		var cache = {};
		for (let string of strings) {
			cache[string] = l10n(string);
		}
		return cache;
	});
}