import {Materials} from "./materials";

export interface ArtifactMaterials extends Materials {
    craft:{material:string, quantity:number}[]
}