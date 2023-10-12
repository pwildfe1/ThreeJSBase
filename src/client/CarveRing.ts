import * as THREE from "three";
import {visualizer} from "./visualizer";
import * as BGU from "three/examples/jsm/utils/BufferGeometryUtils";
import {GUI} from "dat.gui";
import {BufferAttribute, InterleavedBufferAttribute} from "three";

export class CarveRing {

    Visualizer: visualizer
    Body: THREE.Mesh
    Baseline: string
    Phase: number
    Frequency: number
    Radius: number
    Height: number
    OriginalVertices: Array<THREE.Vector3>
    Normals: Array<THREE.Vector3>
    Attractors: Array<Array<THREE.Vector3>>
    Name: string
    BottomY: number
    TopY: number
    gui: GUI

    constructor(environment : visualizer, gui: GUI, body : THREE.Mesh, phase: number, freq: number, name: string, baseline:string){

        this.Body = body
        this.Visualizer = environment
        this.Frequency = freq
        this.Phase = phase
        this.gui = gui
        this.Name = name
        this.Baseline = baseline

        this.Radius = 0
        this.Height = 0
        this.TopY = 0
        this.BottomY = 0

        let normals = new THREE.BufferAttribute(this.Body.geometry.attributes.normal.array, this.Body.geometry.attributes.normal.itemSize, true)
        this.Normals = []
        for (let i = 0; i < normals.count; i++){
            this.Normals.push(new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i)))
        }

        this.OriginalVertices = []
        for (let i = 0; i < this.Body.geometry.attributes.position.count; i++){
            this.OriginalVertices.push(new THREE.Vector3(this.Body.geometry.attributes.position.getX(i), this.Body.geometry.attributes.position.getY(i), this.Body.geometry.attributes.position.getZ(i)))
        }

        this.Attractors = []
        this.create_lines()

        let dimensions = this.calculateDimensions()
        this.Radius = dimensions[0]/2
        this.Height = dimensions[1]

        // this.construct_gui()
        // let p = new THREE.PlaneGeometry(10, 10, 10)
        // this.Vertices = p.attributes.position

    }

    // construct_gui() : void{
    //
    //     let view = this
    //     let folder = view.gui.addFolder(this.Name)
    //     // folder.add(view, "Phase", 0, .5, .01).onChange(function(){view.updateBody()})
    //     folder.add(this, "Frequency", .5, 4, .5).onChange(function(){view.update()})
    //
    //     // let material_folder = folder.addFolder("Material")
    //     // material_folder.add(this.Body.material, "")
    //
    // }


    update() : void {

        this.create_lines()
        this.applyHatch()

    }

    calculateDimensions() : number[] {
        let maximumX = -1000
        let minimumX = 1000
        let maximumY = -1000
        let minimumY = 1000
        for(let i = 0; i < this.OriginalVertices.length; i++){
            let v = this.OriginalVertices[i]
            if (v.x > maximumX) { maximumX = v.x}
            if (v.x < minimumX) { minimumX = v.x}
            if (v.y > maximumY && v.x < 0) { maximumY = v.y}
            if (v.y < minimumY && v.x < 0) { minimumY = v.y}
        }
        this.TopY = maximumY
        this.BottomY = minimumY
        return [maximumX - minimumX, maximumY - minimumY]
    }


    create_lines() : void {
        let resoU = Math.floor(2 * Math.PI * this.Radius/1.5)
        let att_reso = 20

        for(let i = 0; i < this.OriginalVertices.length; i++){
            let v = new THREE.Vector3(this.OriginalVertices[i].x, this.OriginalVertices[i].y, this.OriginalVertices[i].z)
            this.Body.geometry.attributes.position.setX(i, v.x)
            this.Body.geometry.attributes.position.setY(i, v.y)
            this.Body.geometry.attributes.position.setZ(i, v.z)
        }

        this.Body.geometry.attributes.position.needsUpdate = true
        this.Body.geometry.computeVertexNormals()

        this.Attractors = []

        for(let i = 0; i < resoU; i++){
            let pts = []
            let r = this.Radius + .25
            let x = r * Math.cos(i/resoU * 2 * Math.PI)
            let z = r * Math.sin(i/resoU * 2 * Math.PI)
            let line_length = this.Height * .75 * Math.sin(i/resoU * 2 * Math.PI * this.Frequency + this.Phase * Math.PI)
            let offset = 1
            for(let j = 0; j < att_reso; j++){
                if (this.Baseline == "bottom") {
                    pts.push(new THREE.Vector3(x, j / (att_reso - 1) * Math.abs(line_length - offset) + Math.abs(offset) + this.BottomY, z))
                } else if (this.Baseline == "top"){
                    pts.push(new THREE.Vector3(x, this.TopY - j / (att_reso - 1) * Math.abs(line_length - offset) + Math.abs(offset), z))
                } else {
                    pts.push(new THREE.Vector3(x, j / (att_reso - 1) * line_length + (this.Height / 2 - line_length / 2), z))
                }
            }
            this.Attractors.push(pts)
        }
    }

    applyHatch(threshold = .75, depth = .75) : void {

        let attPts = []
        for(let i = 0; i < this.Attractors.length; i++) {
            for(let j = 0; j < this.Attractors[i].length; j++) {
                attPts.push(this.Attractors[i][j])
            }
        }

        for(let i = 0; i < this.OriginalVertices.length; i++){
            let min_dist = this.Radius
            let v = new THREE.Vector3(this.OriginalVertices[i].x, this.OriginalVertices[i].y, this.OriginalVertices[i].z)
            for (let j = 0; j < attPts.length; j++) {
                let distance = attPts[j].distanceTo(v)
                if (distance < min_dist) min_dist = distance
            }
            if (min_dist < threshold) {
                let n = this.Normals[i]
                n = n.normalize()
                let factor = (1 - min_dist / threshold) * depth
                let pt= new THREE.Vector3(v.x - n.x * factor, v.y - n.y * factor, v.z - n.z * factor)
                this.Body.geometry.attributes.position.setX(i, pt.x)
                this.Body.geometry.attributes.position.setY(i, pt.y)
                this.Body.geometry.attributes.position.setZ(i, pt.z)
            }
        }

        this.Body.geometry.attributes.position.needsUpdate = true
        this.Body.geometry.computeVertexNormals()

    }

}