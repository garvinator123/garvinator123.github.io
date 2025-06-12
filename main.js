// Death Star Simulation by GitHub Copilot

// === SETUP THREE.JS SCENE ===
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Lighting
let ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
let dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10,10,10);
scene.add(dirLight);

// Placeholder objects
let deathStar, engines, superlaser, planet;
let laserBeam, explosionParticles = [];
let mode = 0;

// Chemistry explanation DOM
const chemDiv = document.getElementById('chemistry-explanation');

// === UTILS ===
function hideChemistry() { chemDiv.style.display = 'none'; }
function showChemistry(html) { chemDiv.innerHTML = html; chemDiv.style.display = 'block'; }
function lerp(a, b, t) { return a + (b - a) * t; }

// === DEATH STAR ===
function createDeathStar() {
  let geo = new THREE.SphereGeometry(20, 64, 64);
  let mat = new THREE.MeshStandardMaterial({color: 0x888888, metalness:0.6, roughness: 0.3});
  let mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -300);
  mesh.visible = false;
  scene.add(mesh);

  // Superlaser dish
  let dishGeo = new THREE.SphereGeometry(5, 32, 32, 0, Math.PI*2, 0, Math.PI/2);
  let dishMat = new THREE.MeshStandardMaterial({color: 0x33ff33, metalness: 0.7, roughness: 0.2});
  let dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(12, 8, -15);
  mesh.add(dish);

  // Engines (batteries) at back
  engines = [];
  for(let i=0;i<3;i++) {
    let battery = createBattery();
    battery.position.set(-12, i*8-8, -18);
    mesh.add(battery);
    engines.push(battery);
  }
  superlaser = dish;
  return mesh;
}

function createBattery() {
  // Simple galvanic cell: 2 gray cylinders (electrodes), 1 blue tube (electrolyte)
  let battery = new THREE.Group();
  let cell = new THREE.Mesh(
    new THREE.CylinderGeometry(2,2,8,32),
    new THREE.MeshStandardMaterial({color:0x4444ff, metalness:0.2})
  );
  let anode = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7,0.7,10,16),
    new THREE.MeshStandardMaterial({color:0x888888})
  );
  anode.position.set(-1.2,0,0);
  let cathode = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7,0.7,10,16),
    new THREE.MeshStandardMaterial({color:0xdddddd})
  );
  cathode.position.set(1.2,0,0);

  battery.add(cell, anode, cathode);

  // Add some electrons (spheres) for animation
  let electrons = [];
  for(let i=0;i<8;i++) {
    let e = new THREE.Mesh(
      new THREE.SphereGeometry(0.3,8,8),
      new THREE.MeshStandardMaterial({color:0xffff00, emissive:0xffff00})
    );
    e.position.set(lerp(-1.2,1.2,i/7), lerp(-4,4,i/7), 0);
    battery.add(e);
    electrons.push(e);
  }
  battery.userData.electrons = electrons;
  return battery;
}

function createPlanet() {
  let geo = new THREE.SphereGeometry(25, 64, 64);
  let mat = new THREE.MeshStandardMaterial({color:0x2288ff, roughness:0.8, metalness:0.2});
  let mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(120, 0, -300);
  scene.add(mesh);
  return mesh;
}

