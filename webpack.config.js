var webpack = require('webpack');
var path = require('path');
var fileUrl = require('file-url');
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = function(env = {}) { return {
	mode: "none",
	entry: {
		core: './WebExtension/report/core.module.js',
	},
	output: {
		path: path.resolve(__dirname, env.release ? 'release/build' : 'WebExtension/build'),
		filename: '[name].js'
	},
	// Firefox & Chrome don't correctly handle relative URLs for source maps in extensions. Workaround is in plugins.
	// devtool: "source-maps",
	module: {
		rules: [
			{
				test: /\.html$/,
				use: {
					loader: "svelte-loader",
					options: {
						store: true,
					}
				}
			},
		],
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
		] : [ // for release builds
			new CopyWebpackPlugin([
				{ from: 'WebExtension', to: '../' }
			], {
				ignore: ['*.module.js', 'build/**', '**/svelte/**']
			}),
		] )
	],
	stats: {
		optimizationBailout: true,
	},
}; };
