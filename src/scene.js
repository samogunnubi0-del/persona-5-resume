import * as THREE from 'three'
import { gsap } from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ reducedMotion?: boolean }} [options]
 */
export function createSceneController(canvas, options = {}) {
  const { reducedMotion = false } = options
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.7, 0.45)
  composer.addPass(bloomPass)
  if (reducedMotion) {
    bloomPass.strength = 0.08
  }

  const geometry = new THREE.IcosahedronGeometry(8.2, 2)
  const material = new THREE.MeshPhongMaterial({
    color: 0xe60012,
    wireframe: true,
    transparent: true,
    opacity: 0.28,
    flatShading: true
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 0, -1.5)
  scene.add(mesh)

  const platformGroup = new THREE.Group()
  platformGroup.position.set(0, -5.5, -8)
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7, 0.35, 64, 1, false),
    new THREE.MeshPhysicalMaterial({
      color: 0x1d2b74,
      emissive: 0x141b4f,
      emissiveIntensity: 0.9,
      metalness: 0.08,
      roughness: 0.1,
      transmission: 1,
      thickness: 2,
      ior: 1.5,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.15
    })
  )
  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(7.35, 0.17, 24, 120),
    new THREE.MeshStandardMaterial({
      color: 0xc7d0f3,
      emissive: 0xb9922f,
      emissiveIntensity: 1.1
    })
  )
  platformRing.rotation.x = Math.PI / 2
  platformRing.position.y = 0.26
  const platformInnerRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.6, 0.07, 18, 90),
    new THREE.MeshStandardMaterial({
      color: 0xe60012,
      emissive: 0x8f0012,
      emissiveIntensity: 1.5
    })
  )
  platformInnerRing.rotation.x = Math.PI / 2
  platformInnerRing.position.y = 0.27
  platformGroup.add(platform, platformRing, platformInnerRing)
  scene.add(platformGroup)

  const fogUniforms = {
    uTime: { value: 0 },
    uHover: { value: 0 },
    uColorA: { value: new THREE.Color(0x0b1442) },
    uColorB: { value: new THREE.Color(0x050507) },
    uAccent: { value: new THREE.Color(0xe60012) }
  }
  const fogMaterial = new THREE.ShaderMaterial({
    uniforms: fogUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHover;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAccent;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = vUv * vec2(5.0, 3.0);
        float n1 = noise(uv + vec2(uTime * 0.08, 0.0));
        float n2 = noise((uv * 1.7) - vec2(0.0, uTime * 0.05));
        float mixN = smoothstep(0.2, 0.9, n1 * 0.65 + n2 * 0.45);
        vec3 base = mix(uColorB, uColorA, mixN);
        float hoverPulse = sin((vUv.y + uTime) * 48.0) * 0.03 * uHover;
        float redPulse = smoothstep(0.55, 0.95, n2) * (0.45 + 0.25 * sin(uTime * 0.9 + hoverPulse));
        vec3 finalColor = mix(base, uAccent, redPulse + uHover * 0.4);
        float alpha = 0.22 + mixN * 0.32 + uHover * 0.18;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `
  })
  const fogPlane = new THREE.Mesh(new THREE.PlaneGeometry(70, 45), fogMaterial)
  fogPlane.position.set(0, -1.5, -18)
  scene.add(fogPlane)

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(1, 1, 1)
  scene.add(light)
  const fillLight = new THREE.PointLight(0x7f8cff, 0.85)
  fillLight.position.set(-4, -3, 5)
  scene.add(fillLight)
  const redLight = new THREE.PointLight(0xe60012, 1.2, 60)
  redLight.position.set(2, -1, -10)
  scene.add(redLight)
  const underGlow = new THREE.PointLight(0x9fd9ff, 2.5, 65)
  underGlow.position.set(0, -9.4, -8)
  scene.add(underGlow)
  scene.add(new THREE.AmbientLight(0x404040))

  // 3D keyhole transition mesh (for bloom blast sequence)
  const keyholeShape = new THREE.Shape()
  keyholeShape.absarc(0, 1.25, 0.9, 0, Math.PI * 2, false)
  keyholeShape.moveTo(-0.35, 0.45)
  keyholeShape.lineTo(0.35, 0.45)
  keyholeShape.lineTo(0.2, -1.8)
  keyholeShape.lineTo(-0.2, -1.8)
  keyholeShape.lineTo(-0.35, 0.45)
  const keyholeGeo = new THREE.ExtrudeGeometry(keyholeShape, { depth: 0.08, bevelEnabled: false })
  const keyholeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf1ff,
    emissive: 0xa5b8ff,
    emissiveIntensity: 1.6,
    metalness: 0.85,
    roughness: 0.18,
    transparent: true,
    opacity: 0
  })
  const keyholeMesh = new THREE.Mesh(keyholeGeo, keyholeMat)
  keyholeMesh.scale.set(0.12, 0.12, 0.12)
  keyholeMesh.visible = false
  scene.add(keyholeMesh)

  // Dive-to-the-heart particle abyss
  const abyssCount = 950
  const abyssPos = new Float32Array(abyssCount * 3)
  const abyssVel = new Float32Array(abyssCount)
  const abyssColor = new Float32Array(abyssCount * 3)
  for (let i = 0; i < abyssCount; i++) {
    const idx = i * 3
    abyssPos[idx] = (Math.random() - 0.5) * 48
    abyssPos[idx + 1] = -60 + Math.random() * 120
    abyssPos[idx + 2] = -12 - Math.random() * 70
    abyssVel[i] = 0.02 + Math.random() * 0.06
    const gold = Math.random() > 0.55
    const c = gold ? new THREE.Color(0xb9922f) : new THREE.Color(0x56c788)
    abyssColor[idx] = c.r
    abyssColor[idx + 1] = c.g
    abyssColor[idx + 2] = c.b
  }
  const abyssGeo = new THREE.BufferGeometry()
  abyssGeo.setAttribute('position', new THREE.BufferAttribute(abyssPos, 3))
  abyssGeo.setAttribute('color', new THREE.BufferAttribute(abyssColor, 3))
  const abyssMat = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  // Soft-edged orb sprite for KH-like MP/HP particles.
  const orbCanvas = document.createElement('canvas')
  orbCanvas.width = 64
  orbCanvas.height = 64
  const orbCtx = orbCanvas.getContext('2d')
  if (orbCtx) {
    const grad = orbCtx.createRadialGradient(32, 32, 2, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.3, 'rgba(220,240,255,0.82)')
    grad.addColorStop(0.75, 'rgba(145,180,210,0.35)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    orbCtx.fillStyle = grad
    orbCtx.fillRect(0, 0, 64, 64)
  }
  const orbTexture = new THREE.CanvasTexture(orbCanvas)
  abyssMat.map = orbTexture
  abyssMat.alphaMap = orbTexture
  const abyssPoints = new THREE.Points(abyssGeo, abyssMat)
  if (reducedMotion) {
    abyssPoints.visible = false
  }
  scene.add(abyssPoints)

  // Shatter particle system
  const maxParticles = 280
  const particlePositions = new Float32Array(maxParticles * 3)
  const particleVelocity = new Float32Array(maxParticles * 3)
  const particleLife = new Float32Array(maxParticles)
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xfff2d0,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  if (reducedMotion) {
    particles.visible = false
  }
  scene.add(particles)

  // Save Point contact hub (end-of-scene 3D trigger mesh)
  const savePointGroup = new THREE.Group()
  savePointGroup.position.set(0, -26, -26)
  const saveOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.14, 20, 120),
    new THREE.MeshStandardMaterial({
      color: 0x91d8ff,
      emissive: 0x6fd5ff,
      emissiveIntensity: 1.5,
      metalness: 0.35,
      roughness: 0.2
    })
  )
  saveOuterRing.rotation.x = Math.PI / 2
  const saveCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.78, 2.1, 40),
    new THREE.MeshPhysicalMaterial({
      color: 0xbfd9ff,
      transparent: true,
      opacity: 0.6,
      transmission: 1,
      thickness: 1.4,
      roughness: 0.05,
      ior: 1.42,
      emissive: 0x6198ff,
      emissiveIntensity: 0.7
    })
  )
  const saveInnerGlow = new THREE.PointLight(0xbfd9ff, 1.8, 18)
  saveInnerGlow.position.set(0, 0, 0)
  savePointGroup.add(saveOuterRing, saveCore, saveInnerGlow)
  scene.add(savePointGroup)

  const mouse = { x: 0, y: 0 }
  let scrollProgress = 0
  let hoverGlitch = 0
  let glitchTarget = 0
  const clock = new THREE.Clock()
  let rafId = 0
  camera.position.z = 15

  function setHoverGlitch(active) {
    glitchTarget = active ? 1 : 0
  }

  function triggerShatter(intensity = 1) {
    if (reducedMotion) return
    for (let i = 0; i < maxParticles; i++) {
      const idx = i * 3
      // Spread them more for high intensity
      const spread = intensity > 2 ? 6 : 2.2
      particlePositions[idx] = (Math.random() - 0.5) * spread
      particlePositions[idx + 1] = -2.5 + (Math.random() - 0.5) * spread
      particlePositions[idx + 2] = -8 + (Math.random() - 0.5) * spread
      particleVelocity[idx] = (Math.random() - 0.5) * 0.25 * intensity
      particleVelocity[idx + 1] = (Math.random() - 0.3) * 0.3 * intensity
      particleVelocity[idx + 2] = (Math.random() - 0.5) * 0.25 * intensity
      particleLife[i] = 1
    }
    particleGeo.attributes.position.needsUpdate = true
    particleMat.opacity = 0.98
    if (intensity > 2) {
      gsap.fromTo(bloomPass, { strength: 0.42 }, { strength: 4.5, duration: 0.15, yoyo: true, repeat: 1 })
    }
  }

  function setMouse(x, y) {
    mouse.x = x
    mouse.y = y
  }

  function setScrollProgress(progress) {
    scrollProgress = progress
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
  }

  function updateParticles(delta) {
    if (reducedMotion) return
    let activeCount = 0
    for (let i = 0; i < maxParticles; i++) {
      if (particleLife[i] <= 0) continue
      const idx = i * 3
      particleLife[i] -= delta * 1.2
      particlePositions[idx] += particleVelocity[idx]
      particlePositions[idx + 1] += particleVelocity[idx + 1]
      particlePositions[idx + 2] += particleVelocity[idx + 2]
      particleVelocity[idx + 1] -= 0.0024
      activeCount++
    }
    particleMat.opacity = Math.max(0, activeCount / maxParticles)
    particleGeo.attributes.position.needsUpdate = true
  }

  function updateAbyss(delta) {
    if (reducedMotion) return
    for (let i = 0; i < abyssCount; i++) {
      const idx = i * 3
      abyssPos[idx + 1] += abyssVel[i] * delta * 60
      if (abyssPos[idx + 1] > 62) {
        abyssPos[idx + 1] = -62
        abyssPos[idx] = (Math.random() - 0.5) * 48
        abyssPos[idx + 2] = -12 - Math.random() * 70
      }
    }
    abyssGeo.attributes.position.needsUpdate = true
  }

  function triggerKeyholeTransition() {
    if (reducedMotion) return
    keyholeMesh.visible = true
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    keyholeMesh.position.copy(camera.position).add(forward.multiplyScalar(4.4))
    keyholeMesh.quaternion.copy(camera.quaternion)
    keyholeMesh.rotation.z += Math.PI
    keyholeMesh.scale.set(0.12, 0.12, 0.12)
    keyholeMat.opacity = 1

    gsap.killTweensOf(keyholeMesh.scale)
    gsap.killTweensOf(keyholeMat)
    gsap.killTweensOf(bloomPass)
    gsap.to(keyholeMesh.scale, { x: 2.6, y: 2.6, z: 2.6, duration: 0.48, ease: 'power3.out' })
    gsap.to(keyholeMat, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        keyholeMesh.visible = false
      }
    })
    gsap.fromTo(bloomPass, { strength: 0.42 }, { strength: 2.9, duration: 0.24, yoyo: true, repeat: 1, ease: 'power3.inOut' })
  }

  function tick() {
    const elapsed = clock.getElapsedTime()
    const delta = Math.min(clock.getDelta(), 0.033)
    fogUniforms.uTime.value = elapsed
    hoverGlitch += (glitchTarget - hoverGlitch) * 0.09
    fogUniforms.uHover.value = hoverGlitch

    mesh.rotation.y = elapsed * 0.1
    mesh.rotation.x = elapsed * 0.05
    mesh.rotation.z = Math.sin(elapsed * 0.6) * 0.08

    platformGroup.rotation.y = elapsed * 0.08
    platformGroup.position.y = -5.5 + Math.sin(elapsed * 0.8) * 0.12

    const targetY = -22 * scrollProgress
    const targetZ = 15 - 10.5 * scrollProgress
    const targetX = ((mouse.x - window.innerWidth / 2) * 0.0008) + Math.sin(elapsed * 0.35) * 0.25
    camera.position.x += (targetX - camera.position.x) * 0.08
    camera.position.y += (targetY - camera.position.y) * 0.06
    camera.position.z += (targetZ - camera.position.z) * 0.06
    camera.rotation.z = Math.sin(elapsed * 0.2 + scrollProgress * 4.5) * 0.035
    camera.lookAt(0, -3.5 - scrollProgress * 8, -8.5)

    mesh.position.x = (mouse.x - window.innerWidth / 2) * 0.005
    mesh.position.y = -(mouse.y - window.innerHeight / 2) * 0.005
    fillLight.position.x = Math.sin(elapsed * 0.7) * 3
    redLight.intensity = 1.0 + Math.sin(elapsed * 1.4) * 0.25 + hoverGlitch * 0.55
    savePointGroup.rotation.y += delta * 0.75
    savePointGroup.position.y = -26 + Math.sin(elapsed * 1.25) * 0.28
    saveOuterRing.rotation.z = Math.sin(elapsed * 0.6) * 0.2

    if (!reducedMotion) {
      updateParticles(delta)
      updateAbyss(delta)
    }
    if (reducedMotion) {
      renderer.render(scene, camera)
    } else {
      composer.render()
    }
    rafId = requestAnimationFrame(tick)
  }

  tick()

  function dispose() {
    cancelAnimationFrame(rafId)
    renderer.dispose()
  }

  return {
    setHoverGlitch,
    triggerShatter,
    triggerKeyholeTransition,
    setMouse,
    setScrollProgress,
    onResize,
    dispose
  }
}
