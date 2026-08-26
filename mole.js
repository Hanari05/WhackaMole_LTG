let currMoleTile;
let currPlantTile;
let score = 0;
let gameOver = false;
const moleSound = new Audio("./sound/mole_SFX.wav");
const plantSound = new Audio("./sound/plant_SFX.wav");
const bgMusic = new Audio("./sound/Theme_Full.wav");
const loseSound = new Audio("./sound/lose_SFX.wav");
const hitSound = new Audio("./sound/hit_SFX.wav");

window.onload = function() {
    setGame();
    bgMusic.play();
    bgMusic.volume = 0.1;

    const hammer = document.getElementById("hammer");
    const board = document.getElementById("board");

    board.addEventListener("mousemove", (e) => {
        hammer.style.display = "block";
        hammer.style.left = (e.pageX - hammer.offsetWidth / 2) + "px";
        hammer.style.top = (e.pageY - hammer.offsetHeight / 2) + "px";
    });

    board.addEventListener("mouseleave", () => {
        hammer.classList.add("hit");
    });
    board.addEventListener("mousedown", () => {
        hammer.classList.add("hit");
    });
    board.addEventListener("mouseup", () => {
        hammer.classList.remove("hit");
    });
}

function setGame() {
    //set up the grid in html
    for (let i = 0; i < 9; i++) { //i goes from 0 to 8, stops at 9
        //<div id="0-8"></div>
        let tile = document.createElement("div");
        tile.id = i.toString();
        tile.addEventListener("click", selectTile);
        document.getElementById("board").appendChild(tile);
    }
    setInterval(setMole, 1000); // 1000 miliseconds = 1 second, every 1 second call setMole
    setInterval(setPlant, 2000);// 2000 miliseconds = 2 seconds, every 2 second call setPlant
}

function getRandomTile() {
    //math.random --> 0-1 --> (0-1) * 9 = (0-9) --> round down to (0-8) integers
    let num = Math.floor(Math.random() * 9);
    return num.toString();
}

function setMole() {
    if (gameOver) {
        return;
    }
    if (currMoleTile) {
        currMoleTile.innerHTML = "";
    }
    let mole = document.createElement("img");
    mole.src = "./monty-mole.png";

    let num = getRandomTile();
    if (currPlantTile && currPlantTile.id == num) {
        return;
    }
    currMoleTile = document.getElementById(num);
    currMoleTile.appendChild(mole);
    moleSound.play();
}

function setPlant() {
    if (gameOver) {
        return;
    }
    if (currPlantTile) {
        currPlantTile.innerHTML = "";
    }
    let plant = document.createElement("img");
    plant.src = "./piranha-plant.png";

    let num = getRandomTile();
    if (currMoleTile && currMoleTile.id == num) {
        return;
    }
    currPlantTile = document.getElementById(num);
    currPlantTile.appendChild(plant);
    moleSound.play();
}

function selectTile() {
    if (gameOver) {
        return;
    }
    if (this == currMoleTile) {
        score += 10;
        document.getElementById("score").innerText = score.toString(); //update score html
        hitSound.play();
    }
    else if (this == currPlantTile) {
        loseSound.play();
        bgMusic.pause();
        document.getElementById("score").innerText = "GAME OVER: " + score.toString(); //update score html
        gameOver = true;
    }
}