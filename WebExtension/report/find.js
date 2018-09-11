/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
function findStuff(queryText, deviants) {
	if (queryTroubleCheck(queryText) != false) { return };
	var queryChunks = queryText.split("&");

	queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
	var checkDeviants = queryChunks.every( function(chunk) {
		return !(/[^a-zA-Z0-9\-]/).test(chunk);
	} );

	var deviantMatches = [];
	var matchedBySubaccount = {};
	var deviationMatches = [];
	var deviationTotal = 0;
	deviants.list.forEach( function(deviant) {
		if (checkDeviants && isMatch(deviant.name)) {
			deviantMatches.push(deviant);
		} else if (checkDeviants && deviant.name in deviants.subaccounts) {
			deviants.subaccounts[deviant.name].some( function(subaccountName) {
				if (isMatch(subaccountName)) {
					deviantMatches.push(deviant);
					matchedBySubaccount[deviant.name] = subaccountName;
					return true;
				}
			} );
		}
		var deviantDeviationMatches = [];
		deviant.deviations.forEach( function(deviation) {
			if (isMatch(deviation.name)) {
				++deviationTotal;
				deviantDeviationMatches.push(deviation);
			}
		} );
		if (deviantDeviationMatches.length > 0) {
			deviationMatches.push({"deviant": deviant, "deviations": deviantDeviationMatches});
		}
	} );
	function isMatch(needle) {
		needle = needle.toLowerCase();
		return queryChunks.every( function(chunk) {
			return needle.indexOf(chunk) != -1;
		} );
	}
	return {deviants: deviantMatches, matchedBySubaccount,
		deviations: deviationMatches, deviationTotal};
}
function queryTroubleCheck(query) {
	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-\!\=\~\`\@\#\%\^\*\[\]\(\)\/\{\}\\\|\&]/);
	if (invalidChar != -1) {
		return {errMsg: "findErrorForbiddenCharacter", parts: [query.charAt(invalidChar)]};
	}

	return false;
}