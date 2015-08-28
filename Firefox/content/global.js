/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
var EXPORTED_SYMBOLS = ["browserMod", "loaded", "l10n", "prefs", "aaaaa"];

var aaaaa = true;
var browserMod = Symbol(), loaded = Symbol();

Components.utils.import("resource://gre/modules/Services.jsm");

Components.utils.import("resource://services-common/stringbundle.js");
// Random parameter is Wladimir Palant's idea
// https://bugzilla.mozilla.org/show_bug.cgi?id=719376
var l10n = new StringBundle("chrome://DeviantLove/locale/messages.properties?" + Math.random());

Components.utils.import("resource://gre/modules/Preferences.jsm");
var prefs = new Preferences("extensions.deviantlove.");