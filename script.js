let camera, scene, renderer, controls;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxqeRTNrCjlvTakh8RfGC2An1vdUAzJzn8DkXi9O_YxVIOkd89ygm7yUHr4mhpDfxxp/exec";

init();
animate();

function handleCredentialResponse(response) {

    const user = parseJwt(response.credential);

    document.querySelector(".login-container").style.display = "none";
    renderer.domElement.style.display = "block";
    document.getElementById("layoutMenu").style.display = "block";
    document.getElementById("legend").style.display = "flex";

    const userBox = document.getElementById("userInfo");
    userBox.style.display = "block";
    userBox.innerHTML = `
        <img src="${user.picture}" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;">
        <span style="margin-left:10px;font-weight:bold;">${user.name}</span>
        <button onclick="logout()" style="margin-left:15px;padding:6px 12px;border-radius:20px;background:#222;color:white;border:1px solid #555;cursor:pointer;">
            Logout
        </button>
    `;

    fetch(SHEET_URL)
        .then(res => res.json())
        .then(data => {
            createTiles(data);
            initLayouts();
            transform(targets.table, 2000);
        });
}

function logout() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
}

function init() {

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.display = "none";

    controls = new THREE.OrbitControls(camera, renderer.domElement);
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
        const netWorth = parseFloat(netWorthRaw.replace(/[^0-9.]/g, ""));

        const element = document.createElement("div");
        element.className = "element";

        if (netWorth < 100000) {
            element.style.backgroundColor = "red";
        } else if (netWorth < 200000) {
            element.style.backgroundColor = "orange";
        } else {
            element.style.backgroundColor = "green";
        }

        element.innerHTML = `
            <img src="${photo}">
            <div style="font-weight:bold;font-size:14px;">${name}</div>
            <div style="margin-top:6px;font-size:13px;">$${netWorth.toLocaleString()}</div>
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
    const tableRows = 10;
    const spacingX = 170;
    const spacingY = 220;

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const row = Math.floor(i / tableCols);
        const col = i % tableCols;

        object.position.x = (col - tableCols / 2) * spacingX;
        object.position.y = -(row - tableRows / 2) * spacingY;
        object.position.z = 0;

        targets.table.push(object);
    }

    const radius = 900;
    const separation = 150;
    const angleStep = 0.4;

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const strand = i % 2;
        const index = Math.floor(i / 2);
        const angle = index * angleStep;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = (index - objects.length / 4) * 35;

        object.position.x = x + (strand === 0 ? -separation : separation);
        object.position.y = y;
        object.position.z = z;

        targets.helix.push(object);
    }

    const cols = 10;
    const rows = 4;
    const layersize = cols * rows;
    const spacing = 300;

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        const layer = Math.floor(i / layersize);

        const x = (col - cols / 2) * spacing;
        const y = -(row - rows / 2) * spacing;
        const z = -layer * spacing * 1.5;

        object.position.set(x, y, z);

        targets.grid.push(object);
    }

    for (let i = 0; i < objects.length; i++) {

        const object = new THREE.Object3D();

        const phi = Math.acos(-1 + (2 * i) / objects.length);
        const theta = Math.sqrt(objects.length * Math.PI) * phi;

        object.position.x = 900 * Math.cos(theta) * Math.sin(phi);
        object.position.y = 900 * Math.sin(theta) * Math.sin(phi);
        object.position.z = 900 * Math.cos(phi);

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
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}
