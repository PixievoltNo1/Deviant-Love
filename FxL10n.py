#! /usr/bin/env python3
import json, re, os, shutil
from os import path

print("All righty! Firefox l10n setup GO!")

crL10nDir = path.join("Chrome", "_locales")
fxL10nDir = path.join("Firefox", "locale")
crPlaceholder = re.compile(r"(?<!\$)\$(\d)")

if not path.isdir(fxL10nDir):
	print("Creating", fxL10nDir)
	os.mkdir(fxL10nDir)
else:
	print("Wiping", fxL10nDir)
	for dir in os.listdir(fxL10nDir):
		shutil.rmtree(path.join(fxL10nDir, dir))

for lang in os.listdir(crL10nDir):
	crLangDir = path.join(crL10nDir, lang)
	fxLangDir = path.join(fxL10nDir, lang)
	bundledStrings = {}
	print("Putting together", fxLangDir)
	
	os.mkdir(fxLangDir)
	for file in os.listdir(crLangDir):
		if file == "messages.json":
			msgsFile = open(path.join(crLangDir, file))
			msgs = json.load(msgsFile)
			msgsFile.close()
			for msgName, messageData in msgs.items():
				if msgName in ("extDesc", "l10nFolder"):
					continue
				message = messageData["message"]
				if crPlaceholder.search(message):
					message = re.sub(r"\%", "%%", message)
					message = crPlaceholder.sub(r"%\1$S", message)
					message = re.sub(r"\$\$", "$", message)
				bundledStrings[msgName] = message
				
				propertyFile = open(path.join(fxLangDir, "messages.properties"), "w")
				propertyFile.write("# This file is auto-generated; don't bother with it\n")
				for itemName, item in bundledStrings.items():
					propertyFile.write(itemName + "=" + item + "\n")
				propertyFile.close()
		else:
			shutil.copy(path.join(crLangDir, file), fxLangDir)

print("All done! :)")