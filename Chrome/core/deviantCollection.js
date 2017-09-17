function DeviantCollection(from, deviantType = Object) {
	this.deviantType = deviantType;
	this.subaccounts = {};
	this.subaccountOwners = new Map();
	if (from instanceof Map) {
		this.setBaseMap(from);
	} else {
		var fromMap = new Map();
		for (let [name, deviations] of Object.entries(from)) {
			let deviant = new deviantType();
			deviant.name = name;
			deviant.deviations = deviations;
			fromMap.set(name, deviant);
		}
		this.setBaseMap(fromMap);
	}
}
DeviantCollection.prototype = {
	setBaseMap(newBaseMap) {
		this.baseMap = newBaseMap;
		this.effectiveMap = new Map(newBaseMap);
		/* When a future version makes it possible for setBaseMap to be called after subaccounts
		have been set (e.g. via Through Scans), changes to effectiveMap must be re-applied. */
	},
	setSubaccounts(newSubaccounts) {
		for (let checkMe in this.subaccounts) {
			if (!(checkMe in newSubaccounts)) {
				this.resetToBase(checkMe);
			}
		}
		let newSubaccountOwners = new Map();
		for (let [ownerName, subaccountList] of Object.entries(newSubaccounts)) {
			let subaccountObjs = [];
			for (let subaccountName of subaccountList) {
				if (!this.baseMap.has(subaccountName)) { continue; }
				subaccountObjs.push(this.baseMap.get(subaccountName));
				this.effectiveMap.delete(subaccountName);
			}
			if (subaccountObjs.length == 0) { continue; }
			let owner = this.baseMap.get(ownerName);
			if (!owner) {
				owner = new this.deviantType();
				owner.name = ownerName;
				owner.deviations = [];
			}
			this.mergeDeviations(owner, subaccountObjs);
			for (let subaccountObj of subaccountObjs) {
				newSubaccountOwners.set(subaccountObj, owner);
			}
		}
		for (let checkMe in this.subaccountOwners.keys()) {
			// if the account is now a main account and did not get an effectiveMap entry from the previous process
			if (!newSubaccountOwners.has(checkMe) && !this.effectiveMap.has(checkMe.name)) {
				this.effectiveMap.set(checkMe.name, checkMe);
			}
		}
		this.subaccounts = newSubaccounts;
		this.subaccountOwners = newSubaccountOwners;
		this.buildList();
	},
	getRestoreData() {
		var restoreData = {};
		for (let {name, deviations} of this.baseMap.values()) {
			restoreData[name] = deviations;
		}
		return restoreData;
	},
	// Intended as internal methods, but will not be so until addSubaccount and removeSubaccount are implemented
	buildList() {
		this.list = Array.from(this.effectiveMap.values()).sort( function orderMostLoved(a, b) {
			if (a.deviations.length != b.deviations.length) {
				return b.deviations.length - a.deviations.length;
			} else {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}
		} );
	},
	mergeDeviations(target, sources) {
		if (!target.nonBase) {
			target = Object.create(target);
			target.nonBase = true;
			this.effectiveMap.set(target.name, target);
		}
		var deviationLists = sources.map((source) => { return source.deviations; });
		target.deviations = target.deviations.concat(...deviationLists);
		target.deviations.sort(function earliestPos(a, b) {
			return a.pos - b.pos;
		});
	},
	resetToBase(deviantName) {
		if (this.baseMap.has(name)) {
			this.effectiveMap.set(deviantName, this.baseMap.get(deviantName));
		} else {
			this.effectiveMap.delete(deviantName);
		}
	}
}