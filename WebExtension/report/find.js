/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.esm.js for the complete legal stuff.
*/
importScripts("deviantCollection.js");
var deviants, savedQuery;
onmessage = ({ data: {deviantsMap, subaccounts, query} }) => {
	if (deviantsMap) {
		deviants = new DeviantCollection(deviantsMap);
	}
	if (subaccounts) {
		deviants.setSubaccounts(subaccounts);
	}
	if (query !== undefined) {
		savedQuery = query;
	}
	if (savedQuery) {
		postMessage(findStuff(savedQuery));
	}
}
function findStuff(queryText) {
	var queryChunks = queryText.split("&");
	queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
	var checkDeviants = queryChunks.every( function(chunk) {
		return !(/[^a-zA-Z0-9\-]/).test(chunk);
	} );

	var deviantMatches = [];
	var matchedBySubaccount = {};
	var deviationMatches = [];
	var deviationTotal = 0;
	for (let deviant of deviants.list) {
		let {name} = deviant;
		if (checkDeviants && isMatch(name)) {
			deviantMatches.push(name);
		} else if (checkDeviants && name in deviants.subaccounts) {
			deviants.subaccounts[name].some( function(subaccountName) {
				if (isMatch(subaccountName)) {
					deviantMatches.push(name);
					matchedBySubaccount[name] = subaccountName;
					return true;
				}
			} );
		}
		let deviantDeviationMatches = [];
		for (let deviation of deviant.deviations) {
			if (isMatch(deviation.name)) {
				++deviationTotal;
				deviantDeviationMatches.push(deviation);
			}
		}
		if (deviantDeviationMatches.length > 0) {
			deviationMatches.push({"deviant": name, "deviations": deviantDeviationMatches});
		}
	}
	function isMatch(needle) {
		needle = needle.toLowerCase();
		return queryChunks.every( function(chunk) {
			return needle.indexOf(chunk) != -1;
		} );
	}
	return { for: queryText,
		deviants: deviantMatches, matchedBySubaccount,
		deviations: deviationMatches, deviationTotal};
}