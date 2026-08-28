let currMoleTile;
let currPlantTile;
let score = 0;
let gameOver = false;
let gameStarted = false;
let settingsOpen = false;
let sfxVolume = 1;
let bgmVolume = 1;
let sfxMuted = false;
let bgmMuted = false;

const refreshVolumeSliders = [];

const VOLUME_ICONS = {
    sfx: { on: "settings/SFX.png", off: "settings/MuteSFX.png" },
    bgm: { on: "settings/BGM.png", off: "settings/MuteBGM.png" },
};
const SETTINGS_STORAGE_KEY = "whackamole-audio-settings";
const SETTINGS_STORAGE_VERSION = 2;

function resetAudioSettingsToDefault() {
    sfxVolume = 1;
    bgmVolume = 1;
    sfxMuted = false;
    bgmMuted = false;
}

const moleSound = new Audio("./sound/mole_SFX.wav");
const plantSound = new Audio("./sound/plant_SFX.wav");
const bgMusic = new Audio("./sound/Theme_Full.wav");
const loseSound = new Audio("./sound/lose_SFX.wav");
const hitSound = new Audio("./sound/hit_SFX.wav");
const sfxSounds = [moleSound, plantSound, hitSound, loseSound];

function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
}

function getEffectiveVolume(volume, muted) {
    return muted ? 0 : volume;
}

function applyVolumes() {
    bgMusic.volume = getEffectiveVolume(bgmVolume, bgmMuted);
    const sfxLevel = getEffectiveVolume(sfxVolume, sfxMuted);
    sfxSounds.forEach((sound) => {
        sound.volume = sfxLevel;
    });
}

function loadAudioSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            applyVolumes();
            return;
        }
        const data = JSON.parse(raw);
        if (data.version !== SETTINGS_STORAGE_VERSION) {
            resetAudioSettingsToDefault();
            applyVolumes();
            saveAudioSettings();
            return;
        }
        if (typeof data.sfxVolume === "number") {
            sfxVolume = clampVolume(data.sfxVolume);
        }
        if (typeof data.bgmVolume === "number") {
            bgmVolume = clampVolume(data.bgmVolume);
        }
        if (typeof data.sfxMuted === "boolean") {
            sfxMuted = data.sfxMuted;
        }
        if (typeof data.bgmMuted === "boolean") {
            bgmMuted = data.bgmMuted;
        }
    } catch (e) {
        resetAudioSettingsToDefault();
    }
    applyVolumes();
}

function saveAudioSettings() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
            version: SETTINGS_STORAGE_VERSION,
            sfxVolume,
            bgmVolume,
            sfxMuted,
            bgmMuted,
        }));
    } catch (e) {
        // ignore quota / private mode errors
    }
}

window.onload = function() {
    bgMusic.loop = true;
    loadAudioSettings();
    setupBoard();
    initStartScreen();

    const hammer = document.getElementById("hammer");
    const board = document.getElementById("board");

    board.addEventListener("mousemove", (e) => {
        if (!gameStarted) {
            return;
        }
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

    initSettings();
    initRestart();
}

function closeSettings() {
    settingsOpen = false;
    document.getElementById("settings-overlay").classList.add("hidden");
    document.getElementById("settings-overlay").setAttribute("aria-hidden", "true");
}

function initRestart() {
    document.getElementById("restart-btn").addEventListener("click", restartGame);
}

function restartGame() {
    if (settingsOpen) {
        closeSettings();
    }

    score = 0;
    gameOver = false;
    currMoleTile = null;
    currPlantTile = null;

    document.getElementById("score").innerText = "0";

    for (let i = 0; i < 9; i++) {
        document.getElementById(i.toString()).innerHTML = "";
    }

    const hammer = document.getElementById("hammer");
    hammer.style.display = "none";
    hammer.classList.remove("hit");

    if (!gameStarted) {
        document.getElementById("start-overlay").classList.remove("hidden");
        return;
    }

    bgMusic.currentTime = 0;
    if (!bgmMuted) {
        bgMusic.play().catch(() => {});
    }
}

function initStartScreen() {
    const overlay = document.getElementById("start-overlay");

    overlay.addEventListener("click", startGame);

    document.addEventListener("keydown", (e) => {
        if (gameStarted || settingsOpen) {
            return;
        }
        if (e.key === "Tab" || e.key === "Shift") {
            return;
        }
        startGame();
    });
}

function startGame() {
    if (gameStarted) {
        return;
    }
    gameStarted = true;
    document.getElementById("start-overlay").classList.add("hidden");
    setInterval(setMole, 1000);
    setInterval(setPlant, 2000);
    bgMusic.play().catch(() => {});
}

function initSettings() {
    const overlay = document.getElementById("settings-overlay");
    const openBtn = document.getElementById("settings-btn");
    const closeBtn = document.getElementById("settings-back");
    const hammer = document.getElementById("hammer");

    openBtn.addEventListener("click", () => {
        settingsOpen = true;
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
        hammer.style.display = "none";
        requestAnimationFrame(() => {
            refreshVolumeSliders.forEach((refresh) => refresh());
        });
    });

    closeBtn.addEventListener("click", closeSettings);

    document.getElementById("settings-restart-btn").addEventListener("click", restartGame);

    initVolumeSliders();
}

function initVolumeSliders() {
    document.querySelectorAll(".volume-row").forEach((row) => {
        const channel = row.dataset.channel;
        const isBgm = channel === "bgm";
        const state = {
            volume: isBgm ? bgmVolume : sfxVolume,
            muted: isBgm ? bgmMuted : sfxMuted,
            savedVolume: isBgm ? bgmVolume : sfxVolume,
        };

        const rail = row.querySelector(".slider-rail");
        const fillWrap = row.querySelector(".slider-fill-wrap");
        const fill = row.querySelector(".slider-fill");
        const thumb = row.querySelector(".slider-thumb");
        const iconBtn = row.querySelector(".volume-icon-btn");
        const icon = row.querySelector(".volume-icon");

        const SLIDER_INSET = 6;
        const VOLUME_EPSILON = 0.005;

        const getUsableWidth = () => Math.max(rail.offsetWidth - SLIDER_INSET * 2, 0);

        const syncFillWidth = () => {
            fill.style.width = rail.offsetWidth - SLIDER_INSET * 2 + "px";
        };

        const isMutedVisual = () => state.muted || state.volume <= VOLUME_EPSILON;

        const updateSliderUI = () => {
            syncFillWidth();
            const displayVolume = isMutedVisual() ? 0 : state.volume;
            const usableWidth = getUsableWidth();
            fillWrap.style.width = displayVolume * usableWidth + "px";
            thumb.style.left = SLIDER_INSET + displayVolume * usableWidth - thumb.offsetWidth / 2 + "px";
            icon.src = isMutedVisual() ? VOLUME_ICONS[channel].off : VOLUME_ICONS[channel].on;
        };

        const persistVolume = () => {
            const volumeToSave = state.muted ? state.savedVolume : state.volume;
            if (isBgm) {
                bgmVolume = volumeToSave;
                bgmMuted = state.muted;
            } else {
                sfxVolume = volumeToSave;
                sfxMuted = state.muted;
            }
            applyVolumes();
            saveAudioSettings();
        };

        const setVolume = (value) => {
            state.volume = Math.max(0, Math.min(1, value));
            if (state.volume > VOLUME_EPSILON) {
                state.savedVolume = state.volume;
                state.muted = false;
            } else {
                state.volume = 0;
                state.muted = true;
            }
            updateSliderUI();
            persistVolume();
        };

        iconBtn.addEventListener("click", () => {
            if (state.muted) {
                state.muted = false;
                setVolume(state.savedVolume > VOLUME_EPSILON ? state.savedVolume : 0.5);
            } else {
                state.muted = true;
                if (state.volume > VOLUME_EPSILON) {
                    state.savedVolume = state.volume;
                }
                state.volume = 0;
                updateSliderUI();
                persistVolume();
            }
        });

        rail.addEventListener("pointerdown", (e) => {
            if (e.target === thumb) {
                return;
            }
            const rect = rail.getBoundingClientRect();
            const nextVolume = (e.clientX - rect.left - SLIDER_INSET) / getUsableWidth();
            setVolume(nextVolume);
        });

        thumb.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            thumb.setPointerCapture(e.pointerId);

            const onMove = (ev) => {
                const rect = rail.getBoundingClientRect();
                const nextVolume = (ev.clientX - rect.left - SLIDER_INSET) / getUsableWidth();
                setVolume(nextVolume);
            };

            const onUp = (ev) => {
                thumb.releasePointerCapture(ev.pointerId);
                thumb.removeEventListener("pointermove", onMove);
                thumb.removeEventListener("pointerup", onUp);
                thumb.removeEventListener("pointercancel", onUp);
            };

            thumb.addEventListener("pointermove", onMove);
            thumb.addEventListener("pointerup", onUp);
            thumb.addEventListener("pointercancel", onUp);
        });

        window.addEventListener("resize", updateSliderUI);

        refreshVolumeSliders.push(() => {
            state.volume = isBgm ? bgmVolume : sfxVolume;
            state.muted = isBgm ? bgmMuted : sfxMuted;
            state.savedVolume = isBgm ? bgmVolume : sfxVolume;
            updateSliderUI();
        });
    });
}

function setupBoard() {
    //set up the grid in html
    for (let i = 0; i < 9; i++) { //i goes from 0 to 8, stops at 9
        //<div id="0-8"></div>
        let tile = document.createElement("div");
        tile.id = i.toString();
        tile.addEventListener("click", selectTile);
        document.getElementById("board").appendChild(tile);
    }
}

function getRandomTile() {
    //math.random --> 0-1 --> (0-1) * 9 = (0-9) --> round down to (0-8) integers
    let num = Math.floor(Math.random() * 9);
    return num.toString();
}

function setMole() {
    if (!gameStarted || gameOver || settingsOpen) {
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
    if (!gameStarted || gameOver || settingsOpen) {
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
    plantSound.play();
}

function selectTile() {
    if (!gameStarted || gameOver || settingsOpen) {
        return;
    }
    if (this == currMoleTile) {
        score += 10;
        document.getElementById("score").innerText = score.toString(); //update score html
        hitSound.play();

        let img = this.querySelector("img");
        if (img) {
            img.classList.add("squashed");
        }
    }
    else if (this == currPlantTile) {
        loseSound.play();
        bgMusic.pause();
        document.getElementById("score").innerText = "GAME OVER: " + score.toString(); //update score html
        gameOver = true;

        let img = this.querySelector("img");
        if (img) {
            img.classList.add("squashed");
        }
    }
}