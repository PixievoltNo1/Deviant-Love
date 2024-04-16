// Run using npm run makeRelease in the repo root
import archiver from "archiver";
import fs from "fs";
import path from "path";

var webextDir = path.resolve(process.cwd(), "WebExtension");
var crManifest = JSON.parse( fs.readFileSync("WebExtension/manifest.chrome.json") );
var {version} = crManifest;
var isPreview = false;
var [, ...previewVersionParts] = version.match( /(.*)\.(9{2,4})\.(.*)/ ) || [];
if (previewVersionParts.length) {
	isPreview = true;
	let finalVersionParts = previewVersionParts[0].split(".");
	finalVersionParts.push( parseInt(finalVersionParts.pop()) + 1 );
	if (finalVersionParts.length == 1) {
		finalVersionParts.push(0);
	}
	let finalVersion = finalVersionParts.join(".");
	let tag = ["a", "b", "rc"][ previewVersionParts[1].length - 2 ];
	version = `${ finalVersion }${ tag }${ previewVersionParts[2] }`;
}

function makeZip(filename, callback) {
	console.log("Making", filename);
	let archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe( fs.createWriteStream(filename) );
	callback(archive);
	archive.finalize();
}

if (!isPreview) {
	makeZip(`Deviant Love for Chrome v${version}.zip`,
		(archive) => archive.glob("**", {cwd: "build-chrome"}) );
	makeZip(`Deviant Love for Firefox v${version}.zip`,
		(archive) => archive.glob("**", {cwd: "build-firefox"}) );
} else {
	makeZip(`Deviant Love for Chrome v${version}.zip`, (archive) => {
		crManifest.name += " Preview";
		crManifest.version_name = version;
		let overridden = fs.readdirSync("Release/Chrome Preview Heart")
			.map( (icon) => { return "images/heart/" + icon; } )
		archive.glob("**", {ignore: ["manifest.json", ...overridden], cwd: "build-chrome"});
		archive.append(JSON.stringify(crManifest), {name: "manifest.json"});
		archive.directory("Release/Chrome Preview Heart", "images/heart");
	});
	makeZip(`Deviant Love for Firefox v${version}.zip`, (archive) => {
		let fxManifest = JSON.parse( fs.readFileSync("WebExtension/manifest.firefox.json") );
		fxManifest.version = previewVersion;
		fxManifest.applications.gecko.update_url = "https://pixievoltno1.com/deviantlove/updates.json";
		archive.glob("**", {ignore: ["manifest.json"], cwd: "build-firefox"});
		archive.append(JSON.stringify(fxManifest), {name: "manifest.json"});
	});
}
makeZip(`Source for AMO v${version}.zip`, (archive) => {
	archive.glob("WebExtension/**")
		.glob("Release/**", {ignore: ["Release/node_modules/**"]})
		.file("package.json")
		.file("package-lock.json")
		.file("rollup.config.mjs")
		.file("Release/Readme for AMO.txt", {name: "README.txt"});
});