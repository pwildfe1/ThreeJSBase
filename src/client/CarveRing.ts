import * as THREE from "three";
import {visualizer} from "./visualizer";
import * as BGU from "three/examples/jsm/utils/BufferGeometryUtils";
import {GUI} from "dat.gui";
import {BufferAttribute, InterleavedBufferAttribute} from "three";

export class CarveRing {

    Scene: visualizer
    Body: THREE.Mesh
    Phase: number
    Frequency: number
    Radius: number
    Height: number
    Vertices: BufferAttribute|InterleavedBufferAttribute
    OriginalVertices: BufferAttribute|InterleavedBufferAttribute
    Normals: BufferAttribute|InterleavedBufferAttribute
    Attractors: Array<Array<THREE.Vector3>>
    Name: string
    BottomY: number
    TopY: number
    gui: GUI

    constructor(environment : visualizer, gui: GUI, body : THREE.Mesh, phase: number, freq: number, name: string){

        this.Body = body
        this.Scene = environment
        this.Frequency = freq
        this.Phase = phase
        this.gui = gui
        this.Name = name

        this.Radius = 0
        this.Height = 0
        this.TopY = 0
        this.BottomY = 0

        this.Vertices = this.Body.geometry.attributes.position
        this.Normals = new THREE.BufferAttribute(this.Body.geometry.attributes.normal.array, this.Body.geometry.attributes.normal.itemSize, true)
        this.OriginalVertices = new THREE.BufferAttribute(this.Vertices.array, this.Vertices.itemSize, false)
        this.Attractors = []
        this.create_lines()

        let dimensions = this.calculateDimensions()
        this.Radius = dimensions[0]/2
        this.Height = dimensions[1]

        this.construct_gui()

        // let p = new THREE.PlaneGeometry(10, 10, 10)
        // this.Vertices = p.attributes.position

    }

    construct_gui() : void{

        let view = this
        let folder = view.gui.addFolder(this.Name)
        folder.add(this, "Phase", 0, .5, .01).onChange(function(){view.updateBody()})
        folder.add(this, "Frequency", .5, 4, .5).onChange(function(){view.updateBody()})

        let material_folder = folder.addFolder("Material")
        // material_folder.add(this.Body.material, "metalness", 0, 1)

    }

    updateBody() : void {

        for (let i = 0; i < this.Vertices.count; i++){
            this.Vertices.setX(i, this.OriginalVertices.getX(i))
            this.Vertices.setY(i, this.OriginalVertices.getY(i))
            this.Vertices.setZ(i, this.OriginalVertices.getZ(i))
        }

        this.Vertices.needsUpdate = true
        this.Body.geometry.computeVertexNormals()

        this.create_lines()
        this.applyHatch()

    }

    calculateDimensions() : number[] {
        let maximumX = -1000
        let minimumX = 1000
        let maximumY = -1000
        let minimumY = 1000
        for(let i = 0; i < this.OriginalVertices.count; i++){
            let v = new THREE.Vector3(this.OriginalVertices.getX(i), this.OriginalVertices.getY(i), this.OriginalVertices.getZ(i))
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

        for(let i = 0; i < resoU; i++){
            let pts = []
            let r = this.Radius + .25
            let x = r * Math.cos(i/resoU * 2 * Math.PI)
            let z = r * Math.sin(i/resoU * 2 * Math.PI)
            let line_length = this.Height * .75 * Math.sin(i/resoU * 2 * Math.PI * this.Frequency + this.Phase * Math.PI)
            let offset = 1
            for(let j = 0; j < att_reso; j++){
                pts.push(new THREE.Vector3(x, j/(att_reso - 1)  * Math.abs(line_length - offset) + Math.abs(offset) + this.BottomY , z))
                // } else if(view.top_line === true){
                //     pts.push(new THREE.Vector3(x, view.app.height - j / (att_reso - 1) * Math.abs(line_length - offset) + Math.abs(offset), z))
                // } else {
                //     pts.push(new THREE.Vector3(x, j / (att_reso - 1) * line_length + (view.app.height / 2 - line_length / 2), z))
                // }
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

        for(let i = 0; i < this.Vertices.count; i++){
            let min_dist = this.Radius
            let v = new THREE.Vector3(this.OriginalVertices.getX(i), this.OriginalVertices.getY(i), this.OriginalVertices.getZ(i))
            for (let j = 0; j < attPts.length; j++) {
                let distance = attPts[j].distanceTo(v)
                if (distance < min_dist) min_dist = distance
            }
            if (min_dist < threshold) {
                let n = new THREE.Vector3(this.Normals.getX(i), this.Normals.getY(i), this.Normals.getZ(i))
                n = n.normalize()
                let factor = (1 - min_dist / threshold) * depth
                this.Vertices.setX(i, v.x - n.x * factor)
                this.Vertices.setY(i, v.y - n.y * factor)
                this.Vertices.setZ(i, v.z - n.z * factor)
            }
        }

        this.Vertices.needsUpdate = true
        this.Body.geometry.computeVertexNormals()
    }

}