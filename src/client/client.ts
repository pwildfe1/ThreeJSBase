import * as THREE from 'three'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js'
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {GUI} from 'dat.gui'
import {CarveRing} from './CarveRing'
import {visualizer} from './visualizer'

let bottom, top;
const environment = new visualizer();
environment.controls.addEventListener('change', function(){environment.headlight_update()})
environment.scene.background = new THREE.Color(0xFAF9F6)

// Add Lights
const light = new THREE.AmbientLight( 0xffffff ); // soft white light
environment.scene.add( light );

environment.renderer.toneMapping = THREE.ACESFilmicToneMapping;
environment.renderer.toneMappingExposure = 0.85;

const gui = new GUI()
let mat = new THREE.MeshPhysicalMaterial({color: 0xFFDF00})

// Load OBJ Meshes
let generator = function(callback=function(){}){
    const loader = new OBJLoader()
    loader.load("public/bottom_ring.obj", function (object) {
        console.log(object.children[0])
        bottom = object.children[0] as THREE.Mesh
        bottom.material = mat
        bottom.geometry = BGU.mergeVertices(bottom.geometry)
        bottom.geometry.computeVertexNormals()
        bottom.name = "bottom_ring"
        environment.scene.add(bottom)
        const bottomCarve = new CarveRing(environment, gui, bottom, 1, .5, "top")
        bottomCarve.create_lines()
        bottomCarve.applyHatch()
    })
    callback()
}

let load_2 = function(){
    const loader2 = new OBJLoader()
    loader2.load("public/top_ring.obj",function(object){
        console.log(object.children[0])
        top = object.children[0] as THREE.Mesh
        top.material = mat
        top.geometry = BGU.mergeVertices(top.geometry)
        top.geometry.computeVertexNormals()
        top.name = "top_ring"
        environment.scene.add(top)
        const topCarve = new CarveRing(environment, gui, top,1, .5, "bottom")
        topCarve.create_lines()
        topCarve.applyHatch()
    })
}

generator(load_2)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    environment.camera.aspect = window.innerWidth / window.innerHeight
    environment.camera.updateProjectionMatrix()
    environment.renderer.setSize(window.innerWidth, window.innerHeight)
    environment.render()
}

function animate(){
    requestAnimationFrame(animate)
    environment.render()
}

animate()