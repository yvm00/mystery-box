import * as THREE from "three";
import * as CANNON from "cannon-es";
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

// box opening-closing animation

let isAnimating = false;
let globalBoxBody = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isOpened = false;

function getNDC(event) {
  return new THREE.Vector2(
    (event.clientX / innerWidth) * 2 - 1,
    -(event.clientY / innerHeight) * 2 + 1,
  );
}

window.addEventListener("click", (e) => {
  if (!boxGroup || isOpened || isAnimating) return;
  const ndc = getNDC(e);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(boxGroup, true);
  if (hits.length > 0) openBox();
});

function getLidAnimations(tl, direction) {
  const lids = boxLid;
  const configs = [
    { name: "RL", axis: "z", angle: Math.PI / 1.2, duration: 0.45, delay: 0.1 },
    {
      name: "LL",
      axis: "z",
      angle: -Math.PI / 1.25,
      duration: 0.45,
      delay: 0.08,
    },
    {
      name: "RS",
      axis: "x",
      angle: -Math.PI / 1.15,
      duration: 0.4,
      delay: 0.08,
    },
    {
      name: "LS",
      axis: "x",
      angle: Math.PI / 1.25,
      duration: 0.4,
      delay: 0.08,
    },
  ];

  configs.forEach((cfg, i) => {
    const lid = lids[cfg.name];
    if (!lid) return;
    const target = direction === 1 ? cfg.angle : 0;
    const start = direction === 1 ? 0 : cfg.angle;
    const props = {};
    props[cfg.axis] = target;
    const offset = i === 0 ? `+=${cfg.delay}` : `<${cfg.delay}`;
    tl.to(
      lid.rotation,
      { ...props, duration: cfg.duration, ease: "power2.out" },
      offset,
    );
  });
}

function openBox() {
  if (isOpened || isAnimating) return;
  isAnimating = true;

  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false;
      isOpened = true;
      spawnModels();
      gsap.delayedCall(1, closeBox);
    },
  });

  tl.to(boxGroup.rotation, { z: 0.06, duration: 0.07 })
    .to(boxGroup.rotation, { z: -0.06, duration: 0.07 })
    .to(boxGroup.rotation, { z: 0, duration: 0.07 });

  getLidAnimations(tl, 1);
}

function closeBox() {
  if (!isOpened || isAnimating) return;
  isAnimating = true;

  const tl = gsap.timeline({
    onComplete: () => {
      const boxShape = new CANNON.Box(
        new CANNON.Vec3(3.3 / 2, 2.3 / 2, 4.3 / 2),
      );
      globalBoxBody = new CANNON.Body({
        mass: 3.5,
        shape: boxShape,
        material: new CANNON.Material("boxMaterial"),
        linearDamping: 0.01,
        angularDamping: 0.05,
      });
      globalBoxBody.position.copy(boxGroup.position);
      globalBoxBody.quaternion.copy(boxGroup.quaternion);

      if (!boxContactsAdded) {
        const boxFloorContact = new CANNON.ContactMaterial(
          groundBody.material,
          globalBoxBody.material,
          { friction: 0.3, restitution: 0.4 },
        );
        world.addContactMaterial(boxFloorContact);

        const boxToObjectsContact = new CANNON.ContactMaterial(
          globalBoxBody.material,
          objectMaterial,
          { friction: 0.3, restitution: 0.3 },
        );
        world.addContactMaterial(boxToObjectsContact);
        boxContactsAdded = true;
      }

      world.addBody(globalBoxBody);
      physicsPairs.push({ mesh: boxGroup, body: globalBoxBody });

      globalBoxBody.angularVelocity.set(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2,
      );

      isOpened = false;
      isAnimating = false;
    },
  });

  getLidAnimations(tl, -1);
}

// models spawn

// ============================================================
// НАСТРОЙКА ФИЗИЧЕСКОГО МИРА
// ============================================================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world); // более эффективный broadphase
world.solver.iterations = 15;
world.solver.tolerance = 0.001;

// ============================================================
// ФИЗИЧЕСКИЕ МАТЕРИАЛЫ
// ============================================================
const materials = {
  ground: new CANNON.Material("ground"),
  wall: new CANNON.Material("wall"),
  object: new CANNON.Material("object"),
  box: new CANNON.Material("box"),
};

// ============================================================
// ПОЛ
// ============================================================
const groundBody = new CANNON.Body({
  mass: 0,
  material: materials.ground,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
groundBody.position.y = -2;
world.addBody(groundBody);

// ============================================================
// КОНТАКТНЫЕ НАСТРОЙКИ (трение + упругость)
// ============================================================
const contactConfigs = [
  {
    mat1: materials.object,
    mat2: materials.ground,
    friction: 0.2,
    restitution: 0.2,
  },
  {
    mat1: materials.object,
    mat2: materials.wall,
    friction: 0.5,
    restitution: 0.1,
  },
  {
    mat1: materials.object,
    mat2: materials.object,
    friction: 0.3,
    restitution: 0.2,
  },
  {
    mat1: materials.box,
    mat2: materials.ground,
    friction: 0.3,
    restitution: 0.4,
  },
  {
    mat1: materials.box,
    mat2: materials.object,
    friction: 0.3,
    restitution: 0.3,
  },
];

contactConfigs.forEach(({ mat1, mat2, friction, restitution }) => {
  world.addContactMaterial(
    new CANNON.ContactMaterial(mat1, mat2, { friction, restitution }),
  );
});

// walls

const wallBodies = [];
const WALL_DEPTH = 7;
const WALL_THICKNESS = 2;
const WALL_ANGLE_RAD = 0.75;
const WALL_SIDE_OFFSET = 1.5;

function createWall(x, y, z, w, h, d, rotY = 0) {
  const body = new CANNON.Body({ mass: 0, material: materials.wall });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
  body.position.set(x, y, z);
  if (rotY) {
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotY);
  }
  world.addBody(body);
  wallBodies.push(body);
  return body;
}

function updateWalls() {
  wallBodies.forEach((b) => world.removeBody(b));
  wallBodies.length = 0;

  const distance = Math.abs(camera.position.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovRad / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  const halfW = visibleWidth / 2 + WALL_SIDE_OFFSET;
  const halfH = visibleHeight / 2;

  const camY = camera.position.y;
  const topY = camY + halfH;
  const bottomY = camY - halfH;
  const centerY = (bottomY + topY) / 2;

  createWall(
    -halfW,
    centerY,
    0,
    WALL_THICKNESS,
    visibleHeight,
    halfW * 2,
    WALL_ANGLE_RAD,
  );
  createWall(
    halfW,
    centerY,
    0,
    WALL_THICKNESS,
    visibleHeight,
    halfW * 2,
    -WALL_ANGLE_RAD,
  );
  createWall(0, centerY, -WALL_DEPTH, halfW * 3, visibleHeight, WALL_THICKNESS);
  createWall(0, centerY, WALL_DEPTH, halfW * 3, visibleHeight, WALL_THICKNESS);
  createWall(0, topY + 0.5, 0, halfW * 2, WALL_THICKNESS, WALL_DEPTH * 2);
}

updateWalls();

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
