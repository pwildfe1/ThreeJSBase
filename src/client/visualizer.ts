import * as THREE from "three";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GUI} from "dat.gui";

export class visualizer {

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    camera_front: THREE.OrthographicCamera;
    camera_top: THREE.OrthographicCamera;
    camera_right: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    canvas: HTMLCanvasElement;
    headlight: THREE.PointLight;
    controls: OrbitControls;
    radius: number;
    angle: number;
    resoX: number;
    resoY: number;
    current: string;

    constructor(CanvasId = "", attach_light = true, radius = 40){
        this.scene = new THREE.Scene();
        this.camera_front = new THREE.OrthographicCamera(-20, 20, 20, -20, .1, 200)
        this.camera_front.position.set(30, 0, 0)
        this.camera_front.lookAt(new THREE.Vector3())
        this.camera_top = new THREE.OrthographicCamera(-20, 20, 20, -20, .1, 200)
        this.camera_top.position.set(0, 30, 0)
        this.camera_top.lookAt(new THREE.Vector3())
        this.camera_right = new THREE.OrthographicCamera(-20, 20, 20, -20, .1, 200)
        this.camera_right.position.set(0, 0, 30)
        this.camera_right.lookAt(new THREE.Vector3())

        this.radius = radius;
        this.angle = .125;

        if (CanvasId != "") {
            this.canvas = document.getElementById(CanvasId) as HTMLCanvasElement
            this.renderer = new THREE.WebGLRenderer({canvas:this.canvas})
            this.resoX = this.canvas.width
            this.resoY = this.canvas.height
        }else{
            this.renderer = new THREE.WebGLRenderer()
            this.resoX = window.innerWidth
            this.resoY = window.innerHeight
            this.renderer.setSize(this.resoX, this.resoY)
            document.body.appendChild(this.renderer.domElement)
            this.canvas = this.renderer.domElement
        }

        this.camera = new THREE.PerspectiveCamera(
            50,
            this.resoX / this.resoY,
            0.1,
            1000
        )

        this.camera.position.set(this.radius * Math.cos(this.angle * 2 * Math.PI), this.radius/3, this.radius * Math.cos(this.angle * 2 * Math.PI))
        this.camera.lookAt(new THREE.Vector3())
        this.current = "Perspective"

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.headlight = new THREE.PointLight(0xffffff, 1000, 100)

        if (attach_light){
            this.headlight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z)
            this.scene.add(this.headlight)
        }

        let view = this
        // const gui = new GUI()
        // gui.add(this, "current", ["Perspective", "Front", "Top", "Right"]).onChange(function(){view.render()})

        window.addEventListener('resize', onWindowResize, false)
        function onWindowResize() {
            view.camera.aspect = window.innerWidth / window.innerHeight
            view.camera.updateProjectionMatrix()
            view.renderer.setSize(window.innerWidth, window.innerHeight)
            view.render()
        }

    }

    headlight_update() : void{
        this.headlight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    }

    render() : void{
        if (this.current == "Perspective") {
            this.renderer.render(this.scene, this.camera)
        } else if(this.current == "Front"){
            this.renderer.render(this.scene, this.camera_front)
        } else if(this.current == "Right"){
            this.renderer.render(this.scene, this.camera_right)
        } else {
            this.renderer.render(this.scene, this.camera_top)
        }
    }

}