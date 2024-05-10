/** @type {import("svelte/action").Action} */
export function makeNavRoot(root) {
	root.querySelector("[tabindex]")?.setAttribute("tabindex", 0);
	root.tabIndex = -1;
	root.addEventListener("focusin", (event) => {
		if (event.target.tabIndex == 0) { return; }
		if (event.target == root) {
			root.querySelector(`[tabindex="0"]`)?.focus({preventScroll: true})
			return;
		}
		root.querySelector(`[tabindex="0"]`)?.setAttribute("tabindex", -1);
		event.target.tabIndex = 0;
	});
	root.addEventListener("keydown", function(event) {
		if (["ArrowDown", "ArrowUp", " ", "Home", "End"].includes(event.key)) {
			event.preventDefault();
		}
	}, {capture: true});
	root.addEventListener("keydown", function verticalNav(event) {
		let {key, target} = event;
		if (key == "ArrowDown") {
			arrowNav("nextElementSibling", (elem) => elem.querySelector(`[tabindex]`));
		} else if (key == "ArrowUp") {
			arrowNav("previousElementSibling", (elem) => {
				let candidates = elem.querySelectorAll(`[tabindex]`);
				return candidates[candidates.length - 1];
			});
		} else if (key == "Home") {
			root.scrollTo({top: 0});
			let elem = Array.prototype.find.call(root.querySelectorAll("[tabindex]"),
				(elem) => !findSkippableParent(elem));
			elem?.focus({focusVisible: true, preventScroll: true});
		} else if (key == "End") {
			root.scrollTo({top: root.scrollHeight});
			let elem = Array.prototype.findLast.call(root.querySelectorAll("[tabindex]"),
				(elem) => !findSkippableParent(elem));
			elem?.focus({focusVisible: true, preventScroll: true});
		}
		/** @type {(siblingProp: string, findDestination: (elem: Element) => Element | null) => null} */
		function arrowNav(siblingProp, findDestination) {
			let destination;
			while (!destination) {
				let nextElement = target[siblingProp];
				if (!nextElement) {
					target = target.parentElement;
					if (target == root) { return; }
					continue;
				}
				target = nextElement;
				if (target.matches(`[tabindex]`)) {
					destination = target;
				} else {
					destination = findDestination(target);
				}
				if (destination) {
					let skipMe = findSkippableParent(destination);
					// Forbid vertical nav into, but not within, a skippable element
					if (skipMe && skipMe != findSkippableParent(event.target)) {
						target = skipMe;
						destination = undefined;
						continue;
					}
					// TODO: Scroll if needed
					destination.focus({focusVisible: true});
				}
			}
		}
		function findSkippableParent(elem) {
			return elem.closest(".skipVerticalNav, [inert]");
		}
	});

	// If there's no current nav target, select a new one
	let observer = new MutationObserver( (mutations) => {
		if (root.querySelector(`[tabindex="0"]`)) { return; }
		root.querySelector("[tabindex]")?.setAttribute("tabindex", 0);
	});
	observer.observe(root, {childList: true, subtree: true});
}
/** @type {import("svelte/action").Action} */
export function target(elem, {activate} = {}) {
	elem.tabIndex = -1;
	if (activate) {
		elem.addEventListener("click", activate);
		elem.addEventListener("keydown", (event) => {
			if (event.key == "Enter" || event.key == " ") {
				activate(event);
				event.preventDefault();
			}
		});
	} else if (elem instanceof HTMLAnchorElement) {
		elem.addEventListener("keydown", (event) => {
			if (event.key == " ") { elem.click(); }
		});
	}
}