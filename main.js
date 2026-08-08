import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";
import GUI from "lil-gui";

const scene = new THREE.Scene();
const lightBgColor = new THREE.Color(0xfaf7f4);
scene.background = lightBgColor;

const camera = new THREE.PerspectiveCamera(
  55,
  innerWidth / innerHeight,
  0.1,
  100,
);
camera.position.set(0, 4, 10);
camera.lookAt(0, 0, 0);

// const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.VSMShadowMap;
// renderer.outputColorSpace = THREE.SRGBColorSpace;
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 0.7;
// document.body.appendChild(renderer.domElement);

// const orbit = new OrbitControls(camera, renderer.domElement);

// orbit.update();

// import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// const pmremGenerator = new THREE.PMREMGenerator(renderer);
// scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
// scene.environmentIntensity = 0.3

// //floor

// const width = 80;
// const height = 80;
// const segmentsX = 1;
// const segmentsY = 120;
// const backdropGeo = new THREE.PlaneGeometry(
//   width,
//   height,
//   segmentsX,
//   segmentsY,
// );

// const R = 8;

// const pos = backdropGeo.attributes.position;
// for (let i = 0; i < pos.count; i++) {
//   const y = pos.getY(i);
//   let newY = y;
//   let newZ = 0;

//   if (y <= -R) {
//     newY = -R;
//     newZ = -y;
//   } else if (y < 0) {
//     const s = -y / R;
//     const phi = (s * Math.PI) / 2;
//     newZ = R * (1 - Math.cos(phi));
//     newY = -R * Math.sin(phi);
//   }

//   pos.setY(i, newY);
//   pos.setZ(i, newZ);
// }
// backdropGeo.computeVertexNormals();

// const backdropMat = new THREE.MeshStandardMaterial({
//   color: bgColor,
//   roughness: 1.0,
//   metalness: 0,
//   side: THREE.DoubleSide,
// });
// const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
// backdrop.position.set(0, 7.95, -15);
// backdrop.receiveShadow = true;
// scene.add(backdrop);

// //light

// // ====== KEY LIGHT — основной, тёплый, сверху-сбоку под углом ======
// const keyLight = new THREE.DirectionalLight(0xff9d4d, 2.8); // тёплый желтоватый
// keyLight.position.set(-10, 8, 7); // слева-сверху-спереди
// keyLight.castShadow = true;
// keyLight.shadow.mapSize.set(2048, 2048);
// keyLight.shadow.radius = 40; // размытие теней — чем больше, тем мягче
// keyLight.shadow.bias = -0.005;
// keyLight.shadow.camera.near = 0.1;
// keyLight.shadow.camera.far = 40;
// keyLight.shadow.camera.left = -12;
// keyLight.shadow.camera.right = 12;
// keyLight.shadow.camera.top = 12;
// keyLight.shadow.camera.bottom = -12;
// scene.add(keyLight);

// const keyLightHelper = new THREE.DirectionalLightHelper(keyLight, 5, 'red')
// scene.add(keyLightHelper)

// // ====== FILL LIGHT — холодный и слабый, подсвечивает тени с другой стороны ======
// // Контраст теплый/холодный — то, что даёт "студийную" глубину, а не плоскую картинку
// const fillLight = new THREE.DirectionalLight(0xe8edf5, 1.1); // холодный, приглушённый
// fillLight.position.set(7, 4, 3); // справа, ниже key light
// scene.add(fillLight);

// const fillLightHelper = new THREE.DirectionalLightHelper(fillLight, 5, 'blue')
// scene.add(fillLightHelper)

// // ====== RIM LIGHT — тёплый контровой, сзади, обводит объект по контуру ======
// const rimLight = new THREE.DirectionalLight(0xff7a26, 0.8);
// rimLight.position.set(0, 5, -8); // сзади и сверху
// scene.add(rimLight);

// const rimLightHelper = new THREE.DirectionalLightHelper(rimLight, 5, 'orange')
// scene.add(rimLightHelper)

// // ====== AMBIENT — очень слабый, просто чтобы тени не были угольно-чёрными ======
// const ambient = new THREE.AmbientLight(0xf6f3ee, 0.6);
// scene.add(ambient);

// const light = new THREE.HemisphereLight(0xf6f3ee, 0xe8c98f, 0.7);
// scene.add(light);

// const lightHelper = new THREE.HemisphereLightHelper(light, 5, 'green')
// scene.add(lightHelper)

// Дополнительный "выравнивающий" свет — направлен почти вертикально вниз,
// специально чтобы поднять яркость пола, который key light не докрывает
// const topFill = new THREE.DirectionalLight(0xfff8ee, 0.6);
// topFill.position.set(0, 15, -5);
// scene.add(topFill);

