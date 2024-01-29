import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";
import {WeaponMaterials} from "./weapon_materials";

export interface Weapon extends Item {
    materials:WeaponMaterials
    unlocked:boolean
    awakened1:boolean
    awakened2:boolean
    awakened3:boolean
}