import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import copy from "@guanghechen/rollup-plugin-copy";
import path from "node:path";
/** @type {import('rollup').RollupOptions} */
export default {
	input: {
		"build/core": "./WebExtension/report/core.src.mjs",
		"build/options": "./WebExtension/options/options.src.mjs",
		"build/find": "./WebExtension/report/find.src.mjs",
	},
	external: [path.resolve("WebExtension/report/scanner.mjs")],
	plugins: [
		svelte(),
		resolve({browser: true}),
		copy({targets: [
			{
				src: ["WebExtension/**/*.*", "!**/*.{src.*,svelte}", "!WebExtension/manifest.*.json"],
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
			dir: "build-firefox",
			sourcemap: true,
		},
		{
			dir: "build-chrome",
			sourcemap: true,
		},
	]
};