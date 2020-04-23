/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
var registry = new Set();
export default function(node) {
	node.style.whiteSpace = "nowrap";
	node.style.transformOrigin = "left";
	node.parentElement.style.overflowX = "hidden";
	squish(node);
	registry.add(node);
	return {
		destroy() {
			registry.delete(node);
		},
	};
}
window.addEventListener("resize", () => {
	for (let node of registry) {
		squish(node);
	}
});
function squish(node) {
	var range = document.createRange();
	range.selectNodeContents(node);
	var squishTo = node.getBoundingClientRect().width;
	var squishFrom = range.getBoundingClientRect().width;
	if (squishTo >= squishFrom) {
		node.style.transform = "none";
	} else {
		node.style.transform = `scaleX(${squishTo / squishFrom})`;
	}
}