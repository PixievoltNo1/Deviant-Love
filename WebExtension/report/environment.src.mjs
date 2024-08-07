/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
import { start, showDetectError } from "./core.src.mjs";
import { createNanoEvents } from "nanoevents";
import { writable } from "svelte/store";

export var events = createNanoEvents();
export var visible = writable(true);
export var mobile = writable(false);
chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "getStartData"},
	async function({love, mobile: mobileVal}) {
		mobile.set(mobileVal);
		if (love.error) {
			await showDetectError(love.error);
		} else {
			await start({love});
		}
		chrome.runtime.sendMessage({action: "echo", echoAction: "panelReady"});
	}
);
history.pushState(true, "");
var historyVisibleState = true;
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "showing":
		var waitFor = [];
		var delay = (waitForThis) => { waitFor.push(waitForThis); };
		visible.set(true);
		events.emit("show", delay);
		Promise.all(waitFor).then(() => {
			callback();
		});
		if (history.state == null) {
			history.pushState(true, "");
		}
		historyVisibleState = true;
		return true;
	break;
	case "hiding":
		visible.set(false);
		events.emit("hide");
		if (history.state != null) {
			history.back();
		}
		historyVisibleState = false;
	break;
	case "artistRequested":
		events.emit("artistRequested", thing.artist);
	break;
	case "setMobile":
		mobile.set(thing.mobile);
	break;
}});
export function closeDeviantLove() {
	chrome.runtime.sendMessage({action: "echo", echoAction: "spark"});
}

export function needsDelegatedScan() {
	// If we don't have full extension privileges, we may not be able to scan with the correct
	// partitioned cookies.
	return !("tabs" in chrome);
}
export function delegateScan(_, _2, callbacks) {
	let resolve, promise = new Promise( (res) => resolve = res );
	window.addEventListener("message", (event) => {
		if (event.data != "scan") { return; }
		let port = event.ports[0];
		port.onmessage = ({data: [eventName, data]}) => callbacks[eventName](data);
		resolve({
			cleanup() { port.close(); },
			scannerController: new Proxy({}, { get(_, commandName) {
				return () => port.postMessage(commandName);
			} }),
		})
	});
	chrome.runtime.sendMessage({action: "echo", echoAction: "scanForMe"});
	return promise;
}

document.addEventListener("click", (event) => {
	var link = event.target.closest("a");
	if (!link) { return; }
	window.open(link.href);
	event.preventDefault();
});
window.addEventListener("popstate", () => {
	if ( (history.state != null) != historyVisibleState ) {
		chrome.runtime.sendMessage({ action: "echo", echoAction: "spark" });
	}
});