import './style.css';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const textFront = document.getElementsByClassName('text-front')[0];
const textFront2 = document.getElementsByClassName('text-front')[1];
const canvasRect = document.getElementById('canvas');

const parallaxScaling1 = 0.0005;
const parallaxScaling2 = 0.00025;
const parallaxScaling3 = 0.0000001;

let currentScroll = 0;
let targetScroll = 0;
let ease = 0.001;
let theta1 = 0;

function updateScale() {
  let rect = canvasRect.getBoundingClientRect();
  let startScrollPosition = window.pageYOffset + rect.top;
  let endScrollPosition = window.pageYOffset + rect.bottom;

  if (targetScroll + window.innerHeight < startScrollPosition || targetScroll > endScrollPosition) {
    return;
  }

  currentScroll += (targetScroll - currentScroll) * ease;

  let scaleValue1 = 1 + (currentScroll * parallaxScaling1);
  let scaleValue2 = 1 + (currentScroll * parallaxScaling2);

  textFront.style.transform = `scale(${scaleValue1})`;
  textFront2.style.transform = `scale(${scaleValue2})`;
  canvasRect.style.transform = `scale(${scaleValue2})`;

  theta1 += currentScroll * parallaxScaling3;

  setTimeout(updateScale, 1000 / 60);
}

window.addEventListener('scroll', () => {
  targetScroll = window.pageYOffset;
  updateScale();
});

updateScale();

var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x11151c, 0.001);

var group = new THREE.Group();
scene.add(group);

var cd = new THREE.Group();
scene.add(cd);

const pointlight = new THREE.PointLight(0xffffff, 100, 60);
pointlight.position.set(-5, 0, 2);
group.add(pointlight);

const pointlight2 = new THREE.PointLight(0x9f85cc, 112.5, 20);
pointlight2.position.set(4, 12, 12);
group.add(pointlight2);

const pointlight3 = new THREE.PointLight(0xffffff, 200, 60);
pointlight2.position.set(-8, 0, -5);
group.add(pointlight3);

var camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
group.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

group.position.set(10, 0, 0)

const mtlLoader = new MTLLoader();
const objloader = new OBJLoader();

const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function (url, item, total) {
  console.log(`Started loading: ${url}`);
}

const loadingScreen = document.getElementById('loading-screen');
loadingScreen.style.display = 'flex';

const load3DObject = new Promise((resolve) => {
  mtlLoader.load(
    'models/CD.mtl',
    (materials) => {
      materials.preload();
      objloader.setMaterials(materials);

      objloader.load(
        'models/CD.obj',
        (object) => {
          object.scale.setScalar(3);
          cd.add(object);
          resolve();
        },
      );
    },
    undefined,
    (error) => {
      console.error('Error loading MTL:', error);
    }
  );
});

Promise.all([load3DObject, new Promise((resolve) => window.addEventListener('load', resolve))])
  .then(() => {
    loadingScreen.style.display = 'none';
    animate();
  })
  .catch((error) => {
    console.error('Error during loading:', error);
  });

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

var update = function () {
  theta1 += 0.1;

  camera.lookAt(0, 0, 0);
};

function animate() {
  controls.update();
  update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

var toggleButton = document.getElementById("toggleButton");
var menuContainer = document.getElementById("menuContainer");
var spotifyIcon = document.getElementById("spotify-icon");
var backButton = document.getElementById("backButton");

toggleButton.addEventListener("click", function () {
  this.classList.toggle("active");

  if (this.classList.contains("active")) {
    menuContainer.style.left = "0";
    spotifyIcon.style.display = "none";
    backButton.style.left = "24vw";
  } else {
    menuContainer.style.left = "-25vw";
    spotifyIcon.style.display = "block";
    backButton.style.left = "-5vw";
  }
});

document.addEventListener("click", function (event) {
  var isClickInsideMenuContainer = menuContainer.contains(event.target);
  var isClickInsideToggleButton = toggleButton.contains(event.target);

  if (!isClickInsideMenuContainer && !isClickInsideToggleButton) {
    toggleButton.classList.remove("active");
    menuContainer.style.left = "-25vw";
    spotifyIcon.style.display = "block";
    backButton.style.left = "-5vw";
  }
});

const spotifyIframe = document.getElementById('iframe');

function isSpotifyPlaying() {
  spotifyIframe.contentWindow.postMessage('{"event":"command","func":"getCurrentState","args":""}', '*');
}

setInterval(() => {
  isSpotifyPlaying();
}, 1000);

window.addEventListener('message', (event) => {
  try {
    const data = event.data;

    if (!data.payload.isPaused && data.payload.duration !== data.payload.position) {
      update = function () {
        cd.rotation.z += -0.033333333;
      };
    } else {
      update = function () {
        cd.rotation.x += 0;
      };
    }
  } catch (error) {
    console.log("Error: " + error);
  }
});