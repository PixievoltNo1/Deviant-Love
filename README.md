Deviant Love is a browser extension that takes the DeviantArt faves page you've visited and sorts the art in it by artist. For more about using or installing Deviant Love, see [its page on DeviantArt](http://fav.me/d2my13o).

This project has a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to be as courteous, welcoming, and generally a lovely person as its terms require. ♡

# First-time / Post-package.json-update setup

After you obtain this repo's files for the first time, or whenever I update package.json, you'll need to run `npm install` in the repo's folder. You can get npm by installing [Node.js](https://nodejs.org/).

# Building the extension's files

After setup, if you just want to build the files needed to try Deviant Love, run `npm run build`.

If you want to help develop Deviant Love, start `npm run watch` - it'll build the extension and automatically rebuild it as you make changes. You'll need to know [Svelte](https://svelte.dev/) to work on .svelte files.

If you'd like to tinker with the build process itself, check the [Rollup docs](https://rollupjs.org/configuration-options/) for info on rollup.config.js.

# Testing the built extension

The commands above create two build folders. What to do with them depends on your browser:

* For Firefox, load build-firefox as a [temporary extension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox), or use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/).
* For Chrome, load build-chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).