import lookUpDeviant from "../report/lookUpDeviant.module.js";
export default async function(action, details) {
	if (this.get().busy) { return; }
	this.set({warnings: [], error: null});

	var ui = this, {store} = this, {subaccounts} = store.get();
	try {
		await ({
			async add({owner, adding, success}) {
				await addSubaccount(owner, adding);
				success();
			},
			async newOwner({newOwner, firstSubaccount, success}) {
				var {name, isOwner, ownedBy} = await nameCheck(newOwner);
				if (ownedBy) {
					throw ["OwnerIsOwned", {owned: name, owner: ownedBy}];
				}
				if (isOwner) {
					warn(["OwnerAlreadyAdded", {owner: name, owned: firstSubaccount}]);
				}
				await addSubaccount(name, firstSubaccount);
				success();
			},
			remove({owner, removing}) {
				subaccounts[owner].splice(subaccounts[owner].indexOf(removing), 1);
				if (subaccounts[owner].length == 0) {
					delete subaccounts[owner];
				}
			},
			changeOwner({from, to}) {
				var newSubaccounts = {};
				for (let [entryOwner, owned] of Object.entries(subaccounts)) {
					if (entryOwner == from) {
						owned[ owned.indexOf(to) ] = from;
						newSubaccounts[to] = owned;
					} else {
						newSubaccounts[entryOwner] = owned;
					}
				}
				subaccounts = newSubaccounts;
			},
		})[action](details);
		store.set({subaccounts});
	} catch (error) {
		this.set({error});
	} finally {
		this.set({busy: false});
	}

	async function addSubaccount(owner, owned) {
		var {name, ownedBy, isOwner} = await nameCheck(owned);
		if (ownedBy) {
			throw ["AlreadyOwned", {name: ownedBy}];
		}
		if (!(owner in subaccounts)) {
			subaccounts[owner] = [];
		}
		subaccounts[owner].push(name);
		if (isOwner) {
			for (let subaccount of subaccounts[name]) {
				subaccounts[owner].push(subaccount);
			}
			delete subaccounts[name];
		}
	}
	function nameCheck(input) {
		var name = input.toLowerCase();
		for (let owner in subaccounts) {
			if (owner.toLowerCase() == name) {
				return {name: owner, isOwner: true};
			}
			for (let subaccount of subaccounts[owner]) {
				if (subaccount.toLowerCase() == name) {
					return {name: subaccount, ownedBy: owner};
				}
			}
		}
		for (let known of ui.get().knownNames) {
			if (known.toLowerCase() == name) {
				return {name: known};
			}
		}
		ui.set({busy: true});
		return lookUpDeviant(name).then((results) => {
			if (results.name) {
				return {name: results.name};
			} else {
				warn( ["CantVerifyCasing", {name: input}] );
				return { name: input };
			}
		}, (err) => {
			throw [err, {name: input}];
		});
	}
	function warn(warning) {
		var {warnings} = ui.get();
		warnings.push(warning);
		ui.set({warnings});
	}
}