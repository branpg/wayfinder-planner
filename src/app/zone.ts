import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";

export interface Zone {
    id:string
    name:string
    parent_zone:string|null
    type:string
}