/** @type {import("svelte/action").Action} */
export function makeNavRoot(root) {
	root.querySelector("[tabindex]")?.setAttribute("tabindex", 0);
	root.addEventListener("focusin", (event) => {
		if (event.target.tabIndex == 0) { return; }
		root.querySelector(`[tabindex="0"]`)?.setAttribute("tabindex", -1);
		event.target.tabIndex = 0;
	});
	function navigateTo(elem) {
		// TODO: Scroll if needed
		elem.focus({focusVisible: true});
	}
	root.addEventListener("keydown", (event) => {
		let {key, target} = event;
		if (key == "ArrowDown") {
			event.preventDefault();
			let destination;
			while (!destination) {
				let nextElement = target.nextElementSibling;
				if (!nextElement) {
					target = target.parentElement;
					if (target == root) { return; }
					continue;
				}
				target = nextElement;
				if (target.matches(`[tabindex]`)) {
					destination = target;
				} else {
					destination = target.querySelector(`[tabindex]`);
				}
			}
			if (destination) { navigateTo(destination); }
			return;
		}
		if (key == "ArrowUp") {
			event.preventDefault();
			let destination;
			while (!destination) {
				let prevElement = target.previousElementSibling;
				if (!prevElement) {
					target = target.parentElement;
					if (target == root) { return; }
					continue;
				}
				target = prevElement;
				if (target.matches(`[tabindex]`)) {
					destination = target;
				} else {
					let candidates = target.querySelectorAll(`[tabindex]`);
					destination = candidates[candidates.length - 1];
				}
			}
			if (destination) { navigateTo(destination); }
			return;
		}
	});

	// Detect if the current nav target is removed
	let observer = new MutationObserver( (mutations) => {
		if (root.querySelector(`[tabindex="0"]`)) { return; }
		// TODO: Find out where [tabindex="0"] was removed from and choose a suitable replacement
		root.querySelector("[tabindex]")?.setAttribute("tabindex", 0);
	});
	observer.observe(root, {childList: true, subtree: true});
}
/** @type {import("svelte/action").Action} */
export function target(elem, {activate} = {}) {
	elem.tabIndex = -1;
	if (activate) {
		elem.addEventListener("click", () => activate("pointer"));
		elem.addEventListener("keydown", (event) => {
			if (event.key == "Enter" || event.key == " ") {
				activate("keyboard");
				event.preventDefault();
			}
		});
	}
}