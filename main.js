import * as THREE from 'three';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';


//Scene
const scene = new THREE.Scene();

// Sphere
const geometry = new THREE.SphereGeometry(3, 64,64);
// const material = new THREE.MeshLambertMaterial( { color: "rgb(100, 100, 0)" } );
const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
scene.add(mesh);

//Sizes
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//Camera
const camera = new THREE.PerspectiveCamera(50, sizes.width/sizes.height);
camera.position.z = 20;
scene.add(camera);

//Light
let pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set( 50, 50, 50 );
scene.add( pointLight );
//
// let light = new THREE.AmbientLight( 0x404040 ); // soft white light
// scene.add( light );

//Renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setClearColor( new THREE.Color("rgb(245, 245, 245)") );

let controls = new OrbitControls(camera, renderer.domElement)

function animate() {
    renderer.setSize(sizes.width, sizes.height);
    renderer.render(scene, camera);
}

animate();