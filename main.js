import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { GUI } from 'lil-gui'
import { EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { SSREffect } from "screen-space-reflections"

const params = {
  useComposer: false,
  addTransformControls: false
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const ssrEffect = new SSREffect(scene, camera)
const ssrPass = new EffectPass(camera, ssrEffect)
composer.addPass(ssrPass)

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const point = new THREE.PointLight()
point.position.set(1, 1, 1)
scene.add(point);

const transformcontrols = new TransformControls(camera, renderer.domElement)
transformcontrols.addEventListener('dragging-changed', function (event) {

  controls.enabled = !event.value;

});
transformcontrols.attach(cube)
addFloor()

camera.position.set(0, 1, -5)
controls.update()

addGui()

function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  if (params.useComposer) {
    composer.render()
  } else {
    renderer.render(scene, camera);
  }

};

animate();


function addFloor() {
  const geometry = new THREE.PlaneBufferGeometry(10, 10)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0, metalness: 0 })
  const plane = new THREE.Mesh(geometry, material)
  scene.add(plane)
}

function initComposer() {
  composer.addPass(new RenderPass(scene, camera))
  addSSREFFECT()
}

function addGui() {
  const gui = new GUI()
  gui.add(params, "useComposer")
  gui.add(params, "addTransformControls").onChange((v) => {

    if (v) {
      scene.add(transformcontrols)
    }
    else {
      scene.remove(transformcontrols)
    }
  })
}