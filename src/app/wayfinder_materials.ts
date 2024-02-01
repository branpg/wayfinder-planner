import {Materials} from "./materials";

export interface WayfinderMaterials extends Materials {
    unlock:{material:string, quantity:number}[]
    awake1:{material:string, quantity:number}[]
    awake2:{material:string, quantity:number}[]
    awake3:{material:string, quantity:number}[]
}