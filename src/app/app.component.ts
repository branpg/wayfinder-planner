import {Component} from '@angular/core';
import {Wayfinder} from './wayfinder';
import {HttpClient} from "@angular/common/http";
import {Material} from "./material";
import {Zone} from "./zone";
import {Mutator} from "./mutator";
import {Item} from "./item";
import {Weapon} from "./weapon";
import {Accessory} from "./accessory";
import {AccessoryMaterials} from "./accessory_materials";
import {Artifact} from "./artifact";

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

    constructor(
        private http: HttpClient
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

    loadMaterials = () => this.http.get<Material[]>('assets/data/materials.json').forEach(value => {
        for (let material of value) {
            this.materials[material.id] = material;
            if (!this.inventory[material.id]) {
                this.inventory[material.id] = 0;
            }
        }
    })

    loadMutators = () => this.http.get<Mutator[]>('assets/data/mutators.json').forEach(value => {
        for (let mutator of value) {
            this.mutators[mutator.id] = mutator;
        }
    })

    loadHunts = () => this.http.get<Zone[]>('assets/data/hunts.json').forEach(value => {
        for (let zone of value) {
            zone.type = 'hunt';
            this.zones[zone.id] = zone;
        }
    })

    loadExpeditions = () => this.http.get<Zone[]>('assets/data/expeditions.json').forEach(value => {
        for (let zone of value) {
            zone.type = 'expedition';
            this.zones[zone.id] = zone;
        }
    })

    loadHighlands = () => this.http.get<Zone[]>('assets/data/highlands.json').forEach(value => {
        for (let zone of value) {
            zone.type = 'highlands';
            this.zones[zone.id] = zone;
        }
    })

    loadWayfinders = () => this.http.get<Wayfinder[]>('assets/data/wayfinders.json').forEach(value => {
        this.wayfinders = value
        for (let wayfinder of this.wayfinders) {
            wayfinder.type = 'wayfinder'
            wayfinder.is_crafted = true
            this.items[wayfinder.id] = wayfinder;
        }
    })

    loadWeapons = () => this.http.get<Weapon[]>('assets/data/weapons.json').forEach(value => {
        this.weapons = value
        for (let weapon of this.weapons) {
            weapon.type = 'weapon'
            weapon.is_crafted = true
            this.items[weapon.id] = weapon;
        }
    })

    loadAccessories = () => this.http.get<Accessory[]>('assets/data/accessories.json').forEach(value => {
        this.accessories = value
        for (let accessory of this.accessories) {
            accessory.type = 'accessory'
            this.items[accessory.id] = accessory;
        }
    })

    loadArtifacts = () => this.http.get<Artifact[]>('assets/data/artifacts.json').forEach(value => {
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
                default:
                    this.alerts.push('Tracking an item of type '+item.type);
            }
            this.alerts = [...new Set(this.alerts)];
        }
        this.cleanMaterials();
    }

    requireWayfinderMaterials = (wayfinder:Wayfinder) => {
        if (!this.requireMaterials(wayfinder.materials.unlock)) {
            this.alerts.push('Unknown materials for '+wayfinder.name+' unlock');
        }
        if (!this.requireMaterials(wayfinder.materials.awake1)) {
            this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 1');
        }
        if (!this.requireMaterials(wayfinder.materials.awake2)) {
            this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 2');
        }
        if (!this.requireMaterials(wayfinder.materials.awake3)) {
            this.alerts.push('Unknown materials for '+wayfinder.name+' awakening 3');
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireWeaponMaterials = (weapon:Weapon) => {
        if (!this.requireMaterials(weapon.materials.unlock)) {
            this.alerts.push('Unknown materials for '+weapon.name+' unlock');
        }
        if (!this.requireMaterials(weapon.materials.awake1)) {
            this.alerts.push('Unknown materials for '+weapon.name+' awakening 1');
        }
        if (!this.requireMaterials(weapon.materials.awake2)) {
            this.alerts.push('Unknown materials for '+weapon.name+' awakening 2');
        }
        if (!this.requireMaterials(weapon.materials.awake3)) {
            this.alerts.push('Unknown materials for '+weapon.name+' awakening 3');
        }
        this.alerts = [...new Set(this.alerts)];
    }

    requireAccessoryMaterials = (accessory:Accessory) => {
        if (!this.requireMaterials(accessory.materials.get)) {
            this.alerts.push('Unknown materials for '+accessory.name+' unlock');
        }
        this.alerts = [...new Set(this.alerts)];
    }

    refreshTracking = () => {
        this.required_materials = {};
        for(let wayfinder of this.wayfinders) {
            this.trackItem(wayfinder);
        }
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
                        this.required_materials[id][material.id] += requiredMaterial.quantity;
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
        this.sorted_zones.sort((a, b) => Object.keys(b.materials).length - Object.keys(a.materials).length)
    }

    updateInventory = (materialId:string, quantity:number) => {
        if (quantity !== 0) {
            this.inventory[materialId] += quantity;
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
        }
        if (!wayfinder.awakened1 && wayfinder.materials.awake1.length > 0) {
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
                    text: wayfinder.name + ' can be awakened to 1 stars'
                })
            }
        }
        if (!wayfinder.awakened2 && wayfinder.materials.awake2.length > 0) {
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
                    text: wayfinder.name + ' can be awakened to 2 stars'
                })
            }
        }
        if (!wayfinder.awakened3 && wayfinder.materials.awake3.length > 0) {
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
                    text: wayfinder.name + ' can be awakened to 3 stars'
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
        }
        if (!weapon.awakened1 && weapon.materials.awake1.length > 0) {
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
        }
        if (!weapon.awakened2 && weapon.materials.awake2.length > 0) {
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
        }
        if (!weapon.awakened3 && weapon.materials.awake3.length > 0) {
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
                if (this.inventory[material.material] < material.quantity) {
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
        switch (item.type) {
            case 'wayfinder':
                this.completeWayfinder(item as Wayfinder);
                break;
            case 'weapon':
                this.completeWeapon(item as Weapon);
                break;
        }
        localStorage.setItem('completed', JSON.stringify(this.completed));
        this.refreshCraftables();
    }

    completeWayfinder = (wayfinder:Wayfinder) => {
        if (!wayfinder.unlocked) {
            wayfinder.unlocked = true;
        } else if (!wayfinder.awakened1) {
            wayfinder.awakened1 = true;
        } else if (!wayfinder.awakened2) {
            wayfinder.awakened2 = true;
        } else if (!wayfinder.awakened3) {
            wayfinder.awakened3 = true;
        }
    }

    completeWeapon = (weapon:Weapon) => {
        if (!weapon.unlocked) {
            weapon.unlocked = true;
        } else if (!weapon.awakened1) {
            weapon.awakened1 = true;
        } else if (!weapon.awakened2) {
            weapon.awakened2 = true;
        } else if (!weapon.awakened3) {
            weapon.awakened3 = true;
        }
    }

    protected readonly JSON = JSON;
    protected readonly Object = Object;
    protected readonly Array = Array;
}
