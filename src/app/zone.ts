import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";

export interface Zone {
    id:string
    name:string
    type:string
    accepts_mutators:boolean
}