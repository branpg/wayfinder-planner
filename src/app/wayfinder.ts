import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";

export interface Wayfinder extends Item {
    materials:WayfinderMaterials
    unlocked:boolean
    awakened1:boolean
    awakened2:boolean
    awakened3:boolean
}