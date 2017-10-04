function findStuff(queryText, deviants) {
	if (queryTroubleCheck(queryText) != false) { return };
	var queryChunks = queryText.split("&");

	queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
	var checkDeviants = queryChunks.every( function(chunk) {
		return !(/[^a-zA-Z0-9\-]/).test(chunk);
	} );

	var deviantMatches = [];
	var deviantMatchingSubaccount = {};
	var deviationMatches = [];
	deviants.list.forEach( function(deviant) {
		if (checkDeviants && isMatch(deviant.name)) {
			deviantMatches.push(deviant);
		} else if (checkDeviants && deviant.name in deviants.subaccounts) {
			deviants.subaccounts[deviant.name].some( function(subaccountName) {
				if (isMatch(subaccountName)) {
					deviantMatches.push(deviant);
					deviantMatchingSubaccount[deviant.name] = subaccountName;
					return true;
				}
			} );
		}
		var deviantDeviationMatches = [];
		deviant.deviations.forEach( function(deviation) {
			if (isMatch(deviation.name)) {
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
	return {deviantMatches, deviantMatchingSubaccount, deviationMatches};
}
function queryTroubleCheck(query) {
	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-\!\=\~\`\@\#\%\^\*\[\]\(\)\/\{\}\\\|\&]/);
	if (invalidChar != -1) {
		return {errMsg: "findErrorForbiddenCharacter", offender: query.charAt(invalidChar)};
	}

	return false;
}