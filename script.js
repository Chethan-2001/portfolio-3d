import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("bg-canvas");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Three.js scene ---------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06070d, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

/* Neon palette */
const NEON = [0x6ea8ff, 0xa855f7, 0x22d3ee, 0x60a5fa];

/* Central floating core: icosahedron + surrounding rings */
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const coreGeo = new THREE.IcosahedronGeometry(3, 1);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x6ea8ff,
  emissive: 0x1e3a8a,
  emissiveIntensity: 0.5,
  metalness: 0.7,
  roughness: 0.25,
  flatShading: true,
  transparent: true,
  opacity: 0.85,
});
const core = new THREE.Mesh(coreGeo, coreMat);
coreGroup.add(core);

/* Wireframe overlay */
const wireMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.18 });
const wire = new THREE.Mesh(coreGeo.clone(), wireMat);
wire.scale.setScalar(1.02);
coreGroup.add(wire);

/* Orbiting rings */
for (let i = 0; i < 3; i++) {
  const r = 4.2 + i * 1.1;
  const tubular = new THREE.TorusGeometry(r, 0.03, 12, 120);
  const m = new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(tubular, m);
  ring.rotation.x = Math.random() * Math.PI;
  ring.rotation.y = Math.random() * Math.PI;
  ring.userData = { speed: 0.002 + i * 0.001, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize() };
  coreGroup.add(ring);
}

/* Particle field */
const partCount = 1400;
const partGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(partCount * 3);
const pCol = new Float32Array(partCount * 3);
for (let i = 0; i < partCount; i++) {
  const r = 12 + Math.random() * 18;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pPos[i*3]     = r * Math.sin(phi) * Math.cos(theta);
  pPos[i*3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  pPos[i*3 + 2] = r * Math.cos(phi);
  const c = new THREE.Color(NEON[Math.floor(Math.random() * NEON.length)]);
  pCol[i*3]     = c.r;
  pCol[i*3 + 1] = c.g;
  pCol[i*3 + 2] = c.b;
}
partGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
partGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
const partMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true, blending: THREE.AdditiveBlending });
const particles = new THREE.Points(partGeo, partMat);
scene.add(particles);

/* Network nodes: smaller cluster forming a network */
const netGroup = new THREE.Group();
scene.add(netGroup);
const nodeCount = 46;
const nodePositions = [];
for (let i = 0; i < nodeCount; i++) {
  const angle = (i / nodeCount) * Math.PI * 2;
  const radius = 9 + Math.random() * 3;
  const v = new THREE.Vector3(
    Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 8,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 2
  );
  nodePositions.push(v);
  const geo = new THREE.SphereGeometry(0.12, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0.85 });
  const node = new THREE.Mesh(geo, mat);
  node.position.copy(v);
  netGroup.add(node);
}
/* Edges between nearby nodes */
const edges = [];
for (let i = 0; i < nodeCount; i++) {
  for (let j = i + 1; j < nodeCount; j++) {
    if (nodePositions[i].distanceTo(nodePositions[j]) < 5.2) {
      edges.push(nodePositions[i].clone(), nodePositions[j].clone());
    }
  }
}
const edgeGeo = new THREE.BufferGeometry().setFromPoints(edges);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x6ea8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending });
const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
netGroup.add(edgeLines);

/* Lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const key = new THREE.PointLight(0x6ea8ff, 1.4, 60);
key.position.set(6, 6, 8);
scene.add(key);
const rim = new THREE.PointLight(0xa855f7, 1.2, 60);
rim.position.set(-6, -4, -6);
scene.add(rim);

/* Interaction */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("mousemove", (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
});

/* Camera scroll influence */
let scrollY = 0;
window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = !prefersReduced;
controls.autoRotateSpeed = 0.6;
controls.rotateSpeed = 0.4;

/* Resize */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

/* Animation loop */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // smooth mouse
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  if (!prefersReduced) {
    particles.rotation.y = t * 0.05;
    particles.rotation.x = Math.sin(t * 0.1) * 0.1;
    coreGroup.rotation.y += 0.004 + mouse.x * 0.002;
    coreGroup.rotation.x += (mouse.y * 0.4 - coreGroup.rotation.x) * 0.02;
    core.rotation.y = t * 0.35;
    wire.rotation.x = t * 0.12;
    netGroup.rotation.y = -t * 0.08;
    netGroup.rotation.x = Math.sin(t * 0.15) * 0.15;

    coreGroup.children.forEach((c) => {
      if (c.userData && c.userData.speed && c.geometry && c.geometry.type === "TorusGeometry") {
        c.rotateOnAxis(c.userData.axis, c.userData.speed);
      }
    });
  }

  camera.position.x += (mouse.x * 2.2 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 2 - scrollY * 0.002 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ---------- UI helpers ---------- */
// Nav toggle
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

// Close mobile nav on link click
navLinks?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => navLinks.classList.remove("open"))
);

// Scroll reveal
const reveals = document.querySelectorAll("section, .info-card, .skill-group, .edu-card, .contact-card, .timeline-card");
reveals.forEach((el) => el.classList.add("reveal"));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach((el) => io.observe(el));

// Tilt effect for cards
document.querySelectorAll(".info-card, .edu-card, .contact-card, .stat").forEach((card) => {
  card.classList.add("tilt");
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`;
  });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
});
