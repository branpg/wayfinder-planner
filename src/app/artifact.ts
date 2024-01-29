import {Item} from "./item";
import {WayfinderMaterials} from "./wayfinder_materials";
import {WeaponMaterials} from "./weapon_materials";
import {AccessoryMaterials} from "./accessory_materials";
import {ArtifactMaterials} from "./artifact_materials";

export interface Artifact extends Item {
    materials:ArtifactMaterials
    crafted:boolean
}