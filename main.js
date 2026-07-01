import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55,
  innerWidth / innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1.5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.type = THREE.VSMShadowMap;

const orbit = new OrbitControls(camera, renderer.domElement);

orbit.update();

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new RGBELoader().load("./texture/lakeside_sunrise.hdr", (texture) => {
  const envMap = pmrem.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  scene.environmentRotation.y = -Math.PI * 0.4;
  scene.environmentIntensity = 1;
  texture.dispose();
  pmrem.dispose();
});

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.15 }),
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = -2.05;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const sunLight = new THREE.DirectionalLight(0xffb347, 1.5);
sunLight.position.set(-1.5, 2.5, 1);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.radius = 6;
sunLight.shadow.blurSamples = 16;
sunLight.shadow.bias = -0.001;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 30;
sunLight.shadow.camera.left = -5;
sunLight.shadow.camera.right = 5;
sunLight.shadow.camera.top = 5;
sunLight.shadow.camera.bottom = -5;
scene.add(sunLight);

scene.add(new THREE.AmbientLight(0xfff0e0, 0.3));

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: "red" });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const loader = new GLTFLoader();
let boxGroup = null;
let boxLid = null;
let boxPhysicsWalls = [];

function loadBox() {
  return new Promise((resolve, reject) => {
    loader.load("./models/Box2.glb", resolve, undefined, reject);
  });
}



window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
