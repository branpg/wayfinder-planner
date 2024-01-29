import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";
import {WeaponMaterials} from "./weapon_materials";
import {AccessoryMaterials} from "./accessory_materials";

export interface Accessory extends Item {
    materials:AccessoryMaterials
    gotten:boolean
}