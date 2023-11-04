import * as THREE from 'three'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js'
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import {GUI} from 'dat.gui'
import {CarveRing} from './CarveRing'
import {visualizer} from './visualizer'
import {func} from "three/examples/jsm/nodes/shadernode/ShaderNodeBaseElements";

let bottom, top;
const environment = new visualizer();
environment.controls.addEventListener('change', function(){environment.headlight_update()})
environment.scene.background = new THREE.Color(0xFAF9F6)

// Add Lights
// const light = new THREE.AmbientLight( 0xffffff ); // soft white light
const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
environment.scene.add( light );

// const dirLight01 = new THREE.DirectionalLight( 0xffffff, 5 );
// dirLight01.position.set( 0, 200, 100 );
// dirLight01.castShadow = true;
//
// const dirLight02 = new THREE.DirectionalLight( 0xffffff, 5 );
// dirLight02.position.set( 0, 200, -100 );
// dirLight02.castShadow = true;
//
//
// environment.scene.add( dirLight01 );
// environment.scene.add( dirLight02 );

// ground

const ground: Reflector = new Reflector(
    new THREE.PlaneGeometry( 2000, 2000 ),
    {
        color: new THREE.Color(0xFAF9F6),
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
    }
)

ground.rotation.x = - Math.PI / 2;
ground.position.y = -5.5;
ground.receiveShadow = true;

const ground_blur = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({color: 0xFAF9F6, transparent:true}))

ground_blur.rotation.x = - Math.PI / 2;
ground_blur.position.y = -5.25;
ground_blur.material.opacity = 0.75;
ground_blur.material.needsUpdate = true;

environment.scene.add( ground );
environment.scene.add(ground_blur);
environment.scene.fog = new THREE.Fog( 0xcccccc, 50, 100 );

environment.renderer.toneMapping = THREE.ACESFilmicToneMapping;
environment.renderer.toneMappingExposure = 0.85;

const gui = new GUI()
// let mat = new THREE.MeshPhysicalMaterial({color: 0xFFDF00, metalness: .2, clearcoat: .75, transparent: true, side: 2})
let reflect = .75
let emi = .6
let mat = new THREE.MeshPhongMaterial({color: 0xD9B665, transparent: true, emissive: 0xD9B665, emissiveIntensity: emi, reflectivity: reflect, side: 2})
// gui.add(mat, "metalness", 0, 1).onChange(function(){mat.needsUpdate = true})
// gui.add(mat, "clearcoat", 0, 1).onChange(function(){mat.needsUpdate = true})

//const texture = new THREE.TextureLoader().load("img/grid.png")
// const texture = new THREE.TextureLoader().load('img/worldColour.5400x2700.jpg')
// mat.map = texture
// const envTexture = new THREE.CubeTextureLoader().load(["img/px_50.png", "img/nx_50.png", "img/py_50.png", "img/ny_50.png", "img/pz_50.png", "img/nz_50.png"])
const envTexture = new THREE.CubeTextureLoader().load([
    'public/px.png',
    'public/nx.png',
    'public/py.png',
    'public/ny.png',
    'public/pz.png',
    'public/nz.png'
])
envTexture.mapping = THREE.CubeReflectionMapping
mat.envMap = envTexture


// Load OBJ Meshes
let generator = function(callback=function(){}){
    const loader = new OBJLoader()
    loader.load("public/bottom_ring.obj", function (object) {
        const loader2 = new OBJLoader()
        loader2.load("public/top_ring.obj",function(object2){

            console.log(object2.children[0])
            top = object2.children[0] as THREE.Mesh
            top.material = mat
            top.geometry = BGU.mergeVertices(top.geometry)
            top.geometry.computeVertexNormals()
            top.name = "top_ring"
            environment.scene.add(top)
            const topCarve = new CarveRing(environment, envTexture, gui, top,0, 1, "top", "bottom")

            console.log(object.children[0])
            bottom = object.children[0] as THREE.Mesh
            bottom.material = mat
            bottom.geometry = BGU.mergeVertices(bottom.geometry)
            bottom.geometry.computeVertexNormals()
            bottom.name = "bottom_ring"
            environment.scene.add(bottom)
            const bottomCarve = new CarveRing(environment, envTexture, gui, bottom, .5, 1, "bottom", "top")

            gui.add(topCarve, "Frequency", .5, 2, .5).onChange(function(){
                topCarve.update()
                bottomCarve.Frequency = topCarve.Frequency
                bottomCarve.update()
            })

            gui.add(topCarve, "Phase", 0, 1, .1).onChange(function(){
                topCarve.update()
                bottomCarve.Phase = topCarve.Phase + .5;
                bottomCarve.update()
            })

            gui.add(topCarve, "Download").onChange(function(){
                bottomCarve.Download()
            })

            gui.add(topCarve, "MaterialChoice", ["Yellow Gold", "Rose Gold", "Silver"]).onChange(function(){
                topCarve.UpdateOpacity(1.0)
                bottomCarve.MaterialChoice = topCarve.MaterialChoice
                bottomCarve.UpdateOpacity(1.0)
            })

            gui.add(topCarve, "Preview").onChange(function(){
                bottomCarve.UpdateOpacity(1.0);
            })

            topCarve.update()
            bottomCarve.update()

            window.addEventListener("mousedown", (e) => {
                const raycaster = new THREE.Raycaster();
                const pointer = new THREE.Vector2();
                pointer.x = (e.clientX/window.innerWidth)*2 - 1;
                pointer.y = -(e.clientY/window.innerHeight)*2 + 1;
                raycaster.setFromCamera(pointer, environment.camera);
                const intersects = raycaster.intersectObjects([topCarve.Body, bottomCarve.Body], true);
                console.log(intersects)
                if (intersects.length > 0) {
                    if (intersects[0].object.uuid == topCarve.Body.uuid) {
                        console.log("top")
                        console.log(topCarve.Body.id)
                        console.log(intersects[0].object.id)
                        console.log("")
                        bottomCarve.UpdateOpacity(0.25);
                        topCarve.UpdateOpacity(1.0);
                    } else if (intersects[0].object.uuid == bottomCarve.Body.uuid) {
                        console.log("bottom")
                        console.log(bottomCarve.Body.uuid)
                        console.log(intersects[0].object.uuid)
                        console.log("")
                        topCarve.UpdateOpacity(0.25);
                        bottomCarve.UpdateOpacity(1.0);
                    }
                }
            });
        })
    })
    callback()
}

generator()

// let load_2 = function(){
//     const loader2 = new OBJLoader()
//     loader2.load("public/top_ring.obj",function(object){
//         console.log(object.children[0])
//         top = object.children[0] as THREE.Mesh
//         top.material = mat
//         top.geometry = BGU.mergeVertices(top.geometry)
//         top.geometry.computeVertexNormals()
//         top.name = "top_ring"
//         environment.scene.add(top)
//         const topCarve = new CarveRing(environment, gui, top,0, .5, "bottom")
//         // topCarve.create_lines()
//         // topCarve.applyHatch()
//     })
// }

// generator(load_2)

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