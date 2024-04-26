/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
export default async function(name) {
	var apiToken;
	var results = {};
	try {
		let tokenFetch = await fetch( "https://www.deviantart.com/oauth2/token?" + new URLSearchParams({
			grant_type: "client_credentials",
			client_id: "7926",
			client_secret: "7e9e2374a223c479f70e1bf18874f8c3",
		}) );
		({access_token: apiToken} = await tokenFetch.json());
		let profileFetch = await fetch(
			`https://www.deviantart.com/api/v1/oauth2/user/profile/${name}?${ new URLSearchParams({
				access_token: apiToken,
			}) }`
		);
		if (!profileFetch.ok) {
			if (profileFetch.status == 400) {
				throw "NotFound";
			} else {
				throw "Communication";
			}
		}
		let { username, usericon } = ( await profileFetch.json() ).user;
		return { name: username, avatar: usericon };
	} catch (error) {
		if (typeof error != "string") {
			throw "Communication";
		} else {
			throw error;
		}
	}
}