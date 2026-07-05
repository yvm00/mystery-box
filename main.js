import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

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

// light

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

sunLight.shadow.mapSize.set(4096, 4096);
sunLight.shadow.radius = 6;
sunLight.shadow.blurSamples = 16;
sunLight.shadow.bias = -0.001;

sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 40;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;

scene.add(sunLight);
sunLight.shadow.camera.lookAt(0, -1, 0);

sunLight.target.position.set(0, -1, 0);
scene.add(sunLight.target);

scene.add(new THREE.AmbientLight(0xfff0e0, 0.3));

// box loading
const loader = new GLTFLoader();
let boxGroup = null;
let boxLid = null;
let boxContactsAdded = false;

function loadBox() {
  return new Promise((resolve, reject) => {
    loader.load("./models/Box2.glb", resolve, undefined, reject);
  });
}

async function init() {
  const gltf = await loadBox();
  boxGroup = gltf.scene;

  boxGroup.traverse((c) => {
    if (c.isMesh) c.castShadow = c.receiveShadow = true;
  });

  scene.add(boxGroup);
  boxGroup.updateMatrixWorld(true);
  boxGroup.scale.setScalar(1.4);

  const bbox = new THREE.Box3().setFromObject(boxGroup);
  const center = bbox.getCenter(new THREE.Vector3());

  const names = ["Box_Flap_RL", "Box_Flap_LL", "Box_Flap_RS", "Box_Flap_LS"];
  boxLid = Object.fromEntries(
    names.map((n) => [n, boxGroup.getObjectByName(n)]),
  );

  boxGroup.position.x = -center.x;
  boxGroup.position.z = -center.z;
  boxGroup.position.y = -bbox.min.y;
  boxGroup.updateMatrixWorld(true);

  boxGroup.position.x = 15;
  boxGroup.position.y = -1;

  setTimeout(() => rollInBox(), 500);
}

function rollInBox() {
  const tl = gsap.timeline({
    onComplete: () => {
      showText();
    },
  });

  tl.to(boxGroup.position, { x: 0, duration: 2, ease: "power2.out" });
  tl.to(
    boxGroup.rotation,
    { y: -Math.PI * 1.25, duration: 1.8, ease: "power2.out" },
    "<",
  );
}

// text

const textOverlay = document.createElement("div");
textOverlay.id = "textOverlay";
textOverlay.className = "text-overlay";
document.body.appendChild(textOverlay);

const lines = ["What's in the", "box", "??"];
const allLetters = [];

function createTextLine(text, className = "") {
  const lineContainer = document.createElement("div");
  if (className) lineContainer.classList.add(className);
  lineContainer.style.display = "block";

  const lineLetters = text.split("").map((char) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.cssText = `
      display: inline-block;
      opacity: 0;
      transform: translateY(20px);
    `;
    lineContainer.appendChild(span);
    return span;
  });

  textOverlay.appendChild(lineContainer);
  allLetters.push(...lineLetters);
}

lines.forEach((el) => createTextLine(el, "text-main"));

const hint = document.createElement("div");
hint.className = "text-hint";
hint.textContent = "click the box";
document.body.appendChild(hint);

const toggleHint = (show, text) => {
  if (text) hint.textContent = text;
  gsap.to(hint, { opacity: show ? 1 : 0, delay: 0.3, duration: 0.5 });
};

function showText() {
  gsap.to(allLetters, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: "power2.out",
    stagger: 0.05,
    onComplete: () => toggleHint(true),
  });
}

function getNDC(event) {
  return new THREE.Vector2(
    (event.clientX / innerWidth) * 2 - 1,
    -(event.clientY / innerHeight) * 2 + 1,
  );
}

function openBox() {
  if (isOpened) return;
  isOpened = true;

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.delayedCall(1, closeBox);
    },
  });

  tl.to(boxGroup.rotation, { z: 0.06, duration: 0.07 })
    .to(boxGroup.rotation, { z: -0.06, duration: 0.07 })
    .to(boxGroup.rotation, { z: 0, duration: 0.07 });

  animateLids(tl);
}

function animateLids(tl) {
  const {
    Box_Flap_RL: RL,
    Box_Flap_LL: LL,
    Box_Flap_RS: RS,
    Box_Flap_LS: LS,
  } = boxLid;
  if (RL)
    tl.to(
      RL.rotation,
      { z: Math.PI / 1.2, duration: 0.45, ease: "power2.out" },
      "+=0.1",
    );
  if (LL)
    tl.to(
      LL.rotation,
      { z: -Math.PI / 1.25, duration: 0.45, ease: "power2.out" },
      "<0.08",
    );
  if (RS)
    tl.to(
      RS.rotation,
      { x: -Math.PI / 1.15, duration: 0.4, ease: "power2.out" },
      "<0.08",
    );
  if (LS)
    tl.to(
      LS.rotation,
      { x: Math.PI / 1.25, duration: 0.4, ease: "power2.out" },
      "<0.08",
    );
}

window.addEventListener("click", (e) => {
  if (!boxGroup || isOpened) return;

  const mouse = getNDC(e);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(boxGroup, true);
  if (hits.length > 0) openBox();
});

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
init();
