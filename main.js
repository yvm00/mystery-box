import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

const FLOOR_POS = -1.6;

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
renderer.toneMappingExposure = 1;
renderer.shadowMap.type = THREE.VSMShadowMap;

// const orbit = new OrbitControls(camera, renderer.domElement);
// orbit.update();

// light

const shadowFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.15 }),
);
shadowFloor.rotation.x = -Math.PI / 2;
shadowFloor.position.y = FLOOR_POS;
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

const keyLight = new THREE.DirectionalLight(0xff8e5b, 1.4);
keyLight.position.set(-8, 10, 8);
keyLight.castShadow = false;
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

const fillLight = new THREE.DirectionalLight(0x8ce0ff, 0.45);
fillLight.position.set(7, 5, 6);
scene.add(fillLight);

const ambient = new THREE.AmbientLight(0xf6f3ee, 0.5);
scene.add(ambient);

const light = new THREE.HemisphereLight(0xf6f3ee, 0xe8c98f, 0.7);
scene.add(light);

const hemisphere = new THREE.HemisphereLight(0xfff8ef, 0xe5d3bd, 0.35);
scene.add(hemisphere);

const boxLight = new THREE.PointLight(0xffb84d, 0.3, 8, 1);
boxLight.castShadow = false;

// background

function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  const cx = 128;
  const cy = 128;
  const R = 120;

  const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.2, "#7dd3fc");
  gradient.addColorStop(0.45, "#8b5cf6");
  gradient.addColorStop(0.85, "rgba(236, 72, 153, 0.3)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.quadraticCurveTo(cx, cy, cx + R, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + R);
  ctx.quadraticCurveTo(cx, cy, cx - R, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - R);

  ctx.closePath();
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

const starTexture = createStarTexture();

function createBgStar() {
  const material = new THREE.SpriteMaterial({
    map: starTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Sprite(material);
}

function showBackgroundStars() {
  backgroundStars.forEach((star, i) => {
    gsap.to(star.material, {
      opacity: i % 2 === 0 ? 0.7 : 0.45,
      duration: 1.2,
      delay: i * 0.025,
      ease: "power2.out",
    });

    gsap.to(star.position, {
      y: star.position.y + 0.15,
      duration: 2 + Math.random(),
      delay: i * 0.025,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });
}

let backgroundStars = [];
let backgroundStarsGroup = null;

function createBackgroundStars() {
  const group = new THREE.Group();
  backgroundStarsGroup = group;
  const count = 40;

  for (let i = 0; i < count; i++) {
    const star = createBgStar();

    const phi = i * 137.5 * (Math.PI / 180);
    const radius = Math.sqrt(i) * 2;

    const x = Math.cos(phi) * radius * 2;
    const y = Math.sin(phi) * radius + FLOOR_POS;
    const z = -7 - i * 0.1;

    star.position.set(x, y, z);

    const scale = i % 2 === 0 ? 1 : 2;
    star.scale.setScalar(scale);

    group.add(star);
    backgroundStars.push(star);
  }

  scene.add(group);
}

const mouse = new THREE.Vector2();
const parallax = {
  x: 0,
  y: 0,
};

const PARALLAX_STRENGTH = 0.025;

window.addEventListener("pointermove", (e) => {
  if (!backgroundStarsGroup) return;

  const x = (e.clientX / innerWidth) * 2 - 1;
  const y = (e.clientY / innerHeight) * 2 - 1;

  parallax.x = x;
  parallax.y = y;
});

// box loading

const loader = new GLTFLoader();
let boxGroup = null;
let boxLid = null;
let boxContactsAdded = false;

function loadBox() {
  return new Promise((resolve, reject) => {
    loader.load("./models/BoxColor.glb", resolve, undefined, reject);
  });
}

async function init() {
  const gltf = await loadBox();
  boxGroup = gltf.scene;

  createBackgroundStars();
  boxGroup.traverse((c) => {
    if (c.isMesh) c.castShadow = c.receiveShadow = true;
  });

  scene.add(boxGroup);
  boxGroup.updateMatrixWorld(true);
  boxGroup.scale.setScalar(1.6);

  const bbox = new THREE.Box3().setFromObject(boxGroup);
  const center = bbox.getCenter(new THREE.Vector3());

  const names = ["Box_Flap_RL", "Box_Flap_LL", "Box_Flap_RS", "Box_Flap_LS"];
  boxLid = Object.fromEntries(
    names.map((n) => [n, boxGroup.getObjectByName(n)]),
  );

  boxGroup.position.x = -center.x;
  boxGroup.position.z = -center.z;
  boxGroup.position.y = -bbox.min.y + FLOOR_POS;
  boxGroup.updateMatrixWorld(true);

  boxGroup.position.x = 15;
  scene.add(boxGroup);
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

const textOverlay = document.querySelector(".text-title");
const lines = document.querySelectorAll(".title-line");
const allLetters = [];

lines.forEach((line) => {
  const text = line.textContent;
  line.textContent = "";

  const letters = [...text].map((char) => {
    const span = document.createElement("span");

    span.textContent = char === " " ? "\u00A0" : char;

    span.style.cssText = `
      display: inline-block;
      opacity: 0;
      transform: translateY(20px);
    `;

    line.appendChild(span);

    return span;
  });

  allLetters.push(...letters);
});

const hint = document.querySelector(".text-hint");

const toggleHint = (show, text) => {
  if (text) hint.textContent = text;
  gsap.to(hint, { opacity: show ? 1 : 0, delay: 0.3, duration: 0.5 });
};

const answer = document.querySelector(".text-answer");

function showText() {
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.innerText = "";
  textOverlay.appendChild(cursor);

  gsap.set(allLetters, { opacity: 0 });

  gsap.to(allLetters, {
    opacity: 1,
    duration: 0.03,
    ease: "none",
    stagger: {
      each: 0.09,
      from: "start",
    },

    onUpdate: function () {
      const visibleLetters = allLetters.filter(
        (letter) => gsap.getProperty(letter, "opacity") > 0,
      );
      if (visibleLetters.length > 0) {
        const lastVisibleLetter = visibleLetters[visibleLetters.length - 1];

        lastVisibleLetter.after(cursor);
      }
    },

    onComplete: () => {
      toggleHint(true);

      gsap.to(cursor, {
        opacity: 0,
        duration: 0.5,
        delay: 1.3,
        onComplete: () => cursor.remove(),
      });
    },
  });
}

// box opening-closing animation

let isAnimating = false;
let globalBoxBody = null;

const raycaster = new THREE.Raycaster();
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

function openBox() {
  if (isOpened || isAnimating) return;

  isAnimating = true;
  showBackgroundStars();

  const tl = gsap.timeline({
    onComplete: async () => {
      isAnimating = false;
      isOpened = true;

      await spawnModels();

      gsap.to(answer, {
        opacity: 0.7,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out",
      });

      toggleHint(true, "throw them around");

      setTimeout(() => closeBox(), 1000);
    },
  });

  tl.to(
    boxLight,
    {
      intensity: 12,
      duration: 0.4,
    },
    "<",
  );

  tl.to(boxGroup.rotation, {
    z: 0.06,
    duration: 0.07,
  })
    .to(boxGroup.rotation, {
      z: -0.06,
      duration: 0.07,
    })
    .to(boxGroup.rotation, {
      z: 0,
      duration: 0.07,
    });

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

  const centerY = camera.position.y + FLOOR_POS;
  const halfW = visibleWidth / 2 + WALL_SIDE_OFFSET;
  const topY = centerY + visibleHeight / 2;

  groundBody.position.y = FLOOR_POS;

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
    scale: 1,
    mass: 1.0,
    collisionScale: 0.8,
  },
  {
    url: "./models/Moon.glb",
    shapeType: "box",
    scale: 0.8,
    mass: 1,
    collisionScale: 0.8,
  },
  {
    url: "./models/Apple.glb",
    shapeType: "sphere",
    scale: 1,
    mass: 0.8,
    collisionScale: 0.7,
  },
  {
    url: "./models/Cat.glb",
    shapeType: "sphere",
    scale: 1,
    mass: 1.0,
    collisionScale: 0.7,
  },
  {
    url: "./models/Star.glb",
    shapeType: "box",
    scale: 1,
    mass: 0.9,
    collisionScale: 0.8,
  },
];

const physicsPairs = [];

let isDragging = false;
let draggedBody = null;
let dragConstraint = null;

const pivot = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.KINEMATIC,
});

pivot.collisionFilterGroup = 0;
pivot.collisionFilterMask = 0;

world.addBody(pivot);

const dragPlane = new THREE.Plane();
const dragPoint = new THREE.Vector3();

const MAX_THROW_SPEED = 7;
const MAX_DRAG_SPEED = 10;

function findBodyByMesh(mesh) {
  for (const pair of physicsPairs) {
    let found = false;

    pair.mesh.traverse((child) => {
      if (child === mesh) found = true;
    });

    if (found) return pair.body;
  }

  return null;
}

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

    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());

    const maxDimension = Math.max(size.x, size.y, size.z);

    const localCenter = bbox
      .getCenter(new THREE.Vector3())
      .sub(mesh.position)
      .divideScalar(finalScale);

    const glowLight = new THREE.PointLight(
      config.glowColor || 0x8b5cf6,
      8,
      5,
      1,
    );

    glowLight.position.copy(localCenter);

    mesh.add(glowLight);

    scene.add(mesh);

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
      0.6 + (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
    );

    const spawnPos = boxPos
      .clone()
      .add(offsetLocal.clone().applyQuaternion(boxQuat));
    body.position.set(spawnPos.x, spawnPos.y, spawnPos.z);

    const jumpForceY = 6 + Math.random() * 3;
    const jumpForceX = (Math.random() - 0.5) * 5;
    const jumpForceZ = (Math.random() - 0.5) * 5;
    body.velocity.set(jumpForceX, jumpForceY, jumpForceZ);
    body.angularVelocity.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
    );

    world.addBody(body);
    physicsPairs.push({ mesh, body, glow: glowLight });
  });
}

