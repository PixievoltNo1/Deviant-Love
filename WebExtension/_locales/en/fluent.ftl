scanningFeatured = Scanning featured faves...
scanningAll = Scanning all faves...
scanningCollection = Scanning Collection...
scanningSearch = Scanning search results...
scannedDeviations = { $num } deviations scanned
scanError = Communication with DeviantArt was unsuccessful.
scanErrorRetry = Try again
watchSuccess = Successfully retrieved your watch list
watchErrorNotLoggedIn = Your watch list couldn't be retrieved. It appears you're not logged in.
watchErrorInternal = Your watch list couldn't be retrieved, likely due to an issue with Deviant Love.

# Header lines appear in the order of headerFavesLine > headerArtistsLine. Both have $pageType
# available. They should flow together as a sentence, but if that is not possible, they can also be
# written as a traditional stats readout, e.g. headerArtistsLine = Number of artists: { $num }.
# Surround all $num placeables with asterisks so they can be bolded.
headerFavesLine = { $pageType ->
    [featured] This page has *{ $num }* featured faves
   *[allFaves] This page has *{ $num }* faves
    [collection] This Collection has *{ $num }* faves
    [search] This page has *{ $num }* search results
}
headerArtistsLine = from *{ $num }* different artists!

findAction = Find
optionsAction = Options
close = Close
findGo = Go
findHelp = Find art & artists from the scanned page by name
findErrorForbiddenCharacter = DeviantArt doesn't allow the use of { $char } in deviant or deviation names.
findAmpersandHint = The exact phrase you enter in the find bar is treated as one term to search for. To search for multiple terms, separate them with: &
foundDeviants = { $num ->
    [one] Found 1 deviant
   *[other] Found { $num } deviants
}
foundDeviantSubaccount = Found subaccount { $name }
foundDeviations = Found { $deviations ->
    [one] 1 deviation
   *[other] { $deviations } deviations
} from { $artists ->
    [one] 1 artist
   *[other] { $artists } artists
}
foundDeviationsArtistHeader = From { $name }:
foundNothing = Sorry, there are no matches!
artWatched = Watching art
artNotWatched = Not watching art
profile = Profile
gallery = Gallery
favourites = Faves
subaccountsOpen = Subaccounts
subaccountsClose = Close Subaccounts
subaccountsList = { $name }'s subaccounts
subaccountsRemove = Remove
subaccountsAddNamePlaceholder = Enter account name
subaccountsAddConfirm = Add
subaccountsErrorAlreadyOwned = That subaccount already belongs to { $name }. (Add { $name } as a subaccount to add both it and all its subaccounts.)
subaccountsErrorNotFound = DeviantArt reports "not found" for "{ $name }"; check your spelling. (A deactivated account can also cause this error.)
subaccountsErrorCommunication = Can't verify the account exists due to an error communicating with DeviantArt. Try again later.
subaccountsErrorOwnerIsOwned = { $owned } is a subaccount of { $owner }, and cannot be added as an owner.
subaccountsWarningCantVerifyCasing = Due to a Deviant Love issue, the correct capitalization for { $name } couldn't be determined. If you need to change it, remove it and add it again.
subaccountsWarningOwnerAlreadyAdded = You've already added { $owner } as an owner. Deviant Love is adding { $owned } to their subaccounts.
subaccountsEditorHeader = Subaccounts
subaccountsEditorExplain = Know a deviant who has multiple accounts? Tell Deviant Love about their subaccounts, and all their artwork will appear under one name!
subaccountsEditorAddMainAccount = Add owner
subaccountsEditorChangeMain = Change main
subaccountsEditorAddSubaccount = Add subaccount
subaccountsEditorAddPlaceholder = Subaccount name here
subaccountsEditorOwnerPlaceholder = Owner name here
subaccountsEditorCancelOwner = Cancel
subaccountsEditorConfirmMainChange = Set main account
syncHeader = Sync
syncByBrowserOK = No problems detected! Your settings will be synced if browser sync is enabled.
syncByBrowserError = Failed to save sync data with this error: { $err }
syncByBrowserUnsupported = Sync isn't available in this version of this browser.
syncLastSaved = Sync data last saved on: { $date }
syncLastSuccessfulSync = Last successful sync on: { $date }