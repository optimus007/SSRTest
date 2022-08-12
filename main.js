import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { TransformControls } from "three/examples/jsm/controls/TransformControls"
import { GUI } from "lil-gui"
import { EffectComposer, EffectPass, RenderPass } from "postprocessing"
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

const SSR_PARAMS = {
  intensity: 1,
  exponent: 1,
  distance: 10,
  fade: 0,
  roughnessFade: 1,
  thickness: 10,
  ior: 1.45,
  maxRoughness: 1,
  maxDepthDifference: 10,
  blend: 0.9,
  correction: 1,
  correctionRadius: 1,
  blur: 0.5,
  blurKernel: 1,
  blurSharpness: 10,
  jitter: 0,
  jitterRoughness: 0,
  steps: 20,
  refineSteps: 5,
  missedRays: true,
  useNormalMap: true,
  useRoughnessMap: true,
  resolutionScale: 1,
  velocityResolutionScale: 1,
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
transformcontrols.enabled = false
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
  const gui = new GUI({ title: "SSR 2.5.0" })

  gui.add(params, "useComposer").name("Composer + SSR")
  gui.add(params, "useHDRI").onChange((v) => {
    useHDRI(v)
  })
  gui.add(params, "addTransformControls").onChange((v) => {
    if (v) {
      scene.add(transformcontrols)
      transformcontrols.enabled = true
    } else {
      scene.remove(transformcontrols)
      transformcontrols.enabled = false
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

  addSSRGui(gui)
}

function addSSRGui(gui) {
  const params = SSR_PARAMS
  const f = gui.addFolder("SSR")
  f.close()

  const generalFolder = f.addFolder("General")
  generalFolder.close()

  generalFolder.add(params, "intensity", 0, 3, 0.01).onChange((v) => {
    ssrEffect["intensity"] = v
  })
  generalFolder.add(params, "exponent", 0.125, 8, 0.125).onChange((v) => {
    ssrEffect["exponent"] = v
  })
  generalFolder.add(params, "distance", 0.001, 10, 0.1).onChange((v) => {
    ssrEffect["distance"] = v
  })
  generalFolder.add(params, "fade", 0, 20, 0.01).onChange((v) => {
    ssrEffect["fade"] = v
  })
  generalFolder.add(params, "roughnessFade", 0, 1, 0.01).onChange((v) => {
    ssrEffect["roughnessFade"] = v
  })

  generalFolder.add(params, "thickness", 0, 10).onChange((v) => {
    ssrEffect["thickness"] = v
  })
  generalFolder.add(params, "ior", 1, 2.33333).onChange((v) => {
    ssrEffect["ior"] = v
  })



  const maximumValuesFolder = f.addFolder("Maximum Values")
  maximumValuesFolder.close()

  maximumValuesFolder.add(params, "maxRoughness", 0, 1, 0.01).onChange((v) => {
    ssrEffect["maxRoughness"] = v
  })
  maximumValuesFolder
    .add(params, "maxDepthDifference", 0, 100, 0.1)
    .onChange((v) => {
      ssrEffect["maxDepthDifference"] = v
    })

  const temporalResolveFolder = f.addFolder("Temporal Resolve")
  temporalResolveFolder.close()
  temporalResolveFolder.add(params, "blend", 0, 1, 0.001).onChange((v) => {
    ssrEffect["blend"] = v
  })
  temporalResolveFolder.add(params, "correction", 0, 1, 0.0001).onChange((v) => {
    ssrEffect["correction"] = v
  })
  temporalResolveFolder.add(params, "correctionRadius", 1, 4, 1).onChange((v) => {
    ssrEffect["correctionRadius"] = v
  })

  const blurFolder = f.addFolder("Blur")
  blurFolder.close()
  blurFolder.add(params, "blur", 0, 1, 0.01).onChange((v) => {
    ssrEffect["blur"] = v
  })
  blurFolder.add(params, "blurKernel", 0, 5, 1).onChange((v) => {
    ssrEffect["blurKernel"] = v
  })
  blurFolder.add(params, "blurSharpness", 0, 100, 1).onChange((v) => {
    ssrEffect["blurSharpness"] = v
  })

  const jitterFolder = f.addFolder("Jitter")
  jitterFolder.close()
  jitterFolder.add(params, "jitter", 0, 4, 0.01).onChange((v) => {
    ssrEffect["jitter"] = v
  })
  jitterFolder.add(params, "jitterRoughness", 0, 4, 0.01).onChange((v) => {
    ssrEffect["jitterRoughness"] = v
  })

  const definesFolder = f.addFolder("Tracing")
  definesFolder.close()
  definesFolder.add(params, "steps", 1, 256, 1).onChange((v) => {
    ssrEffect["steps"] = v
  })
  definesFolder.add(params, "refineSteps", 0, 16, 1).onChange((v) => {
    ssrEffect["refineSteps"] = v
  })
  definesFolder.add(params, "missedRays").onChange((v) => {
    ssrEffect["missedRays"] = v
  })

  const resolutionFolder = f.addFolder("Resolution")
  resolutionFolder.close()
  resolutionFolder.add(params, "resolutionScale", 0.125, 1, 0.125).onChange((v) => {
    ssrEffect["resolutionScale"] = v
  })
  resolutionFolder.add(params, "velocityResolutionScale", 0.125, 1, 0.125).onChange((v) => {
    ssrEffect["velocityResolutionScale"] = v
  })


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