const customCursor = document.querySelector(".custom-cursor");

let cursorX = 0;
let cursorY = 0;
let targetCursorX = 0;
let targetCursorY = 0;

if (customCursor) {
  window.addEventListener("pointermove", (e) => {
    targetCursorX = e.clientX;
    targetCursorY = e.clientY;
  });
}

window.addEventListener("pointerdown", (e) => {
  if (!isOpened || isAnimating) return;

  mouse.set(
    (e.clientX / innerWidth) * 2 - 1,
    -(e.clientY / innerHeight) * 2 + 1,
  );

  raycaster.setFromCamera(mouse, camera);

  const meshes = [];

  physicsPairs.forEach((pair) => {
    pair.mesh.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
  });

  const hits = raycaster.intersectObjects(meshes, false);

  if (!hits.length) return;

  const hit = hits[0];

  draggedBody = findBodyByMesh(hit.object);

  if (!draggedBody) return;

  isDragging = true;
  customCursor?.classList.add("is-dragging");

  draggedBody.velocity.set(0, 0, 0);
  draggedBody.angularVelocity.set(0, 0, 0);

  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, hit.point);

  dragPoint.copy(hit.point);

  const localPivot = new CANNON.Vec3();

  draggedBody.pointToLocalFrame(
    new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z),
    localPivot,
  );

  pivot.position.set(hit.point.x, hit.point.y, hit.point.z);

  dragConstraint = new CANNON.PointToPointConstraint(
    draggedBody,
    localPivot,
    pivot,
    new CANNON.Vec3(0, 0, 0),
  );

  world.addConstraint(dragConstraint);

  renderer.domElement.setPointerCapture?.(e.pointerId);
});

