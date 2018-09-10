/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
export default async function(name) {
	var results = {};
	try {
		let response = await fetch(`https://www.deviantart.com/${name}/`);
		if (!response.ok) {
			if (response.status == 404) {
				throw "NotFound";
			} else {
				throw "Communication";
			}
		}
		var profileHtml = await response.text();
	} catch (error) {
		if (typeof error != "string") {
			throw "Communication";
		} else {
			throw error;
		}
	}
	var profileDoc = (new DOMParser()).parseFromString(profileHtml, "text/html");
	var nameElem = profileDoc.getElementById("gmi-Gruser");
	if (nameElem) {
		results.name = nameElem.getAttribute("gmi-name");
	}
	var avatarElem = profileDoc.querySelector("link[rel='image_src']");
	if (avatarElem) {
		results.avatar = avatarElem.getAttribute("href");
	}
	return results;
}