import {Materials} from "./materials";

export interface AccessoryMaterials extends Materials {
    get:{material:string, quantity:number}[]
}