window.addEventListener("pointermove", (e) => {
  if (!isDragging || !draggedBody) return;

  mouse.set(
    (e.clientX / innerWidth) * 2 - 1,
    -(e.clientY / innerHeight) * 2 + 1,
  );

  raycaster.setFromCamera(mouse, camera);

  const hit = raycaster.ray.intersectPlane(dragPlane, dragPoint);

  if (!hit) return;

  pivot.position.set(dragPoint.x, dragPoint.y, dragPoint.z);

  const vel = draggedBody.velocity;

  const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

  if (speed > MAX_DRAG_SPEED) {
    const scale = MAX_DRAG_SPEED / speed;

    vel.x *= scale;
    vel.y *= scale;
    vel.z *= scale;
  }
});

window.addEventListener("pointerup", (e) => {
  if (!isDragging) return;

  if (dragConstraint) {
    world.removeConstraint(dragConstraint);
    dragConstraint = null;
  }

  if (draggedBody) {
    const vel = draggedBody.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

    if (speed > MAX_THROW_SPEED) {
      const scale = MAX_THROW_SPEED / speed;

      vel.x *= scale;
      vel.y *= scale;
      vel.z *= scale;
    }
  }

  isDragging = false;
  draggedBody = null;

  customCursor?.classList.remove("is-dragging");

  renderer.domElement.releasePointerCapture?.(e.pointerId);
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  updateWalls();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (backgroundStarsGroup) {
    backgroundStarsGroup.rotation.y +=
      (parallax.x * PARALLAX_STRENGTH - backgroundStarsGroup.rotation.y) * 0.04;

    backgroundStarsGroup.rotation.x +=
      (-parallax.y * PARALLAX_STRENGTH - backgroundStarsGroup.rotation.x) *
      0.04;
  }

  if (customCursor) {
    cursorX += (targetCursorX - cursorX) * 0.15;
    cursorY += (targetCursorY - cursorY) * 0.15;

    customCursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
  }

  const fixedTimeStep = 1 / 60;
  const maxSubSteps = 8;

  const MAX_GLOBAL_SPEED = 10;
  physicsPairs.forEach((pair) => {
    const vel = pair.body.velocity;
    if (!vel) return;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    if (speed > MAX_GLOBAL_SPEED) {
      const scale = MAX_GLOBAL_SPEED / speed;
      vel.x *= scale;
      vel.y *= scale;
      vel.z *= scale;
    }
  });

  world.step(fixedTimeStep, clock.getDelta(), maxSubSteps);

  for (const pair of physicsPairs) {
    pair.mesh.position.copy(pair.body.position);
    pair.mesh.quaternion.copy(pair.body.quaternion);
  }

  renderer.render(scene, camera);
}

animate();
init();
