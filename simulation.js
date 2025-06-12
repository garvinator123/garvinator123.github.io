// Death Star Chemical Simulation
// Created for issue #1 in Death-Star-Simulation

class DeathStarSimulation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.objects = {};
        this.state = 'init';
        this.setupScene();
        this.setupLights();
        this.setupControls();
        this.createStarfield();
        this.animate();
        this.laserCharge = 0;
        this.photons = [];
        this.textureLoader = new THREE.TextureLoader();
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 30, 100);
        
        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);

        // Add a subtle blue rim light for dramatic effect
        const rimLight = new THREE.DirectionalLight(0x0044ff, 0.3);
        rimLight.position.set(-10, 0, -10);
        this.scene.add(rimLight);
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 500;
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.5,
            sizeAttenuation: true
        });

        const starsVertices = [];
        for(let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(starsVertices, 3));
        
        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
    }

    createDeathStar() {
        const geometry = new THREE.SphereGeometry(20, 64, 64); // Increased segments for better detail
    
        // Load and apply Death Star texture
        const deathStarTexture = this.textureLoader.load('deathstartexture.jpg', (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 2); // Adjust repeat to match the pattern
            texture.offset.y = 0.5;   // Adjust offset to align patterns
        });

        const material = new THREE.MeshPhongMaterial({
            map: deathStarTexture,
            bumpMap: deathStarTexture,    // Use same texture for bump mapping
            bumpScale: 0.5,               // Adjust bump intensity
            shininess: 30,
            color: 0xaaaaaa              // Slightly lighter to show texture better
        });

        const deathStar = new THREE.Mesh(geometry, material);

        // Enhanced superlaser dish with components
        this.createSuperlaser(deathStar);
        
        // Add engine section
        this.createEngineSection(deathStar);

        this.objects.deathStar = deathStar;
        deathStar.position.z = -1000;
        deathStar.scale.set(0.1, 0.1, 0.1);
        this.scene.add(deathStar);
    }

    createSuperlaser(deathStar) {
        const superlaserGroup = new THREE.Group();
        
        // Create the main concave dish using a sphere with a "bite" taken out
        const dishRadius = 6;
        const dishDepth = 3;
        
        // First, create a depression in the Death Star sphere by cutting out a section
        // We'll position the dish so it's flush with the Death Star surface
        
        // Create the outer rim first
        const rimGeometry = new THREE.RingGeometry(dishRadius - 0.5, dishRadius + 0.5, 32);
        const rimMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            side: THREE.DoubleSide
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        
        // Remove the problematic sphere dish - keeping only rings and other components
        
        // Create concentric rings inside the dish
        const ringColors = [0x444444, 0x555555, 0x666666, 0x777777];
        for (let i = 0; i < 4; i++) {
            const radius = dishRadius - (i + 1) * 1.2;
            if (radius > 0) {
                const ringGeometry = new THREE.RingGeometry(radius - 0.2, radius, 32);
                const ringMaterial = new THREE.MeshPhongMaterial({
                    color: ringColors[i],
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.z = i * 0.3; // Stepped depth
                superlaserGroup.add(ring);
            }
        }
        
        // Central focusing lens
        const lensGeometry = new THREE.CircleGeometry(1.5, 32);
        const lensMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 100,
            side: THREE.DoubleSide
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.z = 2;
        
        // Add 8 focusing crystals around the central lens (smaller and inside dish)
        this.focusingCrystals = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const crystal = this.createFocusingCrystal();
            crystal.position.set(
                Math.cos(angle) * 2.5,
                Math.sin(angle) * 2.5,
                1.5
            );
            crystal.scale.setScalar(0.3); // Much smaller
            this.focusingCrystals.push(crystal);
            superlaserGroup.add(crystal);
        }
        
        // Add support struts
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const strutGeometry = new THREE.BoxGeometry(0.1, 3, 0.1);
            const strutMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            
            strut.position.set(
                Math.cos(angle) * 4,
                Math.sin(angle) * 4,
                1
            );
            strut.rotation.z = angle;
            superlaserGroup.add(strut);
        }
        
        // Add all components
        superlaserGroup.add(rim);
        superlaserGroup.add(lens);
        
        // Position the superlaser on the surface of the Death Star sphere
        // Death Star has radius 20, so we position at radius 21 to be clearly visible
        const superlaserDirection = new THREE.Vector3(1, 0.5, 0.3).normalize();
        superlaserGroup.position.copy(superlaserDirection.multiplyScalar(21));
        
        // Orient the superlaser to point outward from the Death Star center
        const lookAtTarget = superlaserGroup.position.clone().add(superlaserDirection.multiplyScalar(50));
        superlaserGroup.lookAt(lookAtTarget);
        
        deathStar.add(superlaserGroup);
        this.objects.superlaser = superlaserGroup;
    }

    createFocusingCrystal() {
        const crystalGeometry = new THREE.OctahedronGeometry(0.3); // Smaller size
        const crystalMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            shininess: 100,
            transparent: true,
            opacity: 0.7,
            emissive: 0x004422 // Subtle glow
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.userData.baseColor = new THREE.Color(0x00ff88);
        crystal.userData.powerLevel = 0;
        
        return crystal;
    }

    powerUpLaser() {
        if (this.state !== 'engines') return;
        this.state = 'powering';

        // First, let's get the Death Star's position
        const deathStar = this.objects.deathStar;
        const deathStarPos = new THREE.Vector3();
        deathStar.getWorldPosition(deathStarPos);

        // Position camera to view the superlaser from a good angle
        this.camera.position.set(
            deathStarPos.x + 50,  // Slightly to the right of Death Star
            deathStarPos.y + 10,  // Slightly above
            deathStarPos.z - 20   // Closer to viewer
        );

        // Set controls target to the superlaser position
        const superlaserPos = new THREE.Vector3();
        this.objects.superlaser.getWorldPosition(superlaserPos);
        this.controls.target.copy(superlaserPos);

        let powerLevel = 0;
        const powerUp = () => {
            if (powerLevel >= 1) {
                this.state = 'powered';
                document.getElementById('examineChemistry').disabled = false;
                return;
            }

            powerLevel += 0.01;
            this.laserCharge = powerLevel;

            // Animate crystals
            this.focusingCrystals.forEach(crystal => {
                crystal.material.emissive = crystal.userData.baseColor.clone()
                    .multiplyScalar(powerLevel);
                crystal.scale.setScalar(1 + powerLevel * 0.2);
                crystal.userData.powerLevel = powerLevel;
            });

            // Add photon particles
            if (Math.random() < powerLevel * 0.3) {
                this.createPhoton();
            }

            // Make sure chemistry info is showing during power-up
            this.showChemistryInfo('powering');

            requestAnimationFrame(powerUp);
        };

        powerUp();
    }

    createPhoton() {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1
        });

        const photon = new THREE.Mesh(geometry, material);
        
        // Adjust starting positions for equatorial superlaser
        const crystal = this.focusingCrystals[
            Math.floor(Math.random() * this.focusingCrystals.length)
        ];
        photon.position.copy(crystal.position);
        photon.position.add(this.objects.superlaser.position);
        
        // Update velocity vector for horizontal firing
        photon.userData.velocity = new THREE.Vector3(
            0.2, // Move outward from Death Star
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );

        this.scene.add(photon);
        this.photons.push(photon);
    }

    examineSuperlaser() {
        if (this.state !== 'powered') return;
        this.state = 'examining';

        // Get Death Star position
        const deathStar = this.objects.deathStar;
        const deathStarPos = new THREE.Vector3();
        deathStar.getWorldPosition(deathStarPos);

        // Calculate superlaser world position
        const superlaserLocalPos = new THREE.Vector3(8, 12, 8);
        const superlaserWorldPos = superlaserLocalPos.clone().add(deathStarPos);

        // Position camera to view the superlaser dish
        const cameraPos = new THREE.Vector3(
            superlaserWorldPos.x + 15,
            superlaserWorldPos.y + 5,
            superlaserWorldPos.z + 15
        );

        // Smooth camera transition
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        let progress = 0;

        const animate = () => {
            if (progress >= 1) {
                document.getElementById('fire').disabled = false;
                return;
            }

            progress += 0.02;
            const ease = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPos, cameraPos, ease);
            this.controls.target.lerpVectors(startTarget, superlaserWorldPos, ease);
            this.controls.update();

            this.showChemistryInfo('laser');
            requestAnimationFrame(animate);
        };

        animate();
    }

    fireLaser() {
        if (this.state !== 'examining') return;
        this.state = 'firing';

        // Get superlaser world position and direction
        const deathStar = this.objects.deathStar;
        const superlaserGroup = this.objects.superlaser;
        
        const superlaserWorldPos = new THREE.Vector3();
        superlaserGroup.getWorldPosition(superlaserWorldPos);
        
        // Get the direction the superlaser is pointing
        const superlaserDirection = new THREE.Vector3();
        superlaserGroup.getWorldDirection(superlaserDirection);
        
        // Create laser beam
        const beamLength = 800;
        const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, beamLength, 16, 1);
        const beamMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00ff00,
            emissiveIntensity: 0.7
        });

        this.laserBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beam starting from superlaser and extending in its direction
        const beamPosition = superlaserWorldPos.clone().add(
            superlaserDirection.clone().multiplyScalar(beamLength / 2)
        );
        this.laserBeam.position.copy(beamPosition);
        
        // Align beam with superlaser direction
        this.laserBeam.lookAt(beamPosition.clone().add(superlaserDirection));
        this.laserBeam.rotateX(Math.PI / 2); // Cylinder points along Y-axis by default
        
        this.scene.add(this.laserBeam);

        // Create energy particles along the beam
        this.energyParticles = new THREE.Group();
        for (let i = 0; i < 1000; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const particleMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.8
            });

            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles along beam direction
            const particleDistance = Math.random() * beamLength;
            particle.position.copy(superlaserWorldPos).add(
                superlaserDirection.clone().multiplyScalar(particleDistance)
            );
            
            // Add some randomness perpendicular to beam direction
            const perpendicular1 = new THREE.Vector3().crossVectors(superlaserDirection, new THREE.Vector3(0, 1, 0)).normalize();
            const perpendicular2 = new THREE.Vector3().crossVectors(superlaserDirection, perpendicular1).normalize();
            
            particle.position.add(perpendicular1.multiplyScalar((Math.random() - 0.5) * 2));
            particle.position.add(perpendicular2.multiplyScalar((Math.random() - 0.5) * 2));
            
            particle.userData.speed = Math.random() * 2 + 1;
            particle.userData.offset = Math.random() * Math.PI * 2;
            particle.userData.basePosition = particle.position.clone();
            particle.userData.direction = superlaserDirection.clone();
            this.energyParticles.add(particle);
        }
        
        this.scene.add(this.energyParticles);

        // Add heat distortion effect
        const heatGeometry = new THREE.PlaneGeometry(beamLength, 20, 50, 1);
        const heatMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
        });

        this.heatDistortion = new THREE.Mesh(heatGeometry, heatMaterial);
        this.heatDistortion.position.copy(beamPosition);
        this.heatDistortion.lookAt(beamPosition.clone().add(superlaserDirection));
        this.scene.add(this.heatDistortion);

        // Camera animation for firing sequence
        const cameraPos = new THREE.Vector3().copy(superlaserWorldPos).add(
            new THREE.Vector3().crossVectors(superlaserDirection, new THREE.Vector3(0, 1, 0))
                .normalize().multiplyScalar(50)
        ).add(new THREE.Vector3(0, 30, 0));

        let progress = 0;
        const animate = () => {
            if (progress >= 1) {
                document.getElementById('analyze').disabled = false;
                return;
            }

            progress += 0.01;
            
            // Beam effects
            this.laserBeam.material.opacity = 0.8 + Math.sin(progress * 20) * 0.2;
            this.laserBeam.material.emissiveIntensity = 0.7 + Math.sin(progress * 20) * 0.3;
            
            this.showChemistryInfo('firing');
            requestAnimationFrame(animate);
        };

        animate();
    }

    analyzeImpact() {
        if (this.state !== 'firing') return;
        this.state = 'analyzing';

        // Create target planet
        const planetGeometry = new THREE.SphereGeometry(30, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({
            color: 0x4444ff,
            shininess: 30,
            transparent: true,
            opacity: 1
        });

        this.targetPlanet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Position planet at end of laser beam using proper direction
        const superlaserGroup = this.objects.superlaser;
        const superlaserWorldPos = new THREE.Vector3();
        superlaserGroup.getWorldPosition(superlaserWorldPos);
        
        const superlaserDirection = new THREE.Vector3();
        superlaserGroup.getWorldDirection(superlaserDirection);
        
        // Place planet at distance along laser direction
        this.targetPlanet.position.copy(superlaserWorldPos).add(
            superlaserDirection.clone().multiplyScalar(800)
        );
        
        this.scene.add(this.targetPlanet);

        // Create impact point on planet surface closest to laser
        const impactGeometry = new THREE.SphereGeometry(5, 32, 32);
        const impactMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });

        this.impactPoint = new THREE.Mesh(impactGeometry, impactMaterial);
        this.impactPoint.position.copy(this.targetPlanet.position).add(
            superlaserDirection.clone().multiplyScalar(-29) // Position on planet surface facing the laser
        );
        this.scene.add(this.impactPoint);

        // Create plasma particles
        this.plasmaParticles = new THREE.Group();
        for (let i = 0; i < 500; i++) {
            const plasmaGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const plasmaMaterial = new THREE.MeshPhongMaterial({
                color: 0xff3300,
                emissive: 0xff3300,
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.8
            });

            const particle = new THREE.Mesh(plasmaGeometry, plasmaMaterial);
            particle.position.copy(this.impactPoint.position);
            
            // Random initial velocity
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            
            this.plasmaParticles.add(particle);
        }
        this.scene.add(this.plasmaParticles);

        // Create shockwave ring
        const ringGeometry = new THREE.RingGeometry(0, 1, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        this.shockwave = new THREE.Mesh(ringGeometry, ringMaterial);
        this.shockwave.position.copy(this.impactPoint.position);
        this.shockwave.lookAt(this.camera.position);
        this.scene.add(this.shockwave);

        // Position camera for impact view
        const cameraPos = new THREE.Vector3(
            this.targetPlanet.position.x - 100,
            this.targetPlanet.position.y + 50,
            this.targetPlanet.position.z - 100
        );

        let progress = 0;
        const animate = () => {
            if (progress >= 1) {
                document.getElementById('reset').disabled = false;
                return;
            }

            progress += 0.002;
            const ease = 1 - Math.pow(1 - progress, 3);

            // Move camera
            this.camera.position.lerp(cameraPos, 0.02);
            this.controls.target.lerp(this.targetPlanet.position, 0.02);

            // Expand impact point
            this.impactPoint.scale.setScalar(1 + progress * 5);
            this.impactPoint.material.opacity = 0.8 - progress * 0.3;

            // Expand shockwave
            this.shockwave.scale.setScalar(progress * 50);
            this.shockwave.material.opacity = 0.5 - progress * 0.5;

            // Planet destruction effects
            this.targetPlanet.material.opacity = 1 - progress * 0.5;
            
            // Distort planet geometry
            const vertices = this.targetPlanet.geometry.attributes.position.array;
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const y = vertices[i + 1];
                const z = vertices[i + 2];
                const distance = Math.sqrt(x * x + y * y + z * z);
                const distortionAmount = Math.sin(distance + progress * 10) * progress;
                vertices[i] *= 1 + distortionAmount * 0.2;
                vertices[i + 1] *= 1 + distortionAmount * 0.2;
                vertices[i + 2] *= 1 + distortionAmount * 0.2;
            }
            this.targetPlanet.geometry.attributes.position.needsUpdate = true;

            // Update chemistry info with current temperature and reaction progress
            this.showChemistryInfo('impact');

            requestAnimationFrame(animate);
        };

        animate();
    }

    showChemistryInfo(section) {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.style.display = 'block'; // Make sure panel is visible
        
        let content = ''; // Declare content outside switch statement

        switch(section) {
            case 'engines':
                content = `
                    <h3>Galvanic Cell Engines</h3>
                    <p>The Death Star's engines are powered by massive galvanic cells:</p>
                    <ul>
                        <li>Anode (Gray): Zn → Zn²⁺ + 2e⁻</li>
                        <li>Cathode (Copper): Cu²⁺ + 2e⁻ → Cu</li>
                        <li>Overall: Zn + Cu²⁺ → Zn²⁺ + Cu</li>
                    </ul>
                    <p>The spontaneous electron flow powers the engine systems.</p>
                    <p>∆G° = -nFE° = -2(96,485)(1.10) = -212.27 kJ/mol</p>
                `;
                break;

            case 'powering':
                content = `
                    <h3>Superlaser Power-Up Sequence</h3>
                    <p>Energy from the galvanic cells is converted to excite electrons in the focusing crystals:</p>
                    <ul>
                        <li>E = hf (Planck's equation)</li>
                        <li>Wavelength: 532nm (green)</li>
                        <li>Energy per photon: 3.72 x 10⁻¹⁹ J</li>
                    </ul>
                    <p>Crystal lattice amplification creates a cascade of coherent photons.</p>
                    <p>Current Power Level: ${Math.round(this.laserCharge * 100)}%</p>
                `;
                break;

            case 'laser':
                content = `
                    <h3>Photoelectric Effect & Laser Operation</h3>
                    <p>The superlaser operates through quantum amplification:</p>
                    <ol>
                        <li>Electron excitation: E₂ - E₁ = hf</li>
                        <li>Stimulated emission in crystals</li>
                        <li>Coherent photon multiplication</li>
                        <li>Beam convergence and amplification</li>
                    </ol>
                    <p>The focusing crystals create a resonant cavity for photon amplification,
                    similar to modern laser systems but at unprecedented scale.</p>
                    <div style="border-top: 1px solid #0f0; margin-top: 10px; padding-top: 10px;">
                        <p>Einstein's Photoelectric Effect:</p>
                        <p>KEmax = hf - φ</p>
                        <p>where φ is the work function of the crystal material</p>
                    </div>
                `;
                break;
                
            case 'firing':
                content = `
                    <h3>Superlaser Firing Sequence</h3>
                    <p>Energy transfer and quantum phenomena during firing:</p>
                    <ul>
                        <li>Beam Energy: 10²⁹ joules</li>
                        <li>Temperature: >1,000,000K</li>
                        <li>Photon density: 10²⁴/cm³</li>
                    </ul>
                    <p>Quantum mechanical processes:</p>
                    <ol>
                        <li>Stimulated emission cascade</li>
                        <li>Coherent photon amplification</li>
                        <li>Beam collimation via magnetic containment</li>
                        <li>Space-time distortion due to energy density</li>
                    </ol>
                    <p>Heat transfer mechanisms:</p>
                    <ul>
                        <li>Radiative transfer: σT⁴</li>
                        <li>Plasma formation in target zone</li>
                        <li>Matter-Energy conversion at impact</li>
                    </ul>
                `;
                break;
            
            case 'impact':
                content = `
                    <h3>Target Impact Analysis</h3>
                    <p>Thermodynamic processes at impact site:</p>
                    <ul>
                        <li>Initial Temperature: 10⁶ K</li>
                        <li>Pressure: 10¹² Pa</li>
                        <li>Energy density: 10¹⁵ J/m³</li>
                    </ul>
                    <p>Chemical reactions in atmosphere:</p>
                    <ol>
                        <li>N₂ + O₂ → 2NO (ΔH = +180.6 kJ/mol)</li>
                        <li>2NO + O₂ → 2NO₂ (ΔH = -114.1 kJ/mol)</li>
                        <li>Plasma formation: e⁻ + M → M⁺ + 2e⁻</li>
                    </ol>
                    <p>Matter phase transitions:</p>
                    <ul>
                        <li>Solid → Liquid → Gas → Plasma</li>
                        <li>Core material vaporization</li>
                        <li>Atmospheric dissociation</li>
                    </ul>
                    <p>Conservation of Energy:</p>
                    <p>E = mc² conversion at impact</p>
                `;
                break;
        }

        infoPanel.innerHTML = content; // Set the content after switch statement
        infoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        infoPanel.style.color = '#0f0';
        infoPanel.style.padding = '20px';
        infoPanel.style.borderRadius = '10px';
        infoPanel.style.maxWidth = '400px';
        infoPanel.style.zIndex = '1000';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) this.controls.update();
        
        // Rotate starfield slowly for ambient movement
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
            this.starfield.rotation.z += 0.0001;
        }

        // Animate photons
        if (this.photons.length > 0) {
            this.photons.forEach((photon, index) => {
                // Update position
                photon.position.add(photon.userData.velocity);
                
                // Spiral towards convergence chamber
                const toCenter = new THREE.Vector3(0, 0, 17)
                    .sub(photon.position)
                    .normalize()
                    .multiplyScalar(0.1);
                
                photon.userData.velocity.add(toCenter);
                
                // Remove if too close to center or too old
                if (photon.position.distanceTo(new THREE.Vector3(0, 0, 17)) < 0.5) {
                    this.scene.remove(photon);
                    this.photons.splice(index, 1);
                }
            });
        }

        // Animate focusing crystals
        if (this.focusingCrystals && this.state === 'powered') {
            this.focusingCrystals.forEach(crystal => {
                crystal.rotation.y += 0.01;
                crystal.rotation.z += 0.02;
            });
        }

        // Animate electrons in engine cells
        if (this.engineAnimationActive && this.batteryCells) {
            this.batteryCells.forEach(battery => {
                battery.userData.electrons.forEach((electron, i) => {
                    // Update electron position
                    electron.userData.time += 0.01;
                    const t = electron.userData.time;

                    // Oscillating motion along x-axis
                    const x = electron.userData.startX + 
                            Math.sin(t + electron.userData.phase) * 0.8;
                    
                    // Vertical oscillation
                    const y = electron.userData.baseY + 
                            Math.sin(t * 2 + electron.userData.phase) * 0.2;

                    electron.position.set(x, y, 0);
                    
                    // Glow effect
                    electron.material.emissiveIntensity = 
                        0.5 + Math.sin(t * 3) * 0.2;
                });
            });
        }

        if (this.state === 'firing' && this.energyParticles) {
            this.energyParticles.children.forEach(particle => {
                // Move particles along beam direction
                particle.position.add(particle.userData.direction.clone().multiplyScalar(particle.userData.speed));
                
                // Reset particles that travel too far
                const distanceFromStart = particle.position.distanceTo(particle.userData.basePosition);
                if (distanceFromStart > 800) {
                    particle.position.copy(particle.userData.basePosition);
                }

                // Oscillate particles perpendicular to beam direction
                const time = Date.now() * 0.01 + particle.userData.offset;
                const perpendicular1 = new THREE.Vector3().crossVectors(particle.userData.direction, new THREE.Vector3(0, 1, 0)).normalize();
                const perpendicular2 = new THREE.Vector3().crossVectors(particle.userData.direction, perpendicular1).normalize();
                
                const oscillation1 = perpendicular1.clone().multiplyScalar(Math.sin(time) * 0.5);
                const oscillation2 = perpendicular2.clone().multiplyScalar(Math.cos(time) * 0.5);
                
                particle.position.add(oscillation1).add(oscillation2);

                // Pulse particle intensity
                particle.material.emissiveIntensity = 0.5 + Math.sin(time) * 0.5;
            });

            // Animate heat distortion
            if (this.heatDistortion) {
                this.heatDistortion.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
                // Distort the geometry for heat wave effect
                const vertices = this.heatDistortion.geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    vertices[i + 1] += Math.sin(Date.now() * 0.001 + vertices[i] * 0.1) * 0.1;
                }
                this.heatDistortion.geometry.attributes.position.needsUpdate = true;
            }
        }

        if (this.state === 'analyzing' && this.plasmaParticles) {
            this.plasmaParticles.children.forEach(particle => {
                // Update position
                particle.position.add(particle.userData.velocity);
                
                // Add gravity-like effect towards planet center
                const toCenter = this.targetPlanet.position.clone()
                    .sub(particle.position)
                    .normalize()
                    .multiplyScalar(0.1);
                
                particle.userData.velocity.add(toCenter);
                
                // Add some chaos
                particle.userData.velocity.x += (Math.random() - 0.5) * 0.1;
                particle.userData.velocity.y += (Math.random() - 0.5) * 0.1;
                particle.userData.velocity.z += (Math.random() - 0.5) * 0.1;
                
                // Fade out particles
                particle.material.opacity *= 0.99;
                
                // Remove if too faint
                if (particle.material.opacity < 0.01) {
                    this.plasmaParticles.remove(particle);
                }
            });
        }

        this.renderer.render(this.scene, this.camera);   
    }

    createEngineSection(deathStar) {
        const engineSection = new THREE.Group();
        engineSection.position.set(0, -10, -15); // Position at back of Death Star

        // Create multiple battery cells
        const batteryPositions = [
            { x: -8, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            { x: 8, y: 0, z: 0 }
        ];

        this.batteryCells = batteryPositions.map(pos => {
            const battery = this.createBatteryCell();
            battery.position.set(pos.x, pos.y, pos.z);
            engineSection.add(battery);
            return battery;
        });

        deathStar.add(engineSection);
        this.objects.engineSection = engineSection;
    }

    createBatteryCell() {
        const battery = new THREE.Group();

        // Create container (electrolyte solution)
        const containerGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
        const containerMat = new THREE.MeshPhongMaterial({
            color: 0x3366ff,
            transparent: true,
            opacity: 0.4
        });
        const container = new THREE.Mesh(containerGeo, containerMat);
        battery.add(container);

        // Create electrodes
        const electrodeGeo = new THREE.CylinderGeometry(0.3, 0.3, 7, 8);
        
        // Anode (Zinc)
        const anodeMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const anode = new THREE.Mesh(electrodeGeo, anodeMat);
        anode.position.x = -0.8;
        battery.add(anode);

        // Cathode (Copper)
        const cathodeMat = new THREE.MeshPhongMaterial({ color: 0xcd7f32 });
        const cathode = new THREE.Mesh(electrodeGeo, cathodeMat);
        cathode.position.x = 0.8;
        battery.add(cathode);

        // Add electrons for animation
        const electrons = [];
        const electronGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const electronMat = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 8; i++) {
            const electron = new THREE.Mesh(electronGeo, electronMat);
            electron.position.set(-0.8, -3 + i, 0);
            electron.userData.baseY = -3 + i;
            electron.userData.phase = i * Math.PI / 4;
            battery.add(electron);
            electrons.push(electron);
        }

        battery.userData.electrons = electrons;
        return battery;
    }

    zoomToEngines() {
        if (this.state !== 'ready') return;
        this.state = 'engines';

        // Calculate target position for camera
        const engineSection = this.objects.engineSection;
        const deathStar = this.objects.deathStar;
        const targetPos = new THREE.Vector3();
        engineSection.getWorldPosition(targetPos);

        // Animate camera movement
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const endPos = new THREE.Vector3(
            targetPos.x,
            targetPos.y + 5,
            targetPos.z + 20
        );

        let progress = 0;
        const animate = () => {
            if (progress >= 1) {
                this.startEngineAnimation();
                document.getElementById('powerUp').disabled = false;
                return;
            }

            progress += 0.01;
            
            // Smooth camera movement using easing
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.controls.target.lerpVectors(
                startTarget,
                targetPos,
                ease
            );
            
            this.controls.update();
            requestAnimationFrame(animate);
        };

        animate();
        this.showChemistryInfo('engines');
    }

    startEngineAnimation() {
        this.engineAnimationActive = true;
        this.batteryCells.forEach(battery => {
            battery.userData.electrons.forEach((electron, i) => {
                electron.userData.time = 0;
                electron.userData.startX = -0.8; // Start at anode
                electron.userData.endX = 0.8;   // End at cathode
            });
        });
    }

    hyperspacejump() {
        if (this.state !== 'init') return;
        
        this.state = 'hyperspace';
        const deathStar = this.objects.deathStar;
        
        // Create hyperspace effect with streaking stars
        const streakCount = 200;
        const streaks = new THREE.Group();
        
        for (let i = 0; i < streakCount; i++) {
            const length = Math.random() * 20 + 10;
            const geometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -length)
            ];
            geometry.setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                opacity: Math.random() * 0.5 + 0.5,
                transparent: true
            });
            
            const streak = new THREE.Line(geometry, material);
            streak.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                Math.random() * -500
            );
            streaks.add(streak);
        }
        
        this.objects.hyperstreaks = streaks;
        this.scene.add(streaks);

        // Animate the hyperspace jump
        let progress = 0;
        const animate = () => {
            if (progress >= 1) {
                this.scene.remove(streaks);
                this.state = 'ready';
                document.getElementById('zoomEngines').disabled = false;
                return;
            }

            progress += 0.01;
            
            // Move Death Star
            deathStar.position.z += 10;
            deathStar.scale.setScalar(0.1 + progress * 0.9);
            
            // Animate streaks
            streaks.children.forEach(streak => {
                streak.position.z += 15;
                if (streak.position.z > 0) streak.position.z = -500;
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) this.controls.update();
        
        // Rotate starfield slowly for ambient movement
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
            this.starfield.rotation.z += 0.0001;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulation when the page loads
window.addEventListener('load', () => {
    const simulation = new DeathStarSimulation();
    simulation.createDeathStar();
    
    document.getElementById('loading').style.display = 'none';
    
    document.getElementById('hyperspace').addEventListener('click', () => {
        simulation.hyperspacejump();
        document.getElementById('hyperspace').disabled = true;
    });

    document.getElementById('zoomEngines').addEventListener('click', () => {
        simulation.zoomToEngines();
        document.getElementById('zoomEngines').disabled = true;
    });

    document.getElementById('powerUp').addEventListener('click', () => {
        simulation.powerUpLaser();
        document.getElementById('powerUp').disabled = true;
    });

    document.getElementById('examineChemistry').addEventListener('click', () => {
        simulation.examineSuperlaser();
        document.getElementById('examineChemistry').disabled = true;
    });

    document.getElementById('fire').addEventListener('click', () => {
        simulation.fireLaser();
        document.getElementById('fire').disabled = true;
    });

    document.getElementById('analyze').addEventListener('click', () => {
        simulation.analyzeImpact();
        document.getElementById('analyze').disabled = true;
    });

    document.getElementById('reset').addEventListener('click', () => {
        location.reload(); // Simple reset by reloading the page
    });
});