// const topFillHelper = new THREE.DirectionalLightHelper(topFill, 5, 'purple')
// // scene.add(topFillHelper)

// // И ещё один — почти строго с фронта, поднимает яркость стены
// const frontFill = new THREE.DirectionalLight(0xfff8ee, 0.5);
// frontFill.position.set(0, 5, 20);
// scene.add(frontFill);

// const frontFillHelper = new THREE.DirectionalLightHelper(frontFill, 5, 'black')
// scene.add(frontFillHelper)

// 1. Инициализация панели управления
//
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.shadowMap.type = THREE.VSMShadowMap;

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.y = 2;
orbit.update();

// light

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.15 }),
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = 0;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const keyLight = new THREE.DirectionalLight(0xffe2b8, 2.2);
keyLight.position.set(-8, 10, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 12;
keyLight.shadow.bias = -0.005;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -12;
scene.add(keyLight);

const keyLightHelper = new THREE.DirectionalLightHelper(keyLight, 5, "red");
scene.add(keyLightHelper);

const fillLight = new THREE.DirectionalLight(0xe8edf5, 0.45);
fillLight.position.set(7, 5, 6);
scene.add(fillLight);

const fillLightHelper = new THREE.DirectionalLightHelper(fillLight, 5, "blue");
scene.add(fillLightHelper);

const ambient = new THREE.AmbientLight(0xf6f3ee, 0.8);
scene.add(ambient);

const light = new THREE.HemisphereLight(0xf6f3ee, 0xe8c98f, 0.7);
scene.add(light);

const lightHelper = new THREE.HemisphereLightHelper(light, 5, "green");
scene.add(lightHelper);

const hemisphere = new THREE.HemisphereLight(0xfff8ef, 0xe5d3bd, 0.35);
scene.add(hemisphere);

const boxLight = new THREE.PointLight(0xffb84d, 8, 3, 2);
boxLight.castShadow = false;

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

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);

  gradient.addColorStop(0, "rgba(255, 190, 70, 1)");
  gradient.addColorStop(0.25, "rgba(255, 170, 50, 0.5)");
  gradient.addColorStop(0.6, "rgba(255, 140, 30, 0.15)");
  gradient.addColorStop(1, "rgba(255, 140, 30, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

const glowTexture = createGlowTexture();

const boxGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffb84d,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);

boxGlow.scale.set(6, 6, 6);
boxGlow.position.set(0, 0, 0);

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
  // boxGroup.position.y = -1;;
  scene.add(boxGroup);
  boxGroup.add(boxGlow);
  boxGroup.add(boxLight);

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
    {
      name: "Box_Flap_RL",
      axis: "z",
      angle: Math.PI / 1.2,
      duration: 0.45,
      delay: 0.1,
    },
    {
      name: "Box_Flap_LL",
      axis: "z",
      angle: -Math.PI / 1.25,
      duration: 0.45,
      delay: 0.08,
    },
    {
      name: "Box_Flap_RS",
      axis: "x",
      angle: -Math.PI / 1.15,
      duration: 0.4,
      delay: 0.08,
    },
    {
      name: "Box_Flap_LS",
      axis: "x",
      angle: Math.PI / 1.25,
      duration: 0.4,
      delay: 0.08,
    },
  ];

  if (direction === -1) {
    configs.reverse();
  }

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

function changeBackground() {
  const targetColor = new THREE.Color(0x211626);
  gsap.to(lightBgColor, {
    r: targetColor.r,
    g: targetColor.g,
    b: targetColor.b,
    duration: 1.5,
    ease: "power2.out",
  });
}

function openBox() {
  if (isOpened || isAnimating) return;
  isAnimating = true;
  changeBackground();

  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false;
      isOpened = true;
      spawnModels();
      setTimeout(() => closeBox(), 1000);
    },
  });

  tl.to(boxGlow.material, {
    opacity: 0.7,
    duration: 1,
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

      isAnimating = false;
    },
  });

  getLidAnimations(tl, -1);
}

// world settings

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 15;
world.solver.tolerance = 0.001;

const groundMaterial = new CANNON.Material("ground");
const wallMaterial = new CANNON.Material("wall");
const objectMaterial = new CANNON.Material("object");

