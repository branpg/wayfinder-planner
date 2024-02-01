import {Materials} from "./materials";

export interface Item {
    id:string
    type:string
    name:string
    is_crafted:boolean
    is_tracked:boolean
    materials: Materials
}