# OH HAI

This is where the geekery that goes into Deviant Love happens. If you do not wish to partake in the geekery, but rather seek to install Deviant Love or have it described to you, see [its page on DeviantArt](http://fav.me/d2my13o).

# To Engage In Chrome/Chromium Geekery

No special tools are needed! The Chrome folder is the unpacked Deviant Love extension, ready for hacking or testing! To run the unpacked extension in Chrome/Chromium, go to http://code.google.com/chrome/extensions/getstarted.html and skip ahead to the "Load the extension" step.

# To Engage In Firefox Geekery

Well, umm, some of the Firefox things are kept in the Chrome folder, haha. In order to get a working Firefox extension, make symbolic links of Chrome/core/ and Chrome/_locales/ in Firefox/webextension/ (creating Firefox/webextension/core/ and Firefox/webextension/_locales).

Windows users can use [Link Shell Extension](http://schinagl.priv.at/nt/hardlinkshellext/hardlinkshellext.html) to make symbolic links (junctions will also work, but will bork if you move the Deviant Love repo). Linux users can use the [ln](http://en.wikipedia.org/wiki/Ln_(Unix)) command line tool, or possibly find an easier way in their file manager. Alternatively, you can copy the folders, but Git will ignore the copies, so make sure any changes you make get copied back.

To test the Firefox extension, I recommend doing a [temporary installation](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

# KTHXBAI

If you have any questions, feel free to either send me a dA Note or leave a comment on [the deviation page](http://fav.me/d2my13o), whichever you feel is more appropriate.