import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/** CONFIGURACIONES DEL JUEGO */
const WORLD_SIZE = 260;
const TERRAIN_RES = 256;
const PUMPKIN_COUNT = 56;
const PLAYER_RADIUS = 0.35;
const FOG_DENSITY = 0.028;
const VR_WALK_SPEED = 5.5;
const HDRI_LOCAL = 'assets/hdr/moonless_golf_1k.hdr';

/** RENDERIZADOR / ESCENAS / CÁMARA */
const canvas = document.getElementById('scene');
const ambientEl = document.getElementById('ambient');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.xr.enabled = true;
renderer.autoClear = true;

// Escena principal
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06101a);
scene.fog = new THREE.FogExp2(0x06101a, FOG_DENSITY);

// Cámara del jugador
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
const player = new THREE.Group();
player.position.set(0, 1.6, 3);
player.add(camera);
scene.add(player);

// Configurar HDRI (fondo)
const pmremGen = new THREE.PMREMGenerator(renderer);
pmremGen.compileEquirectangularShader();
async function setHDRI(url) {
  const hdr = await new Promise((res, rej) => new RGBELoader().load(url, (t) => res(t), undefined, rej));
  const env = pmremGen.fromEquirectangular(hdr).texture;
  scene.environment = env;
  hdr.dispose(); pmremGen.dispose();
}
setHDRI(HDRI_LOCAL).catch(() => console.warn('Error cargando HDRI'));

/** LUCES */
const hemiLight = new THREE.HemisphereLight(0x8fb2ff, 0x0a0c10, 0.35);
scene.add(hemiLight);

/** CIELO / ESTRELLAS / LUNA */
const skyGeo = new THREE.SphereGeometry(2000, 48, 24);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false,
  uniforms: {
    topColor: { value: new THREE.Color(0x0a1f35) },
    bottomColor: { value: new THREE.Color(0x050910) }
  },
  vertexShader: `
    varying vec3 vDir;
    void main(){
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vDir;
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    void main(){
      float t = smoothstep(-0.2, 0.8, vDir.y);
      vec3 col = mix(bottomColor, topColor, t);
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
const skyMesh = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyMesh);

/** AGREGAR OBJETOS DEL JUEGO: BOLAS Y BOLOS */
const loader = new THREE.TextureLoader();
const ballGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 2, 10);
scene.add(ball);

// Crear bolos con modelos simples
const pinGeometry = new THREE.CylinderGeometry(1, 1, 5);
const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const pins = [];
for (let i = 0; i < 10; i++) {
  const pin = new THREE.Mesh(pinGeometry, pinMaterial);
  pin.position.set(i - 5, 2.5, -10);
  scene.add(pin);
  pins.push(pin);
}

// Animación de juego
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

// Función para iniciar el juego
function startGame() {
  document.getElementById('cover-page').style.display = 'none';
  // Iniciar mecánicas del juego
}

/** CONTROLES DE VR Y MOVIMIENTO */
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
