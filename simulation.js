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
        const planetGeometry = new THREE.SphereGeometry(30, 64, 64);
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

        // Create inner glow sphere for heating effect
        const innerGlowGeometry = new THREE.SphereGeometry(29, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });

        this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.innerGlow.position.copy(this.targetPlanet.position);
        this.scene.add(this.innerGlow);

        // Position camera for dramatic view
        const perpendicular = new THREE.Vector3().crossVectors(
            superlaserDirection, 
            new THREE.Vector3(0, 1, 0)
        ).normalize();
        
        const cameraPos = new THREE.Vector3()
            .copy(this.targetPlanet.position)
            .add(perpendicular.multiplyScalar(120))
            .add(new THREE.Vector3(0, 60, 0))
            .add(superlaserDirection.clone().multiplyScalar(-80));

        // Animate camera movement to the planet
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        let cameraProgress = 0;

        const animateCamera = () => {
            if (cameraProgress >= 1) {
                this.startExplosionSequence();
                return;
            }

            cameraProgress += 0.007; // Much slower camera movement
            const ease = 1 - Math.pow(1 - cameraProgress, 3);

            this.camera.position.lerpVectors(startPos, cameraPos, ease);
            this.controls.target.lerpVectors(startTarget, this.targetPlanet.position, ease);
            this.controls.update();

            requestAnimationFrame(animateCamera);
        };

        animateCamera();
    }

    startExplosionSequence() {
        let phase = 'heating'; // heating -> expanding -> exploding -> shockwave
        let progress = 0;
        const totalDuration = 7500; // 7.5 seconds total
        const startTime = Date.now();
        this.explosionStartTime = startTime;

        // Create crack lines on planet surface
        this.createPlanetCracks();

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            progress = Math.min(elapsed / totalDuration, 1);

            // Determine current phase
            if (progress < 0.25) {
                phase = 'heating';
            } else if (progress < 0.5) {
                phase = 'expanding';
            } else if (progress < 0.875) {
                phase = 'exploding';
            } else {
                phase = 'shockwave';
            }

            this.updateExplosionPhase(phase, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Explosion completed - zoom out to final wide view
                this.zoomToFinalView();
                document.getElementById('reset').disabled = false;
            }
        };

        animate();
    }

    createPlanetCracks() {
        this.cracks = new THREE.Group();
        
        for (let i = 0; i < 20; i++) {
            const crackGeometry = new THREE.CylinderGeometry(0.1, 0.1, 60, 8);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 0,
                transparent: true,
                opacity: 0
            });

            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            crack.position.copy(this.targetPlanet.position);
            crack.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.cracks.add(crack);
        }
        
        this.scene.add(this.cracks);
    }

    updateExplosionPhase(phase, progress) {
        const phaseProgress = this.getPhaseProgress(phase, progress);

        switch (phase) {
            case 'heating':
                this.updateHeatingPhase(phaseProgress);
                break;
            case 'expanding':
                this.updateExpandingPhase(phaseProgress);
                break;
            case 'exploding':
                this.updateExplodingPhase(phaseProgress);
                break;
            case 'shockwave':
                this.updateShockwavePhase(phaseProgress);
                break;
        }

        this.showChemistryInfo('impact');
    }

    updateHeatingPhase(progress) {
        const heatIntensity = progress;
        
        // Inner glow becomes more visible
        this.innerGlow.material.opacity = heatIntensity * 0.6;
        this.innerGlow.scale.setScalar(1 + heatIntensity * 0.1);
        
        // Planet color shifts to red
        const redAmount = heatIntensity * 0.8;
        this.targetPlanet.material.color.setRGB(
            0.27 + redAmount,
            0.27 - redAmount * 0.2,
            1.0 - redAmount * 0.9
        );
        
        // Add emissive red glow
        this.targetPlanet.material.emissive.setRGB(
            redAmount * 0.5,
            0,
            0
        );
        this.targetPlanet.material.emissiveIntensity = redAmount;

        // Start showing cracks
        if (progress > 0.5) {
            const crackProgress = (progress - 0.5) / 0.5;
            this.cracks.children.forEach(crack => {
                crack.material.opacity = crackProgress * 0.8;
                crack.material.emissiveIntensity = crackProgress * 2;
            });
        }
    }

    updateExpandingPhase(progress) {
        // Planet starts to expand and crack more
        const expansion = 1 + progress * 0.3;
        this.targetPlanet.scale.setScalar(expansion);
        this.innerGlow.scale.setScalar(expansion * 1.1);

        // Cracks become more visible
        this.cracks.children.forEach((crack, index) => {
            crack.material.opacity = 0.8 + progress * 0.2;
            crack.material.emissiveIntensity = 2 + progress * 3;
            crack.scale.setScalar(1 + progress * 0.5);
            
            // Add some random movement to cracks
            crack.rotation.x += 0.01 * Math.sin(Date.now() * 0.001 + index);
            crack.rotation.y += 0.01 * Math.cos(Date.now() * 0.001 + index);
        });

        // Planet becomes more red and bright
        this.targetPlanet.material.emissiveIntensity = 1 + progress * 2;
        this.innerGlow.material.opacity = 0.6 + progress * 0.4;

        // Surface distortion
        const vertices = this.targetPlanet.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];
            const distance = Math.sqrt(x * x + y * y + z * z);
            const distortion = Math.sin(distance * 0.1 + Date.now() * 0.01) * progress * 2;
            
            vertices[i] += (Math.random() - 0.5) * distortion;
            vertices[i + 1] += (Math.random() - 0.5) * distortion;
            vertices[i + 2] += (Math.random() - 0.5) * distortion;
        }
        this.targetPlanet.geometry.attributes.position.needsUpdate = true;
    }

    updateExplodingPhase(progress) {
        if (!this.explosionStarted) {
            this.explosionStarted = true;
            
            // Remove green laser beam and energy particles
            if (this.laserBeam) {
                this.scene.remove(this.laserBeam);
                this.laserBeam = null;
            }
            
            if (this.energyParticles) {
                this.scene.remove(this.energyParticles);
                this.energyParticles = null;
            }
            
            this.createExplosionDebris();
            this.createMassiveShockwave();
        }

        // Planet becomes completely white-hot
        const explosionIntensity = progress;
        
        this.targetPlanet.material.emissiveIntensity = 3 + explosionIntensity * 7;
        this.targetPlanet.material.color.setRGB(1, 1, 1);
        this.targetPlanet.scale.setScalar(1.3 + explosionIntensity * 2);
        this.targetPlanet.material.opacity = 1 - explosionIntensity * 0.8;

        // Inner glow explodes outward
        this.innerGlow.scale.setScalar(1.4 + explosionIntensity * 5);
        this.innerGlow.material.opacity = 1 - explosionIntensity * 0.5;

        // Animate debris
        if (this.debris && progress < 0.8) {
            this.debris.children.forEach(piece => {
                piece.position.add(piece.userData.velocity);
                piece.userData.velocity.multiplyScalar(1.02);
                piece.rotation.x += piece.userData.rotationSpeed.x;
                piece.rotation.y += piece.userData.rotationSpeed.y;
                piece.rotation.z += piece.userData.rotationSpeed.z;
            });
        }

        // Make cracks disappear
        this.cracks.children.forEach(crack => {
            crack.material.opacity *= 0.9;
        });
    }

    createExplosionDebris() {
        this.debris = new THREE.Group();
        
        // Create 2500 small granular particles
        for (let i = 0; i < 2500; i++) {
            let debrisGeometry, size;
            const particleType = Math.random();
            
            if (particleType < 0.6) {
                // Small irregular chunks
                size = Math.random() * 0.8 + 0.2;
                debrisGeometry = new THREE.BoxGeometry(
                    size * (0.5 + Math.random() * 0.5),
                    size * (0.5 + Math.random() * 0.5),
                    size * (0.5 + Math.random() * 0.5)
                );
            } else if (particleType < 0.8) {
                // Tiny spherical particles
                size = Math.random() * 0.5 + 0.1;
                debrisGeometry = new THREE.SphereGeometry(size, 6, 6);
            } else {
                // Very small angular fragments
                size = Math.random() * 0.3 + 0.1;
                debrisGeometry = new THREE.TetrahedronGeometry(size);
            }
            
            const debrisMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.15 + 0.02, 0.7 + Math.random() * 0.3, 0.4 + Math.random() * 0.4),
                emissive: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.2 + Math.random() * 0.3),
                emissiveIntensity: 0.8 + Math.random() * 0.4,
                transparent: true,
                opacity: 0.8 + Math.random() * 0.2
            });

            const piece = new THREE.Mesh(debrisGeometry, debrisMaterial);
            piece.position.copy(this.targetPlanet.position);
            
            // Add random offset and velocity
            piece.position.x += (Math.random() - 0.5) * 2;
            piece.position.y += (Math.random() - 0.5) * 2;
            piece.position.z += (Math.random() - 0.5) * 2;
            
            const speed = Math.random() * 12 + 3;
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            );
            piece.userData.velocity = velocity;
            
            const rotationMultiplier = 1 / (size + 0.1);
            piece.userData.rotationSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3 * rotationMultiplier,
                (Math.random() - 0.5) * 0.3 * rotationMultiplier,
                (Math.random() - 0.5) * 0.3 * rotationMultiplier
            );

            this.debris.add(piece);
        }
        
        // Add 30 larger chunks
        for (let i = 0; i < 30; i++) {
            const size = Math.random() * 2 + 1;
            const debrisGeometry = new THREE.BoxGeometry(
                size * (0.7 + Math.random() * 0.6),
                size * (0.7 + Math.random() * 0.6),
                size * (0.7 + Math.random() * 0.6)
            );
            const debrisMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1, 0.8, 0.5),
                emissive: new THREE.Color().setHSL(0.05, 1, 0.25),
                emissiveIntensity: 1,
                transparent: true,
                opacity: 0.9
            });

            const piece = new THREE.Mesh(debrisGeometry, debrisMaterial);
            piece.position.copy(this.targetPlanet.position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            );
            piece.userData.velocity = velocity;
            
            piece.userData.rotationSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
            );

            this.debris.add(piece);
        }
        
        this.scene.add(this.debris);
    }

    getPhaseProgress(phase, totalProgress) {
        switch (phase) {
            case 'heating': return totalProgress / 0.25;
            case 'expanding': return (totalProgress - 0.25) / 0.25;
            case 'exploding': return (totalProgress - 0.5) / 0.375;
            case 'shockwave': return (totalProgress - 0.875) / 0.125;
            default: return 0;
        }
    }

    getCurrentPhase() {
        if (!this.explosionStartTime) return null;
        
        const elapsed = Date.now() - this.explosionStartTime;
        const progress = Math.min(elapsed / 7000, 1);
        
        if (progress < 0.25) return 'heating';
        else if (progress < 0.5) return 'expanding';
        else if (progress < 0.875) return 'exploding';
        else return 'shockwave';
    }

    updateShockwavePhase(progress) {
        // Add dramatic camera shake
        if (progress < 0.5) {
            const shakeIntensity = (0.5 - progress) * 4;
            this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.z += (Math.random() - 0.5) * shakeIntensity;
        }
    }

    createMassiveShockwave() {
        // Create massive shockwave ring
        const shockwaveGeometry = new THREE.RingGeometry(0, 1, 64);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.massiveShockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        this.massiveShockwave.position.copy(this.targetPlanet.position);
        this.massiveShockwave.lookAt(this.camera.position);
        this.scene.add(this.massiveShockwave);
    }

    showChemistryInfo(section) {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.style.display = 'block'; // Make sure panel is visible
        
        let content = ''; // Declare content outside switch statement

        switch(section) {
            case 'engines':
                content = `
                    <h3>AP Chemistry Unit 9 (Electrochemistry) — Topic 9.7: Galvanic Cells</h3>
                    <p>The Death Star's engines are powered by Daniell galvanic cells with separate half-cell compartments demonstrating fundamental electrochemical principles:</p>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Anode Compartment (Left Tank - Zn(s) | ZnSO₃(aq)):</h4>
                        <p><strong>Oxidation Half-Reaction:</strong> Zn(s) → Zn²⁺(aq) + 2e⁻  E° = -0.76 V</p>
                        <p><strong>Electrolyte:</strong> ZnSO₃(aq) (zinc sulfite solution)</p>
                        <p><strong>Particle-Level Process:</strong> Zn atoms lose 2 electrons each, becoming hydrated Zn²⁺ ions</p>
                        <p><span style="color: #00ffff;">Cyan spheres:</span> Zn²⁺(aq) ions in solution (concentration increases over time)</p>
                        <p><span style="color: #ff0044;">Red spheres:</span> SO₃²⁻ spectator ions (maintain electrical neutrality)</p>
                        <p><strong>Observable Changes:</strong> Zinc electrode decreases in mass, solution becomes more concentrated in Zn²⁺</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Cathode Compartment (Right Tank - Cu²⁺(aq) | CuSO₃(aq)):</h4>
                        <p><strong>Reduction Half-Reaction:</strong> Cu²⁺(aq) + 2e⁻ → Cu(s)  E° = +0.34 V</p>
                        <p><strong>Electrolyte:</strong> CuSO₃(aq) (copper(II) sulfite solution)</p>
                        <p><strong>Particle-Level Process:</strong> Cu²⁺ ions gain 2 electrons each, becoming Cu atoms deposited on electrode</p>
                        <p><span style="color: #ff6600;">Orange spheres:</span> Cu²⁺(aq) ions in solution (concentration decreases over time)</p>
                        <p><span style="color: #ff0044;">Red spheres:</span> SO₃²⁻ spectator ions (maintain electrical neutrality)</p>
                        <p><strong>Observable Changes:</strong> Copper electrode increases in mass, solution becomes less concentrated in Cu²⁺</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Salt Bridge Function (NaCl electrolyte):</h4>
                        <p><span style="color: #666666;">Gray bridge:</span> Contains NaCl electrolyte solution</p>
                        <p><span style="color: #9900ff;">Purple spheres:</span> Na⁺ ions (migrate toward cathode compartment)</p>
                        <p><span style="color: #ffffff;">White spheres:</span> Cl⁻ ions (migrate toward anode compartment)</p>
                        <p><strong>Critical Function:</strong> Maintains electrical neutrality and completes the internal circuit</p>
                        <p><strong>Without salt bridge:</strong> Charge buildup would stop electron flow</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Thermodynamic Analysis:</h4>
                        <p><strong>Overall Cell Reaction:</strong> Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)</p>
                        <p><strong>Standard Cell Potential:</strong> E°<sub>cell</sub> = E°<sub>cathode</sub> - E°<sub>anode</sub> = 0.34V - (-0.76V) = +1.10V</p>
                        <p><strong>Gibbs Free Energy:</strong> ΔG° = -nFE°<sub>cell</sub> = -2(96,485 C/mol)(1.10 V) = -212 kJ/mol</p>
                        <p><strong>Spontaneity:</strong> ΔG° < 0, therefore thermodynamically favorable (spontaneous)</p>
                        <p><span style="color: #ffff00;">Yellow spheres:</span> Electrons flowing through external circuit</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>AP Chemistry Scientific Practices:</h4>
                        <p><strong>Scientific Practice 1.B:</strong> Describes models illustrating both particulate-level and macroscopic properties</p>
                        <p><strong>Scientific Practice 4.C:</strong> Explains connection between particulate-level reactions and macroscopic phenomena</p>
                        <p><strong>Scientific Practice 6.D:</strong> Provides reasoning about electrochemical processes using chemical principles</p>
                    </div>
                `;
                break;

            case 'powering':
                content = `
                    <h3>AP Chemistry Topic 6.5: Energy Conservation & Electromagnetic Energy</h3>
                    <p>Energy from the galvanic cells is converted and transferred through multiple stages, demonstrating fundamental conservation principles:</p>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Energy Conversion Chain Analysis:</h4>
                        <p><strong>Stage 1:</strong> Chemical Energy (galvanic cells) → Electrical Energy (electron flow)</p>
                        <p><strong>Stage 2:</strong> Electrical Energy → Electromagnetic Energy (photon production)</p>
                        <p><strong>Thermodynamic Basis:</strong> ΔG° = -212 kJ/mol (spontaneous energy release)</p>
                        <p><strong>Conservation Principle:</strong> Total energy remains constant throughout all transformations</p>
                        <p><strong>First Law Application:</strong> ΔU = q - w (energy cannot be created or destroyed)</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Electromagnetic Energy Quantification (Topics 1.7 & 1.8):</h4>
                        <p><strong>Planck's Quantum Theory:</strong> E = hf = hc/λ</p>
                        <p><strong>Laser Wavelength:</strong> λ = 532 nm (green light, visible spectrum)</p>
                        <p><strong>Photon Frequency:</strong> f = c/λ = (3.00 × 10⁸ m/s)/(532 × 10⁻⁹ m) = 5.64 × 10¹⁴ Hz</p>
                        <p><strong>Energy per Photon:</strong> E = (6.626 × 10⁻³⁴ J·s)(5.64 × 10¹⁴ Hz) = 3.74 × 10⁻¹⁹ J</p>
                        <p><strong>Energy per Mole of Photons:</strong> E = N<sub>A</sub>hf = (6.022 × 10²³)(3.74 × 10⁻¹⁹ J) = 225 kJ/mol</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Crystal Lattice Amplification Mechanism:</h4>
                        <p><strong>Population Inversion:</strong> N₂ > N₁ (more electrons in excited state than ground state)</p>
                        <p><strong>Energy Level Requirement:</strong> E₂ - E₁ = hf (energy gap must equal photon energy)</p>
                        <p><strong>Stimulated Emission:</strong> Excited state + photon → ground state + 2 coherent photons</p>
                        <p><strong>Cascade Amplification:</strong> Exponential increase in coherent photon stream</p>
                        <p><strong>Focusing Crystal Role:</strong> Provides ordered lattice structure for coherent emission</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Power Analysis & System Efficiency:</h4>
                        <p><strong>Current Power Level:</strong> ${Math.round(this.laserCharge * 100)}% of maximum capacity</p>
                        <p><strong>Power Equation:</strong> P = E/t = nhf/t (where n = photons per unit time)</p>
                        <p><strong>Beam Intensity:</strong> I = P/A (power per unit cross-sectional area)</p>
                        <p><strong>Energy Efficiency:</strong> η = E<sub>electromagnetic</sub>/E<sub>chemical</sub> (real-world conversion limitations)</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>AP Chemistry Scientific Practices Integration:</h4>
                        <p><strong>Scientific Practice 4.C:</strong> Connecting Particulate & Macroscopic - Cell to powering laser</p>
                    </div>
                `;
                break;

            case 'laser':
                content = `
                    <h3>Photoelectric Effect & Laser Operation - AP Chemistry Topics 1.7 & 3.12</h3>
                    <p>The superlaser operates through quantum mechanical processes involving photon-electron interactions:</p>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Photoelectric Effect (Topic 1.8):</h4>
                        <p><strong>Einstein's Equation:</strong> KE<sub>max</sub> = hf - φ</p>
                        <p>where φ is the work function of the crystal material</p>
                        <p><strong>Process:</strong> Metal + hν → Metal⁺ + e⁻ (emitted)</p>
                        <p>Threshold frequency: f₀ = φ/h (minimum frequency for electron emission)</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Laser Physics (Topic 1.7 - Electromagnetic Radiation):</h4>
                        <p>1. <strong>Population Inversion:</strong> More electrons in excited state than ground state</p>
                        <p>2. <strong>Stimulated Emission:</strong> Excited electron + photon → 2 coherent photons + ground state electron</p>
                        <p>3. <strong>Coherent Amplification:</strong> All photons have same frequency, phase, and direction</p>
                        <p>4. <strong>Resonant Cavity:</strong> Mirrors create standing wave pattern for amplification</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Focusing Crystal Components:</h4>
                        <p><span style="color: #00ff88;">Green crystals:</span> Active laser medium (similar to ruby or semiconductor)</p>
                        <p>Energy gap determines laser wavelength: λ = hc/ΔE</p>
                        <p>Crystal lattice provides structure for coherent emission</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <p><strong>Scientific Practice 1.B:</strong> Describes components illustrating particulate-level properties and macroscopic output</p>
                        <p><strong>Scientific Practice 4.A:</strong> Explains phenomena using quantum models</p>
                    </div>
                `;
                break;
                
            case 'firing':
                content = `
                    <h3>Firing Sequence Analysis - AP Chemistry Topics 6.3</h3>
                    <p>The complete energy transfer sequence demonstrates conservation of energy across multiple scales:</p>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Energy Transfer Chain (Topic 6.5):</h4>
                        <p>Chemical → Electrical → Electromagnetic → Thermal → Kinetic</p>
                        <p><strong>Conservation Law:</strong> E<sub>total</sub> = constant (energy cannot be created or destroyed)</p>
                        <p>Energy transformations follow first law of thermodynamics</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Quantitative Analysis:</h4>
                        <p><strong>Beam Energy:</strong> E = nhf where n = number of photons</p>
                        <p>Photon frequency: f = c/λ = 5.64 × 10¹⁴ Hz</p>
                        <p>Power density: I = E/(A·t) where A = beam cross-section, t = time</p>
                        <p>Energy flux creates heating at target surface</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Heat Transfer Mechanisms (Topic 6.1):</h4>
                        <p><strong>Radiative Transfer:</strong> Stefan-Boltzmann law: j = σT⁴</p>
                        <p><strong>Conductive Transfer:</strong> Fourier's law: q = -kA(dT/dx)</p>
                        <p>Plasma formation occurs at extreme temperatures</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <p><strong>Scientific Practice 4.C:</strong> Links changes to atomic and macroscopic</p>
                    </div>
                `;
                break;
            
            case 'impact':
                content = `
                    <h3>Impact Analysis - AP Chemistry Topics 1.7 & 6.5</h3>
                    <p>When the superlaser strikes the planet, multiple thermodynamic and intermolecular processes occur:</p>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Heat Transfer (Topic 6.1 - Endothermic/Exothermic Processes):</h4>
                        <p><strong>Heat Capacity Equation:</strong> q = mcΔT</p>
                        <p>Initial Temperature: ~300K → Final Temperature: >10⁶K</p>
                        <p><strong>Enthalpy Change:</strong> ΔH = q<sub>p</sub> (heat at constant pressure)</p>
                        <p>Massive energy input causes extreme temperature rise</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Phase Changes (Topic 7.1 - Intermolecular Forces):</h4>
                        <p><strong>Vaporization:</strong> SiO₂(s) + energy → SiO₂(g)</p>
                        <p><strong>Sublimation:</strong> Direct solid → gas transition</p>
                        <p>Intermolecular forces overcome: London dispersion, dipole-dipole, hydrogen bonding</p>
                        <p><strong>Phase Diagram:</strong> Extreme conditions exceed critical point</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Chemical Bond Breaking:</h4>
                        <p><strong>Ionization Energy:</strong> M(g) + energy → M⁺(g) + e⁻</p>
                        <p>Covalent bonds break: E<sub>bond</sub> < E<sub>thermal</sub></p>
                        <p>Ionic compounds dissociate completely</p>
                        <p>Plasma formation at highest energy levels</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <h4>Macroscopic Observations:</h4>
                        <p>Explosive expansion due to massive volume increase (PV = nRT)</p>
                        <p>Gravitational binding energy exceeded</p>
                        <p>Visible light emission from hot gases (blackbody radiation)</p>
                    </div>
                    
                    <div style="border: 1px solid #0f0; padding: 10px; margin: 10px 0;">
                        <p><strong>Scientific Practice 1.B:</strong> Models illustrating particulate and macroscopic properties</p>
                        <p><strong>Scientific Practice 4.C:</strong> Connects particulate-level and macroscopic properties</p>
                        <p><strong>Scientific Practice 6.D:</strong> q=mcΔT, mathematical justificaiton</p>
                    </div>
                `;
                break;
        }

        infoPanel.innerHTML = content; // Set the content after switch statement
        infoPanel.style.display = 'block'; // Make sure panel is visible
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) this.controls.update();
        
        // Rotate starfield slowly for ambient movement
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
            this.starfield.rotation.z += 0.0001;
        }

        // Animate galvanic cell if engine animation is active
        if (this.engineAnimationActive && this.galvanicCell) {
            this.animateGalvanicCell();
        }

        // Animate photons
        if (this.photons && this.photons.length > 0) {
            this.photons.forEach((photon, index) => {
                photon.position.add(photon.userData.velocity);
                
                // Remove photons that have traveled too far
                if (photon.position.distanceTo(this.objects.superlaser.position) > 50) {
                    this.scene.remove(photon);
                    this.photons.splice(index, 1);
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    animateGalvanicCell() {
        if (!this.galvanicCell) return;

        const time = Date.now() * 0.001;
        this.galvanicCell.userData.animationTime = time;

        // Progress the reaction faster (about 50% over 30 seconds)
        this.galvanicCell.userData.reactionProgress += 0.0008; // Much faster progression
        const progress = Math.min(this.galvanicCell.userData.reactionProgress, 0.5);

        // Gradually shrink zinc anode
        const zincAnode = this.galvanicCell.userData.zincAnode;
        const zincShrinkage = 1 - progress * 0.6; // Shrink by up to 60%
        zincAnode.scale.set(1, zincShrinkage, 1);

        // Gradually grow copper cathode
        const copperCathode = this.galvanicCell.userData.copperCathode;
        const copperGrowth = 1 + progress * 0.4; // Grow by up to 40%
        copperCathode.scale.set(copperGrowth, 1, copperGrowth);

        // Animate electrons flowing along the wire path (anode → top → cathode)
        this.galvanicCell.userData.electrons.forEach((electron, i) => {
            const speed = 0.008;
            electron.userData.progress += speed;
            
            if (electron.userData.progress > 1) {
                electron.userData.progress = 0;
            }
            
            const progress = electron.userData.progress;
            
            if (progress < 0.25) {
                // Moving up left wire (from anode)
                const upProgress = progress / 0.25;
                electron.position.set(-5, 4 + upProgress * 4, 0);
            } else if (progress < 0.75) {
                // Moving across top wire (left to right)
                const acrossProgress = (progress - 0.25) / 0.5;
                electron.position.set(-5 + acrossProgress * 10, 8, 0);
            } else {
                // Moving down right wire (to cathode)
                const downProgress = (progress - 0.75) / 0.25;
                electron.position.set(5, 8 - downProgress * 4, 0);
            }
        });

        // Animate Zn2+ ions in left tank (more ions appear as anode dissolves)
        this.galvanicCell.userData.zincIons.forEach((ion, i) => {
            ion.userData.angle += ion.userData.speed;
            const newRadius = ion.userData.radius + Math.sin(time + i) * 0.2;
            
            ion.position.x = ion.userData.centerX + Math.cos(ion.userData.angle) * newRadius;
            ion.position.z = ion.userData.centerZ + Math.sin(ion.userData.angle) * newRadius;
            ion.position.y = -4 + Math.sin(time * 0.5 + i) * 3 + 4;
            
            // Make ions more visible/concentrated as reaction progresses
            const opacity = 0.8 + progress * 1.0; // Increase opacity more
            ion.material.opacity = Math.min(opacity, 1.0);
            ion.material.transparent = true;
            
            // Add more noticeable size increase to show more Zn2+ ions
            const sizeIncrease = 1 + progress * 0.6;
            ion.scale.setScalar(sizeIncrease);
        });

        // Animate Cu2+ ions in right tank (fewer ions as they get reduced)
        this.galvanicCell.userData.copperIons.forEach((ion, i) => {
            ion.userData.angle += ion.userData.speed;
            const newRadius = ion.userData.radius + Math.sin(time + i + Math.PI) * 0.2;
            
            ion.position.x = ion.userData.centerX + Math.cos(ion.userData.angle) * newRadius;
            ion.position.z = ion.userData.centerZ + Math.sin(ion.userData.angle) * newRadius;
            ion.position.y = -4 + Math.sin(time * 0.5 + i + Math.PI/2) * 3 + 4;
            
            // Make ions less visible/concentrated as they get consumed
            const opacity = 0.9 - progress * 0.7; // Decrease opacity more
            ion.material.opacity = Math.max(opacity, 0.2);
            ion.material.transparent = true;
            
            // More noticeable size decrease to show fewer Cu2+ ions
            const sizeDecrease = 1 - progress * 0.5;
            ion.scale.setScalar(Math.max(sizeDecrease, 0.4));
        });

        // Animate SO3^2- ions in left tank
        this.galvanicCell.userData.leftSulfateIons.forEach((ion, i) => {
            ion.userData.angle += ion.userData.speed;
            const newRadius = ion.userData.radius + Math.sin(time * 0.8 + i) * 0.15;
            
            ion.position.x = ion.userData.centerX + Math.cos(ion.userData.angle) * newRadius;
            ion.position.z = ion.userData.centerZ + Math.sin(ion.userData.angle) * newRadius;
            ion.position.y = -4 + Math.sin(time * 0.6 + i) * 3 + 4;
        });

        // Animate SO3^2- ions in right tank
        this.galvanicCell.userData.rightSulfateIons.forEach((ion, i) => {
            ion.userData.angle += ion.userData.speed;
            const newRadius = ion.userData.radius + Math.sin(time * 0.8 + i + Math.PI/3) * 0.15;
            
            ion.position.x = ion.userData.centerX + Math.cos(ion.userData.angle) * newRadius;
            ion.position.z = ion.userData.centerZ + Math.sin(ion.userData.angle) * newRadius;
            ion.position.y = -4 + Math.sin(time * 0.6 + i + Math.PI/3) * 3 + 4;
        });

        // Animate Na+ ions moving through salt bridge toward Cu tank
        this.galvanicCell.userData.sodiumIons.forEach((ion, i) => {
            ion.userData.progress += ion.userData.speed;
            
            if (ion.userData.progress > 1.2) {
                // Reset ion to start of bridge
                ion.userData.progress = 0;
                ion.position.set(-6, 5, (Math.random() - 0.5) * 0.6);
            }
            
            const progress = ion.userData.progress;
            
            if (progress <= 1.0) {
                // Moving through salt bridge
                ion.position.x = -6 + progress * 12;
                ion.position.y = 5 + Math.sin(time * 2 + i) * 0.1; // Slight vertical movement
            } else {
                // Entering right tank (Cu compartment)
                const tankProgress = (progress - 1.0) / 0.2;
                ion.position.x = 6 - tankProgress * 2; // Move into tank
                ion.position.y = 5 - tankProgress * 8; // Move down into solution
                // Add circular motion once in tank
                const angle = time * 0.5 + i;
                ion.position.z = Math.sin(angle) * 0.5;
            }
        });

        // Animate Cl- ions moving through salt bridge toward Zn tank
        this.galvanicCell.userData.chlorideIons.forEach((ion, i) => {
            ion.userData.progress += ion.userData.speed;
            
            if (ion.userData.progress > 1.2) {
                // Reset ion to start of bridge
                ion.userData.progress = 0;
                ion.position.set(6, 5, (Math.random() - 0.5) * 0.6);
            }
            
            const progress = ion.userData.progress;
            
            if (progress <= 1.0) {
                // Moving through salt bridge
                ion.position.x = 6 - progress * 12;
                ion.position.y = 5 + Math.sin(time * 2.5 + i) * 0.1; // Slight vertical movement
            } else {
                // Entering left tank (Zn compartment)
                const tankProgress = (progress - 1.0) / 0.2;
                ion.position.x = -6 + tankProgress * 2; // Move into tank
                ion.position.y = 5 - tankProgress * 8; // Move down into solution
                // Add circular motion once in tank
                const angle = time * 0.5 + i + Math.PI;
                ion.position.z = Math.sin(angle) * 0.5;
            }
        });

        // Animate bubbles rising from anode (minimal wobbling)
        this.galvanicCell.userData.bubbles.forEach((bubble, i) => {
            bubble.position.y += bubble.userData.speed;
            bubble.userData.wobble += 0.05;
            
            // Minimal wobbling motion
            bubble.position.x += Math.sin(bubble.userData.wobble) * 0.005;
            
            // Reset bubble when it reaches top
            if (bubble.position.y > 5) {
                bubble.position.set(-5 + Math.random() * 0.5, -5, 0);
                bubble.userData.speed = 0.02 + Math.random() * 0.02;
            }
        });
    }

    createEngineSection(deathStar) {
        const engineSection = new THREE.Group();
        engineSection.position.set(0, 0, 0); // Position at center of Death Star

        // Create single large galvanic cell positioned at the core
        this.galvanicCell = this.createGalvanicCell();
        // Scale it down to fit better at the center
        this.galvanicCell.scale.setScalar(0.6);
        engineSection.add(this.galvanicCell);

        deathStar.add(engineSection);
        this.objects.engineSection = engineSection;
    }

    createGalvanicCell() {
        const cell = new THREE.Group();

        // Create left tank (anode compartment)
        const leftTankRadius = 4;
        const tankHeight = 12;
        const leftTankGeo = new THREE.CylinderGeometry(leftTankRadius, leftTankRadius, tankHeight, 32);
        const leftTankMat = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            shininess: 100
        });
        const leftTank = new THREE.Mesh(leftTankGeo, leftTankMat);
        leftTank.position.set(-5, 0, 0);
        cell.add(leftTank);

        // Create right tank (cathode compartment)
        const rightTankGeo = new THREE.CylinderGeometry(leftTankRadius, leftTankRadius, tankHeight, 32);
        const rightTankMat = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            shininess: 100
        });
        const rightTank = new THREE.Mesh(rightTankGeo, rightTankMat);
        rightTank.position.set(5, 0, 0);
        cell.add(rightTank);

        // Create left electrolyte solution (ZnSO3)
        const leftSolutionGeo = new THREE.CylinderGeometry(leftTankRadius - 0.2, leftTankRadius - 0.2, tankHeight - 0.5, 32);
        const leftSolutionMat = new THREE.MeshPhongMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.4
        });
        const leftSolution = new THREE.Mesh(leftSolutionGeo, leftSolutionMat);
        leftSolution.position.set(-5, 0, 0);
        cell.add(leftSolution);

        // Create right electrolyte solution (CuSO3)
        const rightSolutionGeo = new THREE.CylinderGeometry(leftTankRadius - 0.2, leftTankRadius - 0.2, tankHeight - 0.5, 32);
        const rightSolutionMat = new THREE.MeshPhongMaterial({
            color: 0x4488bb,
            transparent: true,
            opacity: 0.4
        });
        const rightSolution = new THREE.Mesh(rightSolutionGeo, rightSolutionMat);
        rightSolution.position.set(5, 0, 0);
        cell.add(rightSolution);

        // Create Zinc anode (left electrode)
        const anodeGeo = new THREE.BoxGeometry(0.8, tankHeight - 2, 2);
        const anodeMat = new THREE.MeshPhongMaterial({
            color: 0x999999,
            shininess: 30
        });
        const anode = new THREE.Mesh(anodeGeo, anodeMat);
        anode.position.set(-5, 0, 0);
        cell.add(anode);

        // Create Copper cathode (right electrode)
        const cathodeGeo = new THREE.BoxGeometry(0.8, tankHeight - 2, 2);
        const cathodeMat = new THREE.MeshPhongMaterial({
            color: 0xcd7f32,
            shininess: 80
        });
        const cathode = new THREE.Mesh(cathodeGeo, cathodeMat);
        cathode.position.set(5, 0, 0);
        cell.add(cathode);

        // Create salt bridge connecting the two tanks
        const bridgeGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
        const bridgeMat = new THREE.MeshPhongMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.8
        });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.y = tankHeight / 2 - 1;
        cell.add(bridge);

        // Create Na+ ions in salt bridge (moving toward Cu tank)
        const sodiumIons = [];
        const sodiumIonGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const sodiumIonMat = new THREE.MeshPhongMaterial({
            color: 0x9900ff,
            emissive: 0x330055,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 6; i++) {
            const ion = new THREE.Mesh(sodiumIonGeo, sodiumIonMat);
            const progress = i / 6;
            ion.position.set(
                -6 + progress * 12, // Start at left end of bridge
                tankHeight / 2 - 1,
                (Math.random() - 0.5) * 0.6 // Slight random Z position within bridge
            );
            ion.userData.progress = progress;
            ion.userData.speed = 0.003 + Math.random() * 0.002;
            ion.userData.targetTank = 'right'; // Moving toward Cu tank
            cell.add(ion);
            sodiumIons.push(ion);
        }

        // Create Cl- ions in salt bridge (moving toward Zn tank)
        const chlorideIons = [];
        const chlorideIonGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const chlorideIonMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < 6; i++) {
            const ion = new THREE.Mesh(chlorideIonGeo, chlorideIonMat);
            const progress = i / 6;
            ion.position.set(
                6 - progress * 12, // Start at right end of bridge
                tankHeight / 2 - 1,
                (Math.random() - 0.5) * 0.6 // Slight random Z position within bridge
            );
            ion.userData.progress = progress;
            ion.userData.speed = 0.003 + Math.random() * 0.002;
            ion.userData.targetTank = 'left'; // Moving toward Zn tank
            cell.add(ion);
            chlorideIons.push(ion);
        }

        // Create external wire connecting both electrodes
        const wireGroup = new THREE.Group();
        
        // Vertical wire from anode
        const wireLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
            new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 100 })
        );
        wireLeft.position.set(-5, tankHeight / 2 + 1, 0);
        cell.add(wireLeft);
        
        // Horizontal wire across the top
        const wireTop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 12, 8),
            new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 100 })
        );
        wireTop.rotation.z = Math.PI / 2;
        wireTop.position.y = tankHeight / 2 + 2;
        cell.add(wireTop);
        
        // Vertical wire to cathode
        const wireRight = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
            new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 100 })
        );
        wireRight.position.set(5, tankHeight / 2 + 1, 0);
        cell.add(wireRight);

        // Create electrons flowing along the wire path
        const electrons = [];
        const electronGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const electronMat = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8
        });

        for (let i = 0; i < 8; i++) {
            const electron = new THREE.Mesh(electronGeo, electronMat);
            const progress = i / 8;
            electron.userData.progress = progress;
            electron.userData.wireY = tankHeight / 2 + 2;
            
            // Calculate initial position along wire path
            if (progress < 0.25) {
                // Moving up left wire
                electron.position.set(-5, tankHeight / 2 + progress * 8, 0);
            } else if (progress < 0.75) {
                // Moving across top wire
                const topProgress = (progress - 0.25) / 0.5;
                electron.position.set(-5 + topProgress * 10, electron.userData.wireY, 0);
            } else {
                // Moving down right wire
                const downProgress = (progress - 0.75) / 0.25;
                electron.position.set(5, electron.userData.wireY - downProgress * 2, 0);
            }
            
            cell.add(electron);
            electrons.push(electron);
        }

        // Create Zn2+ ions in left tank
        const zincIons = [];
        const zincIonGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const zincIonMat = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x004444,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 8; i++) {
            const ion = new THREE.Mesh(zincIonGeo, zincIonMat);
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 1.5;
            ion.position.set(
                -5 + Math.cos(angle) * radius,
                -4 + Math.random() * 8,
                Math.sin(angle) * radius
            );
            ion.userData.centerX = -5;
            ion.userData.centerZ = 0;
            ion.userData.angle = angle;
            ion.userData.radius = radius;
            ion.userData.speed = 0.005 + Math.random() * 0.005;
            cell.add(ion);
            zincIons.push(ion);
        }

        // Create Cu2+ ions in right tank
        const copperIons = [];
        const copperIonGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const copperIonMat = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0x442200,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 8; i++) {
            const ion = new THREE.Mesh(copperIonGeo, copperIonMat);
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 1.5;
            ion.position.set(
                5 + Math.cos(angle) * radius,
                -4 + Math.random() * 8,
                Math.sin(angle) * radius
            );
            ion.userData.centerX = 5;
            ion.userData.centerZ = 0;
            ion.userData.angle = angle;
            ion.userData.radius = radius;
            ion.userData.speed = 0.005 + Math.random() * 0.005;
            cell.add(ion);
            copperIons.push(ion);
        }

        // Create SO3^2- ions in left tank
        const leftSulfateIons = [];
        const sulfateIonGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const sulfateIonMat = new THREE.MeshPhongMaterial({
            color: 0xff0044,
            emissive: 0x440011,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < 8; i++) {
            const ion = new THREE.Mesh(sulfateIonGeo, sulfateIonMat);
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8; // Offset from metal ions
            const radius = 1.8 + Math.random() * 1.2;
            ion.position.set(
                -5 + Math.cos(angle) * radius,
                -4 + Math.random() * 8,
                Math.sin(angle) * radius
            );
            ion.userData.centerX = -5;
            ion.userData.centerZ = 0;
            ion.userData.angle = angle;
            ion.userData.radius = radius;
            ion.userData.speed = 0.004 + Math.random() * 0.004;
            cell.add(ion);
            leftSulfateIons.push(ion);
        }

        // Create SO3^2- ions in right tank
        const rightSulfateIons = [];
        for (let i = 0; i < 8; i++) {
            const ion = new THREE.Mesh(sulfateIonGeo, sulfateIonMat.clone());
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8; // Offset from metal ions
            const radius = 1.8 + Math.random() * 1.2;
            ion.position.set(
                5 + Math.cos(angle) * radius,
                -4 + Math.random() * 8,
                Math.sin(angle) * radius
            );
            ion.userData.centerX = 5;
            ion.userData.centerZ = 0;
            ion.userData.angle = angle;
            ion.userData.radius = radius;
            ion.userData.speed = 0.004 + Math.random() * 0.004;
            cell.add(ion);
            rightSulfateIons.push(ion);
        }

        // Create bubbles for gas evolution at anode
        const bubbles = [];
        const bubbleGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const bubbleMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < 3; i++) {
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            bubble.position.set(-5 + Math.random() * 0.5, -5, 0);
            bubble.userData.speed = 0.02 + Math.random() * 0.02;
            bubble.userData.wobble = Math.random() * Math.PI * 2;
            cell.add(bubble);
            bubbles.push(bubble);
        }

        // Store animation elements
        cell.userData.electrons = electrons;
        cell.userData.zincIons = zincIons;
        cell.userData.copperIons = copperIons;
        cell.userData.leftSulfateIons = leftSulfateIons;
        cell.userData.rightSulfateIons = rightSulfateIons;
        cell.userData.sodiumIons = sodiumIons;
        cell.userData.chlorideIons = chlorideIons;
        cell.userData.bubbles = bubbles;
        cell.userData.animationTime = 0;
        cell.userData.zincAnode = anode;
        cell.userData.copperCathode = cathode;
        cell.userData.reactionProgress = 0; // Track overall reaction progress

        return cell;
    }

    zoomToEngines() {
        if (this.state !== 'ready') return;
        this.state = 'engines';

        // Calculate target position for camera
        const engineSection = this.objects.engineSection;
        const deathStar = this.objects.deathStar;
        const targetPos = new THREE.Vector3();
        engineSection.getWorldPosition(targetPos);

        // Animate camera movement - zoom much closer since galvanic cell is now at center
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const endPos = new THREE.Vector3(
            targetPos.x + 8,  // Position camera closer and at an angle
            targetPos.y + 3,  // Slightly above center
            targetPos.z + 6   // Much closer to the center (was 20, now 6)
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
        // Initialize animation state for galvanic cell
        if (this.galvanicCell) {
            this.galvanicCell.userData.animationTime = 0;
        }
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

        // Animate galvanic cell if engine animation is active
        if (this.engineAnimationActive && this.galvanicCell) {
            this.animateGalvanicCell();
        }

        // Animate photons
        if (this.photons && this.photons.length > 0) {
            this.photons.forEach((photon, index) => {
                photon.position.add(photon.userData.velocity);
                
                // Remove photons that have traveled too far
                if (photon.position.distanceTo(this.objects.superlaser.position) > 50) {
                    this.scene.remove(photon);
                    this.photons.splice(index, 1);
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    zoomToFinalView() {
        // Get Death Star position
        const deathStar = this.objects.deathStar;
        const deathStarPos = new THREE.Vector3();
        deathStar.getWorldPosition(deathStarPos);

        // Get explosion/planet position
        const planetPos = this.targetPlanet ? this.targetPlanet.position.clone() : new THREE.Vector3(800, 0, -300);

        // Calculate midpoint between Death Star and explosion
        const midPoint = new THREE.Vector3().addVectors(deathStarPos, planetPos).multiplyScalar(0.5);

        // Position camera for maximum wide view - far back and up from the midpoint
        const finalCameraPos = new THREE.Vector3(
            midPoint.x - 500,
            midPoint.y + 400,
            midPoint.z + 800
        );

        // Look at the midpoint to see both Death Star and explosion
        const finalTarget = midPoint.clone();

        // Smooth camera transition
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        let progress = 0;

        const animate = () => {
            if (progress >= 1) {
                return;
            }

            progress += 0.01; // Slower zoom for dramatic effect
            const ease = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPos, finalCameraPos, ease);
            this.controls.target.lerpVectors(startTarget, finalTarget, ease);
            this.controls.update();

            requestAnimationFrame(animate);
        };

        animate();
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