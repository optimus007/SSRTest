import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { TransformControls } from "three/examples/jsm/controls/TransformControls"
import { GUI } from "lil-gui"
import {
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing"
import { SSREffect } from "screen-space-reflections"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader"
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  EquirectangularReflectionMapping,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PointLight,
  Scene,
  SphereBufferGeometry,
  WebGLRenderer,
} from "three"

const params = {
  useComposer: false,
  addTransformControls: false,
  useSelection: false,
  selectionFloor: false,
  selectionObjects: false,
  useHDRI: false,
}

const hdriLoader = new RGBELoader()
let floor, hdri
const objects = []

const renderer = new WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.toneMapping = ACESFilmicToneMapping

const scene = new Scene()
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 3, -8)

const controls = new OrbitControls(camera, renderer.domElement)
controls.update()

const point = new PointLight()
point.position.set(1, 2, 1)
scene.add(point)


// COMPOSER 
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
// SSR
const ssrEffect = new SSREffect(scene, camera)
const ssrPass = new EffectPass(camera, ssrEffect)
composer.addPass(ssrPass)

// Transform con
const transformcontrols = new TransformControls(camera, renderer.domElement)
transformcontrols.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value
})



function animate() {
  requestAnimationFrame(animate)

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  if (params.useComposer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}
function addCubes() {
  for (let index = 0; index < 10; index++) {
    const geometry =
      Math.random() > 0.5
        ? new BoxGeometry(1, 1, 1)
        : new SphereBufferGeometry(0.5)
    const material = new MeshStandardMaterial({ color: 0xffffff, roughness: 0 })
    material.color.setHSL(Math.random(), 0.6, 0.6)
    const mesh = new Mesh(geometry, material)
    mesh.position.x = MathUtils.randFloat(-5, 5)
    mesh.position.z = MathUtils.randFloat(-5, 5)
    mesh.position.y = 1
    scene.add(mesh)
    // sel.add(cube)
    transformcontrols.attach(mesh)
    objects.push(mesh)
  }
}
function addFloor() {
  const geometry = new PlaneBufferGeometry(10, 10)
  geometry.rotateX(-Math.PI / 2)
  const material = new MeshStandardMaterial({
    color: 0x70cf89,
    roughness: 0,
    metalness: 0,
  })
  material.color.setHSL(Math.random(), 0.6, 0.6)
  const plane = new Mesh(geometry, material)
  scene.add(plane)
  floor = plane
}
function addGui() {
  const gui = new GUI({ title: 'SSR 2.5.0' })

  gui.add(params, "useComposer").name('Composer + SSR')
  gui.add(params, "useHDRI").onChange((v) => {
    useHDRI(v)
  })
  gui.add(params, "addTransformControls").onChange((v) => {
    if (v) {
      scene.add(transformcontrols)
    } else {
      scene.remove(transformcontrols)
    }
  })

  gui.add(params, "selectionFloor").onChange((v) => {
    if (v) {
      ssrEffect.selection.add(floor)
    } else {
      ssrEffect.selection.delete(floor)
    }
  })
  gui.add(params, "selectionObjects").onChange((v) => {
    for (const obj of objects) {
      if (v) {
        ssrEffect.selection.add(obj)
      } else {
        ssrEffect.selection.delete(obj)
      }
    }
  })

  scene.environment = hdri
  scene.background = hdri
}
async function useHDRI(state) {
  if (!hdri) {
    hdri = await hdriLoader.loadAsync(
      "https://threejs.org/examples/textures/equirectangular/blouberg_sunrise_2_1k.hdr"
    )
    hdri.mapping = EquirectangularReflectionMapping
  }

  scene.environment = state ? hdri : null
  scene.background = state ? hdri : null
}
window.onresize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

addCubes()
addFloor()
addGui()
animate()