import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";

export interface Material {
    id:string
    name:string
    zones:string[]
    mutator: {id:string, tier:number}
}