import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader'
import * as BGU from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {GUI} from 'dat.gui'
import {CarveRing} from './CarveRing'
import {visualizer} from './visualizer'

const enviornment = new visualizer();
enviornment.controls.addEventListener('change', function(){enviornment.headlight_update()})

// Load OBJ Mesh
const loader = new OBJLoader()
loader.load("public/ring_9.obj",function(object){
    console.log(object.children[0])
    let body = object.children[0] as THREE.Mesh
    body.material = mat
    body.geometry = BGU.mergeVertices(body.geometry)
    body.geometry.computeVertexNormals()
    enviornment.scene.add(body)
})

// Add Lights
const light = new THREE.AmbientLight( 0x404040 ); // soft white light
enviornment.scene.add( light );

// const controls = new OrbitControls(enviornment.camera, enviornment.renderer.domElement)
// controls.addEventListener('change', function(){
//     ptLight.position.set(enviornment.camera.position.x, enviornment.camera.position.y, enviornment.camera.position.z)
// })

const gui = new GUI()
let mat = new THREE.MeshStandardMaterial({color: 0x00ff00})
gui.addFolder("Material")
gui.add(mat, 'metalness', 0, 1, 0.1).onChange(function(){mat.needsUpdate = true})
gui.add(mat, 'roughness', 0, 1, 0.1).onChange(function(){mat.needsUpdate = true})
gui.add(enviornment, "current", ["Perspective", "Front", "Top", "Right"]).onChange(function(){enviornment.render()})


window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    enviornment.camera.aspect = window.innerWidth / window.innerHeight
    enviornment.camera.updateProjectionMatrix()
    enviornment.renderer.setSize(window.innerWidth, window.innerHeight)
    enviornment.render()
}

const working = new CarveRing(1, .5)
working.returnFrequency()

function animate() {
    requestAnimationFrame(animate)
    enviornment.render()
}

animate()
