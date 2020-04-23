// Run using npm run makeRelease in the repo root
var archiver = require("archiver");
var fs = require("fs");
var path = require("path");
var spawn = require("cross-spawn");
var {spawnSync} = require("child_process");

spawnSync("webpack", ["--env.release"], {stdio: "inherit", shell: true});
console.log();

var globalIgnore = ["**/*.map", "**/*.esm.js", "**/svelte/**"];
var webextDir = path.resolve(process.cwd(), "WebExtension");
var manifest = JSON.parse( fs.readFileSync("WebExtension/manifest.json") );
var previewVersion = false;
var [, ...previewVersionParts] = manifest.version.match( /(.*)\.(9{2,4})\.(.*)/ ) || [];
if (previewVersionParts.length) {
	let finalVersionParts = previewVersionParts[0].split(".");
	finalVersionParts.push( parseInt(finalVersionParts.pop()) + 1 );
	if (finalVersionParts.length == 1) {
		finalVersionParts.push(0);
	}
	let finalVersion = finalVersionParts.join(".");
	let tag = ["a", "b", "rc"][ previewVersionParts[1].length - 2 ];
	previewVersion = `${ finalVersion }${ tag }${ previewVersionParts[2] }`;
}
console.log("Making release files for version", previewVersion || manifest.version);

if (!previewVersion) {
	console.log("Making Deviant Love.zip");
	let archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe( fs.createWriteStream("Deviant Love.zip") );
	archive.glob("**", {ignore: globalIgnore, cwd: webextDir});
	archive.finalize();
} else {
	// For Chrome
	console.log("Making Deviant Love Preview.zip");
	let archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe( fs.createWriteStream("Deviant Love Preview.zip") );
	let crManifest = Object.assign({}, manifest);
	crManifest.name += " Preview";
	let overridden = fs.readdirSync("Release/Chrome Preview Heart")
		.map( (icon) => { return "images/heart/" + icon; } )
	archive.glob("**", {ignore: [...globalIgnore, "manifest.json", ...overridden], cwd: webextDir})
		.append(JSON.stringify(crManifest), {name: "manifest.json"})
		.directory("Release/Chrome Preview Heart", "images/heart");
	archive.finalize();

	// For Firefox
	let filename = previewVersion + ".xpi";
	console.log("Making", filename);
	archive = archiver('zip', { zlib: { level: 9 } });
	archive.pipe( fs.createWriteStream(filename) );
	let fxManifest = Object.assign({}, manifest);
	fxManifest.version = previewVersion;
	fxManifest.applications.gecko.update_url = "https://pixievoltno1.com/deviantlove/updates.json";
	archive.glob("**", {ignore: [...globalIgnore, "manifest.json"], cwd: webextDir})
		.append(JSON.stringify(fxManifest), {name: "manifest.json"});
	archive.finalize();
}
// Create source zip for AMO
console.log("Making Source for AMO.zip");
let archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe( fs.createWriteStream("Source for AMO.zip") );
archive.glob("WebExtension/**", {ignore: ["WebExtension/build/**"]})
	.glob("Release/**", {ignore: ["Release/node_modules/**"]})
	.file("package.json")
	.file("package-lock.json")
	.file("webpack.config.js")
	.file("Release/Readme for AMO.txt", {name: "README.txt"});
archive.finalize();