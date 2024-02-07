import {ChangeDetectorRef, Component, isDevMode} from '@angular/core';
import {Wayfinder} from './wayfinder';
import {HttpClient} from "@angular/common/http";
import {Material} from "./material";
import {Zone} from "./zone";
import {Mutator} from "./mutator";
import {Item} from "./item";
import {Weapon} from "./weapon";
import {Accessory} from "./accessory";
import {Artifact} from "./artifact";
import {Materials} from "./materials";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    title = 'Wayfinder planner';
    lang = 'en';
    wayfinders: Wayfinder[] = [];
    weapons:Weapon[] = [];
    accessories:Accessory[] = [];
    artifacts:Artifact[] = [];
    items:{[id: string]: Item} = {};
    materials:{[id: string]: Material} = {};
    zones:{[id: string]: Zone} = {};
    alerts:string[] = [];
    required_materials:{[zone: string]: {[material:string]: number} } = {};
    sorted_zones:{
        zone_id:string,
        materials:{
            [material:string]: number
        }
    }[] = [];
    inventory: {[id: string]: number} = JSON.parse(localStorage.getItem('inventory') ?? '{}');
    craftable_items:{item:Item, text:string}[] = [];
    mutators:{[id: string]: Mutator} = {};
    completed: string[] = JSON.parse(localStorage.getItem('completed') ?? '[]');
    tracking: string[] = JSON.parse(localStorage.getItem('tracking') ?? '[]');
    submitData = false
    dataSubmitTable: {id:string, name:string, rows: (string|number)[][], disabledColumns: number[], columnLevels:{[col:number]:string}}[] = [];
    dataToSubmit: {[id:string]:{[level:string]:{[index:number]:number}}} = {};
    defaultNewItem:{
        id:string,
        name:string
    } = {
        id: '',
        name: ''
    };
    newItem:{
        id:string,
        name:string
        materials:Materials
    } = {
        ...this.defaultNewItem,
        materials: {
            unlock: [],
            awake1: [],
            awake2: [],
            awake3: [],
        }
    };

    newMaterial:Material = {
        id: '',
        mutator: {id: '', tier: 0},
        name: '',
        zones: []
    }
    numberOfNewMaterials = 0;


    constructor(
        private http: HttpClient,
        public cdr: ChangeDetectorRef
    ) {
        this.loadMaterials()
            .then(this.loadMutators)
            .then(this.loadHunts)
            .then(this.loadExpeditions)
            .then(this.loadHighlands)
            .then(this.loadWayfinders)
            .then(this.loadWeapons)
            .then(this.loadAccessories)
            .then(this.loadArtifacts)
            .then(this.processItems)
    }

    loadMaterials = () => this.http.get<Material[]>('assets/data/materials.json?v='+Math.random()).forEach(value => {
        for (let material of value) {
            this.materials[material.id] = material;
            if (!this.inventory[material.id]) {
                this.inventory[material.id] = 0;
            }
        }
    })

    loadMutators = () => this.http.get<Mutator[]>('assets/data/mutators.json?v='+Math.random()).forEach(value => {
        for (let mutator of value) {
            this.mutators[mutator.id] = mutator;
        }
    })

    loadHunts = () => this.http.get<Zone[]>('assets/data/hunts.json?v='+Math.random()).forEach(value => {
        for (let zone of value) {
            zone.type = 'hunt';
            this.zones[zone.id] = zone;
        }
    })

    loadExpeditions = () => this.http.get<Zone[]>('assets/data/expeditions.json?v='+Math.random()).forEach(value => {
        for (let zone of value) {
            zone.type = 'expedition';
            this.zones[zone.id] = zone;
        }
    })

    loadHighlands = () => this.http.get<Zone[]>('assets/data/highlands.json?v='+Math.random()).forEach(value => {
        for (let zone of value) {
            zone.type = 'highlands';
            this.zones[zone.id] = zone;
        }
    })

    loadWayfinders = () => this.http.get<Wayfinder[]>('assets/data/wayfinders.json?v='+Math.random()).forEach(value => {
        this.wayfinders = value
        for (let wayfinder of this.wayfinders) {
            wayfinder.type = 'wayfinder'
            wayfinder.is_crafted = true
            this.items[wayfinder.id] = wayfinder;
        }
    })

    loadWeapons = () => this.http.get<Weapon[]>('assets/data/weapons.json?v='+Math.random()).forEach(value => {
        this.weapons = value
        for (let weapon of this.weapons) {
            weapon.type = 'weapon'
            weapon.is_crafted = true
            this.items[weapon.id] = weapon;
        }
    })

    loadAccessories = () => this.http.get<Accessory[]>('assets/data/accessories.json?v='+Math.random()).forEach(value => {
        this.accessories = value
        for (let accessory of this.accessories) {
            accessory.type = 'accessory'
            this.items[accessory.id] = accessory;
        }
    })

    loadArtifacts = () => this.http.get<Artifact[]>('assets/data/artifacts.json?v='+Math.random()).forEach(value => {
        this.artifacts = value
        for (let artifact of this.artifacts) {
            artifact.type = 'artifact'
            this.items[artifact.id] = artifact;
        }
    })

    processItems = () => {
        for (let key of this.completed) {
            let keyArray = key.split('.');
            let item = this.items[keyArray[0]];
            switch (item.type) {
                case 'wayfinder':
                    this.loadCompletedWayfinder(item as Wayfinder, keyArray[1]);
                    break;
                case 'weapon':
                    this.loadCompletedWeapon(item as Weapon, keyArray[1]);
                    break;
                case 'accessory':
                    this.loadCompletedAccessory(item as Accessory, keyArray[1]);
                    break;
                case 'artifact':
                    this.loadCompletedArtifact(item as Artifact, keyArray[1]);
                    break;
                default:
                    this.alerts.push('Unexpected item type '+item.type);
            }
        }
        for (let id of this.tracking) {
            this.items[id].is_tracked = true;
        }

        for (let item of Object.values(this.items)) {
            let rows:(number|string)[][] = [['Material']];
            let disabledColumns:number[] = [];
            let columnLevels:{[col:number]:string} = {};
            let fullData = true;
            for (let material of this.getBaseMaterials(item)) {
                rows.push([this.materials[material.material].name]);
            }
            this.dataToSubmit[item.id] = {};
            for (let key of Object.keys(item.materials)) {
                this.dataToSubmit[item.id][key] = {};
                columnLevels[rows[0].length] = key;
                let materials = item.materials[key];
                rows[0].push(key)
                for (let i = 1; i <= this.getBaseMaterials(item).length; i++) {
                    let quantity = materials.at(i-1)?.quantity ?? 0;
                    rows[i].push(quantity);
                    if (quantity === 0) {
                        this.dataToSubmit[item.id][key][i-1] = 0
                    }
                }
                if (Object.values(this.dataToSubmit[item.id][key]).length === 0) {
                    delete this.dataToSubmit[item.id][key];
                }
                if (materials.length > 0) {
                    disabledColumns.push(rows[0].length - 1);
                } else {
                    fullData = false;
                }
            }
            if (fullData) {
                delete this.dataToSubmit[item.id];
            } else {
                this.dataSubmitTable.push({
                    id: item.id,
                    name: item.name,
                    rows: rows,
                    disabledColumns: disabledColumns,
                    columnLevels: columnLevels
                });
            }
        }
        this.refreshCraftables();
    }

    loadCompletedWayfinder = (wayfinder:Wayfinder, field:string) => {
        switch (field) {
            case 'unlocked':
                wayfinder.unlocked = true;
                break;
            case 'awakened1':
                wayfinder.awakened1 = true;
                break;
            case 'awakened2':
                wayfinder.awakened2 = true;
                break;
            case 'awakened3':
                wayfinder.awakened3 = true;
                break;
            default:
                this.alerts.push('Unexpected value ' + field)
        }
    }

    loadCompletedWeapon = (weapon:Weapon, field:string) => {
        switch (field) {
            case 'unlocked':
                weapon.unlocked = true;
                break;
            case 'awakened1':
                weapon.awakened1 = true;
                break;
            case 'awakened2':
                weapon.awakened2 = true;
                break;
            case 'awakened3':
                weapon.awakened3 = true;
                break;
            default:
                this.alerts.push('Unexpected value ' + field)
        }
    }

    loadCompletedAccessory = (accessory:Accessory, field:string) => {
        switch (field) {
            case 'gotten':
                accessory.gotten = true;
                break;
            default:
                this.alerts.push('Unexpected value ' + field)
        }
    }

    loadCompletedArtifact = (artifact:Artifact, field:string) => {
        switch (field) {
            case 'crafted':
                artifact.crafted = true;
                break;
            default:
                this.alerts.push('Unexpected value ' + field)
        }
    }

    changedTracked = (item:Item) => {
        if (item.is_tracked) {
            this.tracking.push(item.id);
        } else {
            this.tracking = this.tracking.filter(key => key !== item.id);
        }
        localStorage.setItem('tracking', JSON.stringify(this.tracking));
        this.refreshCraftables();
    }

    changedUnlocked = (wayfinder:Wayfinder) => {
        if (wayfinder.unlocked) {
            this.completed.push(wayfinder.id + '.unlocked');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(wayfinder.id + '.'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    changedAwakened1 = (wayfinder:Wayfinder) => {
        if (wayfinder.awakened1) {
            this.completed.push(wayfinder.id + '.awakened1');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(wayfinder.id + '.awakened'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    changedAwakened2 = (wayfinder:Wayfinder) => {
        if (wayfinder.awakened2) {
            this.completed.push(wayfinder.id + '.awakened2');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(wayfinder.id + '.awakened2') && !key.startsWith(wayfinder.id + '.awakened3'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    changedAwakened3 = (wayfinder:Wayfinder) => {
        if (wayfinder.awakened3) {
            this.completed.push(wayfinder.id + '.awakened3');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(wayfinder.id + '.awakened3'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    changedGotten = (accesory:Accessory) => {
        if (accesory.gotten) {
            this.completed.push(accesory.id + '.gotten');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(accesory.id + '.gotten'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    changedCrafted = (artifact:Artifact) => {
        if (artifact.crafted) {
            this.completed.push(artifact.id + '.crafted');
        } else {
            this.completed = this.completed.filter(key => !key.startsWith(artifact.id + '.crafted'));
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }
    
    trackItem = (item: Item) => {
        if (item.is_tracked) {
            switch (item.type) {
                case 'wayfinder':
                    this.requireWayfinderMaterials(item as Wayfinder);
                    break;
                case 'weapon':
                    this.requireWeaponMaterials(item as Weapon);
                    break;
                case 'accessory':
                    this.requireAccessoryMaterials(item as Accessory);
                    break;
                case 'artifact':
                    this.requireArtifactMaterials(item as Artifact);
                    break;
                default:
                    this.alerts.push('Tracking an item of type '+item.type);
            }
            this.alerts = [...new Set(this.alerts)];
        }
        this.cleanMaterials();
    }

    requireWayfinderMaterials = (wayfinder:Wayfinder) => {
        if (!wayfinder.unlocked) {
            if (!this.requireMaterials(wayfinder.materials.unlock)) {
                this.alerts.push('Unknown materials for '+wayfinder.name+' unlock');
            }
        } else if (!wayfinder.awakened1) {
            if (!this.requireMaterials(wayfinder.materials.awake1)) {
                this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 1');
            }
        } else if (!wayfinder.awakened2) {
            if (!this.requireMaterials(wayfinder.materials.awake2)) {
                this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 2');
            }
        } else if (!wayfinder.awakened3) {
            if (!this.requireMaterials(wayfinder.materials.awake3)) {
                this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 3');
            }
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireWeaponMaterials = (weapon:Weapon) => {
        if (!weapon.unlocked) {
            if (!this.requireMaterials(weapon.materials.unlock)) {
                this.alerts.push('Unknown materials for '+weapon.name+' unlock');
            }
        } else if (!weapon.awakened1) {
            if (!this.requireMaterials(weapon.materials.awake1)) {
                this.alerts.push('Unknown materials for '+weapon.name+' awakening 1');
            }
        } else if (!weapon.awakened2) {
            if (!this.requireMaterials(weapon.materials.awake2)) {
                this.alerts.push('Unknown materials for '+weapon.name+' awakening 2');
            }
        } else if (!weapon.awakened3) {
            if (!this.requireMaterials(weapon.materials.awake3)) {
                this.alerts.push('Unknown materials for '+weapon.name+' awakening 3');
            }
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireAccessoryMaterials = (accessory:Accessory) => {
        if (!this.requireMaterials(accessory.materials.get)) {
            this.alerts.push('Unknown materials for '+accessory.name);
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireArtifactMaterials = (artifact:Artifact) => {
        if (!this.requireMaterials(artifact.materials.craft)) {
            this.alerts.push('Unknown materials for '+artifact.name);
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireMaterials = (requiredMaterials: {material:string, quantity: number}[]): boolean => {
        if (requiredMaterials.length > 0) {
            for (let requiredMaterial of requiredMaterials) {
                let material = this.materials[requiredMaterial.material]
                if (!material) {
                    this.alerts.push('Material not found '+requiredMaterial.material);
                    this.alerts = [...new Set(this.alerts)];
                    continue;
                }
                if (material.zones.length > 0) {
                    for (let id of material.zones) {
                        if (!this.required_materials[id]) {
                            this.required_materials[id] = {};
                        }
                        if (!this.required_materials[id][material.id]) {
                            this.required_materials[id][material.id] = 0;
                        }
                        this.required_materials[id][material.id] += Number(requiredMaterial.quantity);
                    }
                } else {
                    this.alerts.push('Material without zones '+material.name);
                }
            }
            this.alerts = [...new Set(this.alerts)];
            return true;
        }
        return false;
    }

    cleanMaterials = () => {
        for (let zoneId of Object.keys(this.required_materials)) {
            for (let materialId of Object.keys(this.required_materials[zoneId])) {
                if (
                    this.required_materials[zoneId][materialId] <= 0 ||
                    this.required_materials[zoneId][materialId] <= this.inventory[materialId]
                ) {
                    delete this.required_materials[zoneId][materialId];
                }
            }
            if (Object.keys(this.required_materials[zoneId]).length === 0) {
                delete this.required_materials[zoneId];
            }
        }
        this.sorted_zones = []
        for (let zoneId of Object.keys(this.required_materials)) {
            if (!this.zones[zoneId]) {
                this.alerts.push('Unknown zone '+zoneId);
                this.alerts = [...new Set(this.alerts)];
                continue;
            }
            this.sorted_zones.push({
                zone_id: zoneId,
                materials: this.required_materials[zoneId]
            })
        }
        this.sorted_zones.sort((a, b) => {
            let result = Object.keys(b.materials).length - Object.keys(a.materials).length;
            if (result === 0) {
                let ZonesA = 0;
                let ZonesB = 0;
                for (let material_id of Object.keys(a.materials)) {
                    ZonesA += this.materials[material_id].zones.length;
                }
                for (let material_id of Object.keys(b.materials)) {
                    ZonesB += this.materials[material_id].zones.length;
                }
                result = Object.keys(a.materials).length / ZonesA / Object.keys(b.materials).length / ZonesB;
            }
            if (result === 0) {
                let aZone = this.zones[a.zone_id].name.toLowerCase();
                let bZone = this.zones[b.zone_id].name.toLowerCase();
                if (aZone > bZone) {
                    result = 1;
                } else if (aZone < bZone) {
                    result = -1;
                } else {
                    result = 0;
                }
            }
            return result;
        })
    }

    updateInventory = (materialId:string, quantity:number) => {
        if (quantity !== 0) {
            this.inventory[materialId] = Number(this.inventory[materialId]) + quantity;
            if (this.inventory[materialId] < 0) {
                this.inventory[materialId] = 0;
            }
        }
        this.refreshCraftables();
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    refreshCraftables = () => {
        this.required_materials = {};
        this.craftable_items = [];
        for (let item of Object.values(this.items)) {
            this.trackItem(item);
            switch (item.type) {
                case 'wayfinder':
                    this.checkCraftableWayfinder(item as Wayfinder)
                    break;
                case 'weapon':
                    this.checkCraftableWeapon(item as Weapon)
                    break;
                case 'accessory':
                    this.checkCraftableAccessory(item as Accessory)
                    break;
                case 'artifact':
                    this.checkCraftableArtifact(item as Artifact)
                    break;
                default:
                    this.alerts.push('Unexpected item type '+item.type);
            }
        }
        this.cleanMaterials();
    }

    checkCraftableWayfinder = (wayfinder:Wayfinder) => {
        let star = '<i class="bi bi-star-fill golden me-1"></i>';
        if (!wayfinder.unlocked && wayfinder.materials.unlock.length > 0) {
            let complete = true;
            for (let material of wayfinder.materials.unlock) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: wayfinder,
                    text: wayfinder.name + ' can be unlocked'
                })
            }
        } else if (!wayfinder.awakened1 && wayfinder.materials.awake1.length > 0) {
            let complete = true;
            for (let material of wayfinder.materials.awake1) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: wayfinder,
                    text: wayfinder.name + ' can be awakened to '+star
                })
            }
        } else if (!wayfinder.awakened2 && wayfinder.materials.awake2.length > 0) {
            let complete = true;
            for (let material of wayfinder.materials.awake2) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: wayfinder,
                    text: wayfinder.name + ' can be awakened to '+star+star
                })
            }
        } else if (!wayfinder.awakened3 && wayfinder.materials.awake3.length > 0) {
            let complete = true;
            for (let material of wayfinder.materials.awake3) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: wayfinder,
                    text: wayfinder.name + ' can be awakened to '+star+star+star
                })
            }
        }
    }

    checkCraftableWeapon = (weapon:Weapon) => {
        if (!weapon.unlocked && weapon.materials.unlock.length > 0) {
            let complete = true;
            for (let material of weapon.materials.unlock) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: weapon,
                    text: weapon.name + ' can be unlocked'
                })
            }
        } else if (!weapon.awakened1 && weapon.materials.awake1.length > 0) {
            let complete = true;
            for (let material of weapon.materials.awake1) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: weapon,
                    text: weapon.name + ' can be awakened to 1 stars'
                })
            }
        } else if (!weapon.awakened2 && weapon.materials.awake2.length > 0) {
            let complete = true;
            for (let material of weapon.materials.awake2) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: weapon,
                    text: weapon.name + ' can be awakened to 2 stars'
                })
            }
        } else if (!weapon.awakened3 && weapon.materials.awake3.length > 0) {
            let complete = true;
            for (let material of weapon.materials.awake3) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: weapon,
                    text: weapon.name + ' can be awakened to 3 stars'
                })
            }
        }
    }

    checkCraftableAccessory = (accessory:Accessory) => {
        if (!accessory.gotten && accessory.materials.get.length > 0) {
            let complete = true;
            for (let material of accessory.materials.get) {
                if (this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                if (accessory.is_crafted) {
                    this.craftable_items.push({
                        item: accessory,
                        text: accessory.name + ' can be unlocked'
                    })
                } else {
                    accessory.gotten = true;
                }
            }
        }
    }

    checkCraftableArtifact = (artifact:Artifact) => {
        if (!artifact.crafted && artifact.materials.craft.length > 0) {
            let complete = true;
            for (let material of artifact.materials.craft) {
                if (!this.inventory[material.material] || this.inventory[material.material] < material.quantity) {
                    complete = false
                    break;
                }
            }
            if (complete) {
                this.craftable_items.push({
                    item: artifact,
                    text: artifact.name + ' can be unlocked'
                })
            }
        }
    }

    completeItem = (item:Item) => {
        let materials;
        switch (item.type) {
            case 'wayfinder':
                materials = this.completeWayfinder(item as Wayfinder);
                break;
            case 'weapon':
                materials = this.completeWeapon(item as Weapon);
                break;
            case 'accessory':
                materials = this.completeAccessory(item as Accessory);
                break;
            case 'artifact':
                materials = this.completeArtifact(item as Artifact);
                break;
            default:
                alert('Completed unexpected type '+item.name);
                return;
        }
        for (let material of materials) {
            this.updateInventory(material.material, Number(material.quantity)*-1);
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    completeWayfinder = (wayfinder:Wayfinder) => {
        if (!wayfinder.unlocked) {
            wayfinder.unlocked = true;
            this.changedUnlocked(wayfinder);
            return wayfinder.materials.unlock;
        } else if (!wayfinder.awakened1) {
            wayfinder.awakened1 = true;
            this.changedAwakened1(wayfinder);
            return wayfinder.materials.awake1;
        } else if (!wayfinder.awakened2) {
            wayfinder.awakened2 = true;
            this.changedAwakened2(wayfinder);
            return wayfinder.materials.awake2;
        } else {
            wayfinder.awakened3 = true;
            this.changedAwakened3(wayfinder);
            return wayfinder.materials.awake3;
        }
    }

    completeWeapon = (weapon:Weapon) => {
        if (!weapon.unlocked) {
            weapon.unlocked = true;
            this.changedUnlocked(weapon);
            return weapon.materials.unlock;
        } else if (!weapon.awakened1) {
            weapon.awakened1 = true;
            this.changedAwakened1(weapon);
            return weapon.materials.awake1;
        } else if (!weapon.awakened2) {
            weapon.awakened2 = true;
            this.changedAwakened2(weapon);
            return weapon.materials.awake2;
        } else {
            weapon.awakened3 = true;
            this.changedAwakened3(weapon);
            return weapon.materials.awake3;
        }
    }

    completeAccessory = (accessory:Accessory) => {
        accessory.gotten = true;
        this.changedGotten(accessory);
        return accessory.materials.get;
    }

    completeArtifact = (artifact:Artifact) => {
        artifact.crafted = true;
        this.changedCrafted(artifact);
        return artifact.materials.craft
    }

    getBaseMaterials = (item:Item):{material:string, quantity:number}[] => {
        switch (item.type) {
            case 'wayfinder':
                return (item as Wayfinder).materials.unlock;
            case 'weapon':
                return (item as Weapon).materials.unlock;
        }
        return [];
    }

    addDataToSubmit = (id:string, level:string, index:number, quantity:number) => {
        this.dataToSubmit[id][level][index] = quantity;
    }

    sendData = () => {
        let data:{[id:string]: {[id:string]: Item}} = {};
        for (let itemId of Object.keys(this.dataToSubmit)) {
            let itemData = this.dataToSubmit[itemId];
            let item = this.items[itemId];
            for (let level of Object.keys(itemData)) {
                let hasData = false;
                let hasAllData = true;
                for (let quantity of Object.values(itemData[level])) {
                    if (quantity === 0) {
                        hasAllData = false;
                    } else {
                        hasData = true;
                    }
                }
                if (hasData) {
                    if (hasAllData) {
                        if (!data[this.items[itemId].type]) {
                            data[this.items[itemId].type] = {};
                        }
                        if (!data[this.items[itemId].type][itemId]) {
                            data[this.items[itemId].type][itemId] = item;
                        }
                        let materials = this.getBaseMaterials(item);
                        for (let i = 0;i < materials.length;i++) {
                            materials[i].quantity = itemData[level][i];
                        }
                        item.materials[level] = materials;
                    } else {
                        console.log(Object.values(itemData[level]));
                        alert('Missing data for '+this.items[itemId].name+' '+level);
                    }
                }
            }
        }
        if (Object.values(data).length === 0) {
            alert('Empty form');
        } else {
            console.log(
                btoa(JSON.stringify(data)),
                data
            );
            navigator.clipboard.writeText(btoa(JSON.stringify(data)));
            window.open('https://forms.gle/tTW52Vjcj3afuxZ38');
            this.submitData = false;
        }
    }

    nameToId = function (name:string):string {
        return name.split(' ').filter((word) => word.length > 3).join('-').toLowerCase().replace('\'s', '');
    }

    protected readonly JSON = JSON;
    protected readonly Object = Object;
    protected readonly Array = Array;
    protected readonly isNaN = isNaN;
    protected readonly Number = Number;
    protected readonly isDevMode = isDevMode;
    protected readonly String = String;
    protected readonly console = console
    protected readonly Boolean = Boolean;
    protected readonly navigator = navigator;
    protected readonly ChangeDetectorRef = ChangeDetectorRef;
}
