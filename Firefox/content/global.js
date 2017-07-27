/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
var EXPORTED_SYMBOLS = ["browserMod", "loaded", "webExt", "l10n", "prefs"];

var browserMod = Symbol(), loaded = Symbol();
var webExt = {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.importGlobalProperties(["XMLHttpRequest"]);
var scope = {
	MY_EXTENSION_NAMESPACE: "DeviantLoveWebExt",
	XMLHttpRequest
};
Services.scriptloader.loadSubScriptWithOptions("chrome://DeviantLove/content/messagesJsonReader.js", {
	target: scope,
	charset: "UTF-8",
	ignoreCache: true
});
var l10n = scope.MY_EXTENSION_STRINGS;

Components.utils.import("resource://gre/modules/Preferences.jsm");
var prefs = new Preferences("extensions.deviantlove.");