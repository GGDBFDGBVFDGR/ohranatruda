(function () {
  function startHelmet(canvas) {
    const THREE = window.THREE;
    if (!THREE) return false;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (error) {
      return false;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(2.15, 1.7, 3.7);
    camera.lookAt(0, 1.05, 0);

    const shell = new THREE.MeshStandardMaterial({
      color: 0xf0b429,
      roughness: 0.48,
      metalness: 0.04
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x1c2420,
      roughness: 0.45,
      metalness: 0.35
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xfff6d2,
      emissive: 0xffb300,
      emissiveIntensity: 0.7,
      roughness: 0.25
    });

    const helmet = new THREE.Group();

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.5),
      shell
    );
    dome.scale.set(1.12, 0.78, 1.16);
    dome.position.y = 0.78;
    dome.castShadow = true;
    helmet.add(dome);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.28, 0.1, 64), shell);
    brim.position.set(0, 0.74, 0.06);
    brim.scale.set(1.08, 1, 1.02);
    brim.castShadow = true;
    helmet.add(brim);

    const brimLip = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.028, 8, 64), dark);
    brimLip.rotation.x = Math.PI / 2;
    brimLip.position.set(0, 0.74, 0.06);
    brimLip.scale.set(1.05, 1, 0.98);
    helmet.add(brimLip);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.85), shell);
    ridge.position.set(0, 1.52, 0.02);
    ridge.castShadow = true;
    helmet.add(ridge);

    const lamp = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 24), dark);
    housing.rotation.x = Math.PI / 2;
    lamp.add(housing);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), lensMat);
    lens.position.z = 0.12;
    lamp.add(lens);
    lamp.position.set(0, 1.05, 0.92);
    lamp.rotation.x = -0.35;
    helmet.add(lamp);

    scene.add(helmet);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 64),
      new THREE.MeshStandardMaterial({ color: 0x10211c, roughness: 1, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.66;
    floor.receiveShadow = true;
    scene.add(floor);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.012, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0xf0b429 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.68;
    scene.add(halo);

    scene.add(new THREE.AmbientLight(0xe7f6ef, 0.85));
    const key = new THREE.DirectionalLight(0xfff4e0, 1.7);
    key.position.set(3.2, 5, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ee8d4, 0.7);
    fill.position.set(-3.5, 2, -2);
    scene.add(fill);

    const gemColors = [0x1d4e9f, 0x2f9e4f, 0xef8b14];
    const gems = [];
    for (let i = 0; i < 8; i += 1) {
      const color = gemColors[i % 3];
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.085, 0),
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.22
        })
      );
      scene.add(gem);
      gems.push({ mesh: gem, a: (i / 8) * Math.PI * 2 });
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let targetX = -0.18;
    let targetY = -0.9;
    let dragging = false;
    let lastX = 0;

    function resize() {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    canvas.addEventListener("pointerdown", function (event) {
      dragging = true;
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointerup", function () {
      dragging = false;
    });
    canvas.addEventListener("pointercancel", function () {
      dragging = false;
    });
    canvas.addEventListener("pointermove", function (event) {
      const rect = canvas.getBoundingClientRect();
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = ny * 0.28;
      if (dragging) {
        targetY += (event.clientX - lastX) * 0.01;
        lastX = event.clientX;
      }
    });

    let running = true;
    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);
      if (!dragging && !reduce) targetY += 0.004;
      helmet.rotation.y += (targetY - helmet.rotation.y) * 0.08;
      helmet.rotation.x += (targetX - helmet.rotation.x) * 0.08;
      if (!reduce) helmet.position.y = Math.sin(performance.now() * 0.0011) * 0.05;
      gems.forEach(function (gem) {
        if (!reduce) gem.a += 0.0045;
        gem.mesh.position.set(
          Math.cos(gem.a) * 2.15,
          Math.sin(gem.a * 2) * 0.28 + 1.05,
          Math.sin(gem.a) * 1.7
        );
        gem.mesh.rotation.y = gem.a;
      });
      renderer.render(scene, camera);
    }
    frame();

    return {
      stop: function () {
        running = false;
      }
    };
  }

  window.EQScene = { startHelmet: startHelmet };
})();
