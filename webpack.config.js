var webpack = require('webpack');
var path = require('path');
var fileUrl = require('file-url');

module.exports = function(env = {}) { return {
	mode: "none",
	entry: {
		core: './WebExtension/report/core.esm.js',
		options: './WebExtension/options/options.esm.js',
	},
	output: {
		path: path.resolve(__dirname, 'WebExtension/build'),
		filename: '[name].js'
	},
	// Firefox & Chrome don't correctly handle relative URLs for source maps in extensions. Workaround is in plugins.
	// devtool: "source-maps",
	module: {
		rules: [
			{
				test: /\.svelte$/,
				use: {
					loader: "svelte-loader",
				}
			},
		],
	},
	optimization: {
		splitChunks: {
			minSize: 0,
			cacheGroups: {
				shared: {
					name: "shared",
					chunks({name}) {
						return (name == "core" || name == "options");
					},
					minChunks: 2,
				}
			}
		},
	},
	plugins: [
		new webpack.optimize.ModuleConcatenationPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		// Workaround for above Firefox/Chrome issue
		...( !(env.release) ? [
			new webpack.SourceMapDevToolPlugin({
				publicPath: fileUrl("WebExtension/build") + "/",
				filename: "[file].map"
			}),
		] : [] )
	],
}; };
