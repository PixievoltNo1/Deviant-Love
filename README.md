# OH HAI

This is where the geekery that goes into Deviant Love happens. If you do not wish to partake in the geekery, but rather seek to install Deviant Love or have it described to you, see [its page on deviantART](http://fav.me/d2my13o).

# To Engage In Chrome/Chromium Geekery

No special tools are needed! The Chrome folder is the unpacked Deviant Love extension, ready for hacking or testing! To run the unpacked extension in Chrome/Chromium, go to http://code.google.com/chrome/extensions/getstarted.html and skip ahead to the "Load the extension" step.

# To Engage In Firefox Geekery

Well, umm, some of the Firefox things are kept in the Chrome folder, haha. In order to get a working Firefox extension, do the following:
* Make a symbolic link of Chrome/core/ in Firefox/content/ (creating Firefox/content/core/)
* Run FxL10n.py (use [Python](http://www.python.org/), version 3)

Windows users can use [Link Shell Extension](http://schinagl.priv.at/nt/hardlinkshellext/hardlinkshellext.html) to make a symbolic link (a junction will also work, but will bork if you move the Deviant Love repo). Linux users can use the [ln](http://en.wikipedia.org/wiki/Ln_(Unix)) command line tool, or possibly find an easier way in their file manager. Alternatively, you can copy the folder, but Git will ignore the copy, so make sure any changes you make get copied back.

To test the Firefox extension, I recommend following [these directions](https://developer.mozilla.org/en/Building_an_Extension#Test).

Don't touch stuff in Firefox/locale/; instead, make your changes in Chrome/_locales/ and then run FxL10n.py again.

# Custom jQuery Build

The copy of jQuery present here is a custom build, using the options `-ajax/jsonp,-deprecated,-effects`. Use [Velocity.js](http://julian.com/research/velocity/) or CSS feature for animations.

# Grabbing the Code of Chrome/Chromium Preview Versions

Starting with version 2.0 RC 2, the exact code of preview releases for Chrome/Chromium is not directly available in the repository. The ChromePreview.patch contains the differences between the exact code and the available code; you can either run `git apply ChromePreview.patch` to get the exact code, or you can just read the patch file and figure out the differences yourself.

# KTHXBAI

If you have any questions, feel free to either send me a dA Note or leave a comment on [the deviation page](http://fav.me/d2my13o), whichever you feel is more appropriate.