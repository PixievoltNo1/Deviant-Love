import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
/** @type {import('rollup').RollupOptions} */
export default {
	input: {
		core: "./WebExtension/report/core.esm.js",
		options: "./WebExtension/options/options.esm.js",
	},
	plugins: [svelte(), resolve()],
	output: {
		dir: "./WebExtension/build",
		sourcemap: true,
	}
};