const groundBody = new CANNON.Body({
  mass: 0,
  material: groundMaterial,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
// groundBody.position.y = -2;
world.addBody(groundBody);

const contactConfigs = [
  {
    mat1: objectMaterial,
    mat2: groundMaterial,
    friction: 0.2,
    restitution: 0.2,
  },
  {
    mat1: objectMaterial,
    mat2: wallMaterial,
    friction: 0.5,
    restitution: 0.1,
  },
  {
    mat1: objectMaterial,
    mat2: objectMaterial,
    friction: 0.3,
    restitution: 0.2,
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
  const body = new CANNON.Body({ mass: 0, material: wallMaterial });
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

// models spawn

const ITEMS_CONFIG = [
  {
    url: "./models/Daisy.glb",
    shapeType: "box",
    scale: 0.9,
    mass: 1.0,
    collisionScale: 0.8,
  },
  {
    url: "./models/Bone.glb",
    shapeType: "box",
    scale: 0.9,
    mass: 1.2,
    collisionScale: 0.8,
  },
  {
    url: "./models/Apple.glb",
    shapeType: "sphere",
    scale: 0.8,
    mass: 0.8,
    collisionScale: 0.7,
  },
  {
    url: "./models/Cat.glb",
    shapeType: "sphere",
    scale: 0.9,
    mass: 1.0,
    collisionScale: 0.7,
  },
  {
    url: "./models/Star2.glb",
    shapeType: "box",
    scale: 0.8,
    mass: 0.9,
    collisionScale: 0.8,
  },
];

const physicsPairs = [];

async function spawnModels() {
  physicsPairs.forEach((pair) => {
    scene.remove(pair.mesh);
    world.removeBody(pair.body);
  });
  physicsPairs.length = 0;

  const loadPromises = ITEMS_CONFIG.map((item) =>
    loader
      .loadAsync(item.url)
      .then((gltf) => gltf.scene)
      .catch((err) => {
        console.warn(`Fail to load ${item.url}:`, err);

        const fallbackGroup = new THREE.Group();
        const fallbackMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xffaa88 }),
        );
        fallbackGroup.add(fallbackMesh);
        return fallbackGroup;
      }),
  );

  const loadedMeshes = await Promise.all(loadPromises);

  loadedMeshes.forEach((mesh, index) => {
    const config = ITEMS_CONFIG[index];

    mesh.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    const scaleVar = 0.9 + Math.random() * 0.2;
    const itemScale = config.scale !== undefined ? config.scale : 1.0;
    const finalScale = itemScale * scaleVar;
    mesh.scale.setScalar(finalScale);
    scene.add(mesh);

    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    const collisionScale = config.collisionScale || 0.8;

    let physicsShape;
    if (config.shapeType === "sphere") {
      const radius = (Math.max(size.x, size.y, size.z) / 2) * collisionScale;
      physicsShape = new CANNON.Sphere(radius);
    } else {
      const half = new CANNON.Vec3(
        (size.x / 2) * collisionScale,
        (size.y / 2) * collisionScale,
        (size.z / 2) * collisionScale,
      );
      physicsShape = new CANNON.Box(half);
    }

    const body = new CANNON.Body({
      mass: config.mass || 1.0,
      shape: physicsShape,
      material: objectMaterial,
      linearDamping: 0.01,
      angularDamping: 0.05,
    });

    body.useCCD = true;
    body.ccdMotionThreshold = 0.01;
    body.ccdRadius =
      (config.shapeType === "sphere"
        ? (Math.max(size.x, size.y, size.z) / 2) * collisionScale
        : (Math.max(size.x, size.y, size.z) / 2) * collisionScale) * 0.8;

    const boxPos = boxGroup.position.clone();
    const boxQuat = boxGroup.quaternion.clone();
    const offsetLocal = new THREE.Vector3(
      (index - 1) * 0.3,
      (Math.random() - 0.5) * 0.2 + 0.1,
      (Math.random() - 0.5) * 0.2,
    );

    const offsetX = (index - 1) * 0.3;
    const offsetY = (Math.random() - 0.5) * 0.2 + 0.1;
    body.position.set(offsetX, -0.3 + offsetY, (Math.random() - 0.5) * 0.2);

    const jumpForceY = 10 + Math.random() * 5;
    const jumpForceX = (Math.random() - 0.5) * 8;
    const jumpForceZ = (Math.random() - 0.5) * 8;
    body.velocity.set(jumpForceX, jumpForceY, jumpForceZ);
    body.angularVelocity.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
    );

    world.addBody(body);
    physicsPairs.push({ mesh, body });
  });
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // if (keyLightHelper) keyLightHelper.update();
  // if (fillLightHelper) fillLightHelper.update();
  // if (rimLightHelper) rimLightHelper.update();
  // if (lightHelper) lightHelper.update();

  const fixedTimeStep = 1 / 60;
  const maxSubSteps = 8;

  world.step(fixedTimeStep, clock.getDelta(), maxSubSteps);

  for (const pair of physicsPairs) {
    pair.mesh.position.copy(pair.body.position);
    pair.mesh.quaternion.copy(pair.body.quaternion);
  }

  renderer.render(scene, camera);
}

animate();
init();
