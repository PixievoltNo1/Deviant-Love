/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
function DeviantCollection(from, deviantType = Object) {
	this.deviantType = deviantType;
	this.subaccounts = {};
	this.ownerships = new Map();
	this.baseMap = from;
	this.effectiveMap = new Map(from);
}
DeviantCollection.prototype = {
	setSubaccounts(newSubaccounts) {
		/* Must correctly handle accounts transitioning between any 2 states in a group:
			Present in baseMap:
			- Owner (masked object in effectiveMap)
			- Owned (absent from effectiveMap)
			- Neither (same object in effectiveMap)
			Absent from baseMap:
			- Virtual Owner (present in effectiveMap)
			- Unknown (no presence)
		*/
		let {subaccounts: oldSubaccounts, ownerships: oldOwnerships} = this;
		let newOwnerships = new Map(), isOwner = new Set();
		for (let [ownerName, subaccountList] of Object.entries(newSubaccounts)) {
			let subaccountObjs = [];
			for (let subaccountName of subaccountList) {
				if (!this.baseMap.has(subaccountName)) { continue; }
				subaccountObjs.push(this.baseMap.get(subaccountName));
				// Transitions: Neither > Owned, Owner > Owned
				this.effectiveMap.delete(subaccountName);
			}
			if (subaccountObjs.length == 0) { continue; }
			let owner = this.baseMap.get(ownerName);
			if (owner) {
				let currentEffective = this.effectiveMap.get(ownerName);
				// Transitions: Neither > Owner, Owned > Owner
				if (owner == currentEffective || currentEffective == null) {
					let maskedOwner = Object.create(owner);
					maskedOwner.deviations = owner.deviations.slice();
					this.effectiveMap.set(ownerName, maskedOwner);
				}
			} else {
				owner = this.effectiveMap.get(ownerName);
				// Transition: Unknown > Virtual Owner
				if (!owner) {
					owner = new this.deviantType();
					owner.name = ownerName;
					owner.deviations = [];
					this.effectiveMap.set(ownerName, owner);
				}
			}
			isOwner.add(owner);
			for (let subaccountObj of subaccountObjs) {
				newOwnerships.set(subaccountObj, owner);
			}
		}

		// Process additions & filter oldOwnerships into a removal list
		let hasAdditions = new Set();
		for (let [owned, owner] of newOwnerships.entries()) {
			let oldOwner = oldOwnerships.get(owned);
			if (owner == oldOwner) {
				oldOwnerships.delete(owned);
			} else {
				let addTo = this.effectiveMap.get(owner.name);
				addTo.deviations.push(...owned.deviations);
				hasAdditions.add(addTo);
			}
		}
		for (let owner of hasAdditions) {
			owner.deviations.sort( (a, b) => { return a.pos - b.pos;} );
		}

		// Process removals
		for (let [unowned, oldOwner] of oldOwnerships) {
			// Transition: Owned > Neither
			if (!newOwnerships.has(unowned) && !isOwner.has(unowned)) {
				this.resetToBase(unowned.name);
			}
			if (isOwner.has(oldOwner)) {
				let removeFrom = this.effectiveMap.get(oldOwner.name);
				let removeMe = new Set(unowned.deviations);
				removeFrom.deviations = removeFrom.deviations.filter(
					(deviation) => { return !removeMe.has(deviation); }
				);
			} else {
				// Transitions: Owner > Neither, Virtual Owner > Unknown
				if (!newOwnerships.has(oldOwner)) {
					this.resetToBase(oldOwner.name);
				}
			}
		}

		this.subaccounts = Object.assign({}, newSubaccounts);
		this.ownerships = newOwnerships;
		this.buildList();
	},
	// Internal methods
	buildList() {
		this.list = Array.from(this.effectiveMap.values()).sort( function orderMostLoved(a, b) {
			if (a.deviations.length != b.deviations.length) {
				return b.deviations.length - a.deviations.length;
			} else {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}
		} );
	},
	resetToBase(deviantName) {
		if (this.baseMap.has(deviantName)) {
			this.effectiveMap.set(deviantName, this.baseMap.get(deviantName));
		} else {
			this.effectiveMap.delete(deviantName);
		}
	}
}