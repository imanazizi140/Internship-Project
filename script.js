function handleCredentialResponse(response) {
    console.log("JWT:", response.credential);
    alert("Login Successful!");
}

let camera, scene, renderer, controls;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        10000
    );

    camera.position.z = 3000;

    scene = new THREE.Scene();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ✅ Orbit Controls (ZOOM FIX)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.minDistance = 500;
    controls.maxDistance = 6000;

    window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createTiles(data) {

    for (let i = 1; i < data.length; i++) {

        const name = data[i][0];
        const photo = data[i][1];
        const netWorthRaw = data[i][5];

        const netWorth = parseFloat(
            netWorthRaw.replace(/[^0-9.]/g, "")
        );

        const element = document.createElement("div");
        element.className = "element";

        // 🌸 Smooth Pink Gradient
        const maxWorth = 400000;
        const ratio = Math.min(netWorth / maxWorth, 1);

        const lightPink = [255, 182, 193];
        const darkPink = [199, 21, 133];

        const r = Math.floor(lightPink[0] + ratio * (darkPink[0] - lightPink[0]));
        const g = Math.floor(lightPink[1] + ratio * (darkPink[1] - lightPink[1]));
        const b = Math.floor(lightPink[2] + ratio * (darkPink[2] - lightPink[2]));

        element.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

        element.innerHTML = `
            <img src="${photo}" width="80" height="80"><br>
            <strong>${name}</strong><br>
            $${netWorth.toLocaleString()}
        `;

        const object = new THREE.CSS3DObject(element);

        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;

        scene.add(object);
        objects.push(object);
    }
}

function initLayouts() {

    targets = { table: [], sphere: [], helix: [], grid: [] };

    const tableCols = 20;
    const tableRows = Math.ceil(objects.length / tableCols);

    for (let i = 0; i < objects.length; i++) {

        const row = Math.floor(i / tableCols);
        const col = i % tableCols;

        const object = new THREE.Object3D();
        object.position.x = (col - tableCols / 2) * 150;
        object.position.y = -(row - tableRows / 2) * 180;

        targets.table.push(object);
    }

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();
        const angle = i * 0.3;
        const radius = 900;

        object.position.x = radius * Math.cos(angle);
        object.position.y = (i - objects.length / 2) * 20;
        object.position.z = radius * Math.sin(angle);

        targets.helix.push(object);
    }

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const x = ((i % 5) - 2) * 400;
        const y = (-(Math.floor(i / 5) % 5) + 2) * 400;
        const z = (Math.floor(i / 25) - 2) * 400;

        object.position.set(x, y, z);

        targets.grid.push(object);
    }

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const phi = Math.acos(-1 + (2 * i) / objects.length);
        const theta = Math.sqrt(objects.length * Math.PI) * phi;

        object.position.x = 800 * Math.cos(theta) * Math.sin(phi);
        object.position.y = 800 * Math.sin(theta) * Math.sin(phi);
        object.position.z = 800 * Math.cos(phi);

        targets.sphere.push(object);
    }
}

function transform(targetsArray, duration) {

    for (let i = 0; i < objects.length; i++) {

        new TWEEN.Tween(objects[i].position)
            .to(targetsArray[i].position, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }

    new TWEEN.Tween(this)
        .to({}, duration)
        .onUpdate(render)
        .start();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update(); // ✅ important
    render();
}

function render() {
    renderer.render(scene, camera);
}

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxqeRTNrCjlvTakh8RfGC2An1vdUAzJzn8DkXi9O_YxVIOkd89ygm7yUHr4mhpDfxxp/exec";

fetch(SHEET_URL)
    .then(res => res.json())
    .then(data => {
        createTiles(data);
        initLayouts();
        transform(targets.table, 2000);
    })
    .catch(err => console.error(err));
