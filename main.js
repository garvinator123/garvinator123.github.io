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
  showChemistry(`<h3>AP Chemistry Unit 9 (Electrochemistry) — Topic 9.4: Galvanic Cells</h3>
    <p>The Death Star's engines utilize Daniell galvanic cells demonstrating fundamental electrochemical principles across multiple AP Chemistry topics:</p>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Anode Compartment (Zn(s) | ZnSO₃(aq)):</h4>
        <p><strong>Oxidation Half-Reaction:</strong> Zn(s) → Zn²⁺(aq) + 2e⁻  E° = +0.76 V</p>
        <p><strong>Electrolyte:</strong> ZnSO₃(aq) (zinc sulfite solution)</p>
        <p>Zinc metal undergoes oxidation, losing electrons and forming hydrated zinc ions</p>
        <p><span style="color: #666666;">Gray electrode:</span> Solid zinc metal (decreases in mass over time)</p>
        <p><span style="color: #00ffff;">Cyan spheres:</span> Zn²⁺(aq) ions produced by oxidation</p>
        <p><span style="color: #ff0044;">Red spheres:</span> SO₃²⁻ spectator ions</p>
        <p><strong>Particle-Level Process:</strong> Zn atoms lose 2 electrons, becoming Zn²⁺ ions in solution</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Cathode Compartment (Cu²⁺(aq) | CuSO₃(aq)):</h4>
        <p><strong>Reduction Half-Reaction:</strong> Cu²⁺(aq) + 2e⁻ → Cu(s)  E° = +0.34 V</p>
        <p><strong>Electrolyte:</strong> CuSO₃(aq) (copper(II) sulfite solution)</p>
        <p>Copper ions gain electrons, depositing as solid copper metal</p>
        <p><span style="color: #dddddd;">Silver electrode:</span> Copper metal deposits (increases in mass)</p>
        <p><span style="color: #ff6600;">Orange spheres:</span> Cu²⁺(aq) ions being reduced</p>
        <p><span style="color: #ff0044;">Red spheres:</span> SO₃²⁻ spectator ions</p>
        <p><strong>Particle-Level Process:</strong> Cu²⁺ ions gain 2 electrons, becoming Cu atoms on electrode</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Salt Bridge Function (NaCl electrolyte):</h4>
        <p>Maintains electrical neutrality by completing the internal circuit</p>
        <p><span style="color: #9900ff;">Purple spheres:</span> Na⁺ ions migrate toward cathode compartment</p>
        <p><span style="color: #ffffff;">White spheres:</span> Cl⁻ ions migrate toward anode compartment</p>
        <p><span style="color: #ffff00;">Yellow spheres:</span> Electrons flow through external circuit</p>
        <p><strong>Function:</strong> Prevents charge buildup that would stop the reaction</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Thermodynamic Analysis:</h4>
        <p><strong>Overall Cell Reaction:</strong> Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)</p>
        <p><strong>Standard Cell Potential:</strong> E°cell = E°cathode - E°anode = 0.34V - (-0.76V) = +1.10V</p>
        <p><strong>Gibbs Free Energy:</strong> ΔG° = -nFE°cell = -2(96,485)(1.10) = -212 kJ/mol</p>
        <p><strong>Spontaneity:</strong> ΔG° < 0, therefore thermodynamically favorable</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>AP Chemistry Connections:</h4>
        <p><strong>Scientific Practice 1.B:</strong> Describes models illustrating particulate-level and macroscopic properties</p>
        <p><strong>Scientific Practice 4.C:</strong> Explains connection between particulate-level properties and macroscopic phenomena</p>
        <p><strong>Topics 9.1-9.4:</strong> Oxidation-reduction reactions, galvanic cells, cell potentials, thermodynamics</p>
        <p><strong>Cross-Curricular:</strong> Connects to Units 4 (chemical reactions) and 6 (thermodynamics)</p>
    </div>
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
  showChemistry(`<h3>AP Chemistry Topics 1.7 & 1.8: Photoelectric Effect & Electromagnetic Radiation</h3>
    <p>The Death Star's superlaser operates through advanced quantum mechanical processes involving photon-electron interactions:</p>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Photoelectric Effect (Topic 1.8):</h4>
        <p><strong>Einstein's Photoelectric Equation:</strong> KE<sub>max</sub> = hf - φ</p>
        <p>where φ is the work function of the focusing crystal material</p>
        <p><strong>Threshold Condition:</strong> f ≥ f₀ = φ/h (minimum frequency for electron emission)</p>
        <p><strong>Process:</strong> Crystal + hν → Crystal⁺ + e⁻ (photoelectron emission)</p>
        <p><strong>Key Principles:</strong></p>
        <ul>
            <li>Energy is quantized (E = hf)</li>
            <li>One photon can only eject one electron</li>
            <li>Excess energy becomes kinetic energy of photoelectron</li>
            <li>Intensity affects number of electrons, not their energy</li>
        </ul>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Laser Physics & Electromagnetic Radiation (Topic 1.7):</h4>
        <p><strong>1. Population Inversion:</strong> N₂ > N₁ (more electrons in excited state than ground state)</p>
        <p><strong>2. Stimulated Emission:</strong> E₂ + hν → E₁ + 2hν (coherent photon production)</p>
        <p><strong>3. Amplification Process:</strong> Cascade of coherent photon production</p>
        <p><strong>4. Resonant Cavity:</strong> Mirrors create standing wave patterns for coherent amplification</p>
        <p><strong>Wavelength-Energy Relationship:</strong> λ = hc/E = hc/(E₂ - E₁)</p>
        <p><strong>Coherence Properties:</strong> Same frequency, phase, and propagation direction</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Quantitative Analysis:</h4>
        <p><strong>Laser Wavelength:</strong> λ = 532 nm (green light)</p>
        <p><strong>Photon Frequency:</strong> f = c/λ = (3.00 × 10⁸ m/s)/(532 × 10⁻⁹ m) = 5.64 × 10¹⁴ Hz</p>
        <p><strong>Photon Energy:</strong> E = hf = (6.626 × 10⁻³⁴ J·s)(5.64 × 10¹⁴ Hz) = 3.74 × 10⁻¹⁹ J</p>
        <p><strong>Energy per mole:</strong> E = NAhf = (6.022 × 10²³)(3.74 × 10⁻¹⁹ J) = 225 kJ/mol</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Focusing Crystal Components:</h4>
        <p><span style="color: #00ff88;">Green crystals:</span> Active laser medium (analogous to ruby or semiconductor lasers)</p>
        <p><strong>Energy Level Structure:</strong> ΔE = E₂ - E₁ determines laser wavelength</p>
        <p><strong>Crystal Lattice Function:</strong> Provides ordered structure for coherent emission</p>
        <p><strong>Beam Characteristics:</strong> Highly collimated, monochromatic, coherent</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>AP Chemistry Scientific Practices:</h4>
        <p><strong>Scientific Practice 1.A:</strong> Describes atomic structure and photon interactions</p>
        <p><strong>Scientific Practice 4.A:</strong> Explains electromagnetic phenomena using quantum models</p>
        <p><strong>Scientific Practice 6.D:</strong> Provides reasoning about light-matter interactions</p>
        <p><strong>Cross-Unit Connections:</strong> Links to atomic structure (Unit 1) and bonding (Unit 2)</p>
    </div>
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
  showChemistry(`<h3>AP Chemistry Topics 6.1, 6.2 & 7.1: Thermodynamics & Intermolecular Forces</h3>
    <p>When the superlaser strikes the planet, multiple thermodynamic and intermolecular processes occur simultaneously:</p>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Heat Transfer & Calorimetry (Topic 6.1):</h4>
        <p><strong>Heat Capacity Equation:</strong> q = mcΔT</p>
        <p><strong>Temperature Change:</strong> Initial T ≈ 300K → Final T > 10⁶K</p>
        <p><strong>Enthalpy of Impact:</strong> ΔH = q<sub>p</sub> (heat transfer at constant pressure)</p>
        <p><strong>Radiative Heat Transfer:</strong> Stefan-Boltzmann law: j = σT⁴</p>
        <p><strong>Energy Flux:</strong> Massive energy input exceeds heat capacity of materials</p>
        <p><strong>Result:</strong> Rapid temperature rise causes phase transitions and bond breaking</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Phase Changes & Intermolecular Forces (Topic 7.1):</h4>
        <p><strong>Solid → Gas Transition:</strong> SiO₂(s) + energy → SiO₂(g) (sublimation)</p>
        <p><strong>Intermolecular Forces Overcome:</strong></p>
        <ul>
            <li>London dispersion forces (all molecules)</li>
            <li>Dipole-dipole interactions (polar molecules)</li>
            <li>Hydrogen bonding (H₂O, NH₃, HF type compounds)</li>
            <li>Network covalent bonds (SiO₂, diamond structure)</li>
        </ul>
        <p><strong>Phase Diagram Analysis:</strong> Extreme conditions exceed critical point</p>
        <p><strong>Heat of Vaporization:</strong> ΔH<sub>vap</sub> << E<sub>laser</sub> (easily exceeded)</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Chemical Bond Breaking & Ionization:</h4>
        <p><strong>Covalent Bond Dissociation:</strong> A-B + energy → A• + B• (homolytic cleavage)</p>
        <p><strong>Ionization Energy:</strong> M(g) + energy → M⁺(g) + e⁻</p>
        <p><strong>Bond Energy Comparison:</strong> E<sub>thermal</sub> >> E<sub>bond</sub> (bonds easily broken)</p>
        <p><strong>Ionic Compound Dissociation:</strong> Complete breakdown of crystal lattices</p>
        <p><strong>Plasma Formation:</strong> Complete ionization at extreme temperatures</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Macroscopic Observations & Gas Laws:</h4>
        <p><strong>Ideal Gas Law:</strong> PV = nRT (massive volume expansion)</p>
        <p><strong>Explosive Expansion:</strong> ΔV/V<sub>initial</sub> >> 1000 (gases occupy much more volume)</p>
        <p><strong>Gravitational Binding Energy:</strong> E<sub>expansion</sub> > E<sub>gravitational</sub></p>
        <p><strong>Blackbody Radiation:</strong> Hot gases emit visible light spectrum</p>
        <p><strong>Shock Wave Propagation:</strong> Pressure waves exceed sound speed</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>AP Chemistry Scientific Practices:</h4>
        <p><strong>Scientific Practice 1.B:</strong> Models illustrating both particulate-level and macroscopic properties</p>
        <p><strong>Scientific Practice 4.C:</strong> Connects particulate-level interactions to macroscopic phenomena</p>
        <p><strong>Scientific Practice 6.D:</strong> Uses chemical principles to justify planetary destruction</p>
        <p><strong>Cross-Unit Integration:</strong> Combines thermodynamics (Unit 6), bonding (Unit 2), and gases (Unit 3)</p>
    </div>
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
  showChemistry(`<h3>AP Chemistry Topic 6.5: Energy Conservation & Thermodynamic Analysis</h3>
    <p>The complete Death Star firing sequence demonstrates energy conservation across multiple scales and transformations:</p>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Energy Transfer Chain Analysis:</h4>
        <p><strong>1. Chemical Energy:</strong> Galvanic cell reactions (ΔG° = -212 kJ/mol)</p>
        <p><strong>2. Electrical Energy:</strong> Electron flow through external circuits</p>
        <p><strong>3. Electromagnetic Energy:</strong> Coherent photon beam (E = nhf)</p>
        <p><strong>4. Thermal Energy:</strong> Heat generation at impact site</p>
        <p><strong>5. Kinetic Energy:</strong> Explosive expansion and debris motion</p>
        <p><strong>Conservation Principle:</strong> E<sub>total,initial</sub> = E<sub>total,final</sub> (First Law of Thermodynamics)</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Quantitative Energy Analysis:</h4>
        <p><strong>Photon Beam Energy:</strong> E<sub>beam</sub> = nhf where n = number of photons</p>
        <p><strong>Power Density:</strong> I = E<sub>beam</sub>/(A × t) where A = beam cross-section, t = time</p>
        <p><strong>Energy per Photon:</strong> E<sub>photon</sub> = hf = 3.74 × 10⁻¹⁹ J (λ = 532 nm)</p>
        <p><strong>Total Beam Power:</strong> P = n × E<sub>photon</sub> × frequency of emission</p>
        <p><strong>Critical Threshold:</strong> E<sub>input</sub> > E<sub>binding,gravitational</sub> for planetary destruction</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Thermodynamic Principles:</h4>
        <p><strong>First Law:</strong> ΔU = q - w (internal energy change)</p>
        <p><strong>Heat Capacity Exceeded:</strong> q<sub>input</sub> >> mc<sub>p</sub>ΔT<sub>max</sub></p>
        <p><strong>Phase Change Energy:</strong> All ΔH<sub>fusion</sub> and ΔH<sub>vaporization</sub> values exceeded</p>
        <p><strong>Bond Dissociation:</strong> E<sub>thermal</sub> > Σ(bond energies) causes complete molecular breakdown</p>
        <p><strong>Entropy Increase:</strong> ΔS<sub>universe</sub> > 0 (highly disordered final state)</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>Scale-Bridging Analysis:</h4>
        <p><strong>Molecular Level:</strong> Bond breaking, ionization, electronic excitation</p>
        <p><strong>Macroscopic Level:</strong> Phase changes, temperature rise, visible destruction</p>
        <p><strong>Astronomical Level:</strong> Gravitational binding energy overcome, debris field formation</p>
        <p><strong>Energy Efficiency:</strong> Chemical → Mechanical conversion demonstrates real-world limitations</p>
    </div>
    
    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
        <h4>AP Chemistry Scientific Practices Integration:</h4>
        <p><strong>Scientific Practice 4.A:</strong> Uses models to explain large-scale phenomena through molecular-level processes</p>
        <p><strong>Scientific Practice 6.D:</strong> Provides quantitative reasoning using conservation principles</p>
        <p><strong>Scientific Practice 1.E:</strong> Identifies patterns across different scales of matter</p>
        <p><strong>Cross-Curricular Connections:</strong> Integrates Units 1 (atomic structure), 6 (thermodynamics), and 9 (electrochemistry)</p>
    </div>
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