import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import copy from "@guanghechen/rollup-plugin-copy";
import path from "node:path";
/** @type {import('rollup').RollupOptions} */
export default {
	input: {
		core: "./WebExtension/report/core.esm.js",
		options: "./WebExtension/options/options.esm.js",
	},
	plugins: [
		svelte(),
		resolve({browser: true}),
		copy({targets: [
			{
				src: ["WebExtension/**/*.*", "!**/*.{esm.js,svelte}", "!WebExtension/manifest.*.json"],
				dest: ["build-firefox", "build-chrome"],
				rename: (name, ext, srcPath) => path.relative("WebExtension", srcPath),
			},
			{
				src: "WebExtension/manifest.firefox.json",
				rename: "manifest.json",
				dest: "build-firefox",
			},
			{
				src: "WebExtension/manifest.chrome.json",
				rename: "manifest.json",
				dest: "build-chrome",
			},
		]}),
	],
	output: [
		{
			dir: "build-firefox/build",
			sourcemap: true,
		},
		{
			dir: "build-chrome/build",
			sourcemap: true,
		},
	]
};