// === LASER ===
function createLaser() {
  let mat = new THREE.MeshBasicMaterial({color:0x00ff00});
  let geo = new THREE.CylinderGeometry(0.8,0.8, 100, 16);
  let mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI/2;
  mesh.position.set(24, 8, -260);
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

// === CAMERA ANIMATION HELPERS ===
function animateCamera(targetPos, lookAt, duration=1500) {
  let startPos = camera.position.clone();
  let startTarget = controls.target.clone();
  let start = Date.now();
  return new Promise(resolve => {
    function anim() {
      let t = Math.min((Date.now()-start)/duration,1);
      camera.position.lerpVectors(startPos, targetPos, t);
      controls.target.lerpVectors(startTarget, lookAt, t);
      if(t<1) requestAnimationFrame(anim);
      else resolve();
    }
    anim();
  });
}

// === STATES ===
function setMode(newMode) {
  mode = newMode;
  hideChemistry();
  // Enable/disable buttons
  hyperspaceBtn.disabled = (mode!==0);
  zoomEnginesBtn.disabled = (mode!==1);
  powerLaserBtn.disabled = (mode!==2);
  zoomSuperlaserBtn.disabled = (mode!==3);
  fireLaserBtn.disabled = (mode!==4);
  zoomImpactBtn.disabled = (mode!==5);
  explodePlanetBtn.disabled = (mode!==6);
}

// === BUTTONS ===
const hyperspaceBtn = document.getElementById('hyperspaceBtn');
const zoomEnginesBtn = document.getElementById('zoomEnginesBtn');
const powerLaserBtn = document.getElementById('powerLaserBtn');
const zoomSuperlaserBtn = document.getElementById('zoomSuperlaserBtn');
const fireLaserBtn = document.getElementById('fireLaserBtn');
const zoomImpactBtn = document.getElementById('zoomImpactBtn');
const explodePlanetBtn = document.getElementById('explodePlanetBtn');

// --- 1. Jump Death Star in ---
hyperspaceBtn.onclick = async ()=>{
  if (!deathStar) deathStar = createDeathStar();
  deathStar.visible = true;
  deathStar.scale.set(0.05, 0.05, 0.05);
  deathStar.position.z = -1000;
  // Hyperspace effect
  let t=0;
  function hyperspaceAnim() {
    t+=0.02;
    deathStar.position.z = lerp(-1000, -300, t);
    deathStar.scale.setScalar(lerp(0.05,1,t));
    if(t<1) requestAnimationFrame(hyperspaceAnim);
    else setMode(1);
  }
  hyperspaceAnim();
  // Place planet too
  if (!planet) planet = createPlanet();
};

zoomEnginesBtn.onclick = async ()=>{
  await animateCamera(
    new THREE.Vector3(-10,0,-315),
    new THREE.Vector3(-15,0,-318), 1200
  );
  setMode(2);
  // Animate battery electrons
  engines.forEach(bat=>{
    bat.userData.electronPhase = 0;
  });
  // Chemistry explanation
  showChemistry(`<h3>Galvanic Cell Engines</h3>
    <p>The Death Star's engines are powered by battery cells (galvanic/voltaic cells). 
    Electrons flow from the anode (Zn) to the cathode (Cu) through an external circuit, 
    driven by a spontaneous redox reaction:</p>
    <pre>Zn (s) + Cu<sup>2+</sup> (aq) → Zn<sup>2+</sup> (aq) + Cu (s)</pre>
    <p>Electrons are depicted as yellow spheres, moving from anode to cathode, 
    representing electrical current powering the Death Star.</p>
  `);
};

powerLaserBtn.onclick = async ()=>{
  // Zoom out to see Death Star and planet
  await animateCamera(
    new THREE.Vector3(40,30,-200),
    new THREE.Vector3(0,0,-300), 1400
  );
  setMode(3);
};

zoomSuperlaserBtn.onclick = async ()=>{
  await animateCamera(
    new THREE.Vector3(25, 10, -310),
    new THREE.Vector3(18, 10, -315), 1200
  );
  setMode(4);
  showChemistry(`<h3>Superlaser Chemistry</h3>
    <p>The superlaser uses a fictional high-energy chemical reaction and the photoelectric effect to emit a powerful beam:</p>
    <ul>
      <li>Energy excites electrons in a cathode material, causing emission of photons (laser light) via the photoelectric effect.</li>
      <li><b>Photoelectric effect:</b> e<sup>-</sup> + hν → e<sup>-</sup> (emitted)</li>
      <li>Population inversion and stimulated emission amplify the photons into a coherent laser beam.</li>
    </ul>
    <p>Real lasers use materials like ruby or semiconductors; here, a powerful reaction drives the process.</p>
  `);
};

fireLaserBtn.onclick = async ()=>{
  // Zoom out, unfreeze, show laser beam
  await animateCamera(
    new THREE.Vector3(40,30,-200),
    new THREE.Vector3(60,0,-300), 1200
  );
  setMode(5);
  // Show laser
  if (!laserBeam) laserBeam = createLaser();
  laserBeam.visible = true;
  // Animate laser firing
  let t=0;
  function fireAnim() {
    t+=0.02;
    laserBeam.scale.y = lerp(0.2, 1, t);
    if(t<1) requestAnimationFrame(fireAnim);
    else setMode(6);
  }
  fireAnim();
};

zoomImpactBtn.onclick = async ()=>{
  // Freeze laser at planet, zoom in
  await animateCamera(
    new THREE.Vector3(120,0,-260),
    new THREE.Vector3(120,0,-300), 1200
  );
  setMode(7);
  showChemistry(`<h3>Impact: Heat Transfer & Chemistry</h3>
    <p>The laser's energy is transferred to the planet's surface, causing rapid heating and vaporization:</p>
    <ul>
      <li><b>Energy transfer:</b> E = mcΔT</li>
      <li>Rapid heat causes chemical bonds to break; material ionizes and vaporizes.</li>
      <li>Phase change and plasma formation result in explosive expansion.</li>
    </ul>
    <p>Example: SiO<sub>2</sub> (solid) → SiO<sub>2</sub> (gas) + energy</p>
  `);
};

explodePlanetBtn.onclick = async ()=>{
  // Zoom out, animate planet explosion
  await animateCamera(
    new THREE.Vector3(80,20,-200),
    new THREE.Vector3(120,0,-300), 1000
  );
  setMode(8);
  // Hide laser
  if(laserBeam) laserBeam.visible = false;
  // Animate explosion by spawning particles
  let pGeo = new THREE.SphereGeometry(2,8,8);
  let pMat = new THREE.MeshStandardMaterial({color:0xffff00, emissive:0xff5500});
  for(let i=0;i<100;i++) {
    let p = new THREE.Mesh(pGeo, pMat);
    let theta = Math.random()*2*Math.PI, phi = Math.random()*Math.PI;
    let r = 5+Math.random()*5;
    p.position.set(
      120 + Math.sin(phi)*Math.cos(theta)*r,
      Math.cos(phi)*r,
      -300 + Math.sin(phi)*Math.sin(theta)*r
    );
    p.userData.v = new THREE.Vector3(
      Math.sin(phi)*Math.cos(theta)*8,
      Math.cos(phi)*8,
      Math.sin(phi)*Math.sin(theta)*8
    );
    scene.add(p);
    explosionParticles.push(p);
  }
  planet.visible = false;
  // Chemistry
  showChemistry(`<h3>Planet Destruction</h3>
    <p>Extreme heat and rapid energy transfer cause massive chemical bond breakage and vaporization. 
    The planet explodes as the energy exceeds gravitational binding energy.</p>
  `);
};

// === INIT ===
setMode(0);

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // Animate battery electrons if in engine mode
  if(mode===2 && engines) {
    engines.forEach(bat=>{
      let t = bat.userData.electronPhase = (bat.userData.electronPhase||0)+0.05;
      bat.userData.electrons.forEach((e,i)=>{
        let s = Math.sin(t+i);
        e.position.y = lerp(-4,4,i/7) + Math.sin(t+i)*0.5;
        e.position.x = lerp(-1.2,1.2,i/7) + Math.cos(t+i*1.1)*0.4;
      });
    });
  }
  // Animate explosion
  if(mode===8 && explosionParticles.length>0) {
    explosionParticles.forEach(p=>{
      p.position.add(p.userData.v.clone().multiplyScalar(0.04));
      p.userData.v.multiplyScalar(0.98);
    });
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});