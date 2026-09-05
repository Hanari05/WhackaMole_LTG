let currMoleTile;
const currPlantTiles = new Set();
let score = 0;
let gameOver = false;
let gameStarted = false;
let settingsOpen = false;
let sfxVolume = 1;
let bgmVolume = 1;
let sfxMuted = false;
let bgmMuted = false;

const BOARD_COLUMNS = 5;
const BOARD_ROWS = 3;
const TILE_COUNT = BOARD_COLUMNS * BOARD_ROWS;
const MAX_LIVES = 3;
const BASE_MOLE_DELAY = 1000;
const BASE_PLANT_DELAY = 2000;
const SPEED_MULTIPLIER_PER_LEVEL = 0.9;
const MIN_MOLE_DELAY = 300;
const MIN_PLANT_DELAY = 600;
let lives = MAX_LIVES;
let moleTimerId = null;
let plantTimerId = null;

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
    updateLives();
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
    lives = MAX_LIVES;
    gameOver = false;
    currMoleTile = null;
    currPlantTiles.clear();
    stopSpawnTimers();

    document.getElementById("score").innerText = "0";
    updateLives();

    for (let i = 0; i < TILE_COUNT; i++) {
        document.getElementById(i.toString()).innerHTML = "";
    }

    const hammer = document.getElementById("hammer");
    hammer.style.display = "none";
    hammer.classList.remove("hit");

    if (!gameStarted) {
        document.getElementById("start-overlay").classList.remove("hidden");
        return;
    }

    scheduleSpawnTimers();
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
    scheduleSpawnTimers();
    bgMusic.play().catch(() => {});
}

function getSpeedLevel() {
    return Math.floor(score / 100);
}

function getSpawnDelay(baseDelay, minimumDelay) {
    const delay = baseDelay * Math.pow(SPEED_MULTIPLIER_PER_LEVEL, getSpeedLevel());
    return Math.max(minimumDelay, Math.round(delay));
}

function getPlantCount() {
    return Math.min(4, 1 + Math.floor(score / 200));
}

function stopSpawnTimers() {
    clearTimeout(moleTimerId);
    clearTimeout(plantTimerId);
    moleTimerId = null;
    plantTimerId = null;
}

function scheduleMole() {
    clearTimeout(moleTimerId);
    moleTimerId = setTimeout(() => {
        setMole();
        scheduleMole();
    }, getSpawnDelay(BASE_MOLE_DELAY, MIN_MOLE_DELAY));
}

function schedulePlants() {
    clearTimeout(plantTimerId);
    plantTimerId = setTimeout(() => {
        setPlants();
        schedulePlants();
    }, getSpawnDelay(BASE_PLANT_DELAY, MIN_PLANT_DELAY));
}

function scheduleSpawnTimers() {
    stopSpawnTimers();
    scheduleMole();
    schedulePlants();
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
    // Set up a 5-column by 3-row grid.
    for (let i = 0; i < TILE_COUNT; i++) {
        // <div id="0-14"></div>
        let tile = document.createElement("div");
        tile.id = i.toString();
        tile.addEventListener("click", selectTile);
        document.getElementById("board").appendChild(tile);
    }
}

function getShuffledTiles() {
    const tiles = [];
    for (let i = 0; i < TILE_COUNT; i++) {
        tiles.push(document.getElementById(i.toString()));
    }

    for (let i = tiles.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[randomIndex]] = [tiles[randomIndex], tiles[i]];
    }

    return tiles;
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

    const availableTiles = getShuffledTiles().filter((tile) => !currPlantTiles.has(tile));
    if (availableTiles.length === 0) {
        return;
    }
    currMoleTile = availableTiles[0];
    currMoleTile.appendChild(mole);
    moleSound.currentTime = 0;
    moleSound.play().catch(() => {});
}

function setPlants() {
    if (!gameStarted || gameOver || settingsOpen) {
        return;
    }

    currPlantTiles.forEach((tile) => {
        tile.innerHTML = "";
    });
    currPlantTiles.clear();

    const availableTiles = getShuffledTiles().filter((tile) => tile !== currMoleTile);
    availableTiles.slice(0, getPlantCount()).forEach((tile) => {
        const plant = document.createElement("img");
        plant.src = "./piranha-plant.png";
        tile.appendChild(plant);
        currPlantTiles.add(tile);
    });

    plantSound.currentTime = 0;
    plantSound.play().catch(() => {});
}

function updateLives() {
    const livesElement = document.getElementById("lives");
    livesElement.innerHTML = "";

    for (let i = 0; i < MAX_LIVES; i++) {
        const heart = document.createElement("img");
        const isLost = i >= lives;
        heart.className = isLost ? "heart lost" : "heart";
        heart.src = "./heart.png";
        heart.alt = "";
        livesElement.appendChild(heart);
    }

    livesElement.setAttribute(
        "aria-label",
        lives + " of " + MAX_LIVES + " lives remaining"
    );
}

function animateAndRemoveTarget(tile) {
    const img = tile.querySelector("img");
    if (!img) {
        return;
    }

    img.classList.add("squashed");
    setTimeout(() => {
        if (tile.contains(img)) {
            img.remove();
        }
    }, 180);
}

function selectTile() {
    if (!gameStarted || gameOver || settingsOpen) {
        return;
    }

    if (this == currMoleTile) {
        // Clear the active reference immediately so one mole can score only once.
        currMoleTile = null;
        const previousSpeedLevel = getSpeedLevel();
        score += 10;
        document.getElementById("score").innerText = score.toString();
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
        animateAndRemoveTarget(this);

        if (getSpeedLevel() !== previousSpeedLevel) {
            scheduleSpawnTimers();
        }
        return;
    }

    if (currPlantTiles.has(this)) {
        // One plant can remove only one life, even if it is clicked repeatedly.
        currPlantTiles.delete(this);
        lives = Math.max(0, lives - 1);
        updateLives();
        loseSound.currentTime = 0;
        loseSound.play().catch(() => {});
        animateAndRemoveTarget(this);

        if (lives === 0) {
            bgMusic.pause();
            document.getElementById("score").innerText = "GAME OVER: " + score.toString();
            gameOver = true;
            stopSpawnTimers();
        }
    }
}
