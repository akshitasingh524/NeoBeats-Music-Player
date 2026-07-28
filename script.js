/* ==========================
   SONG DATA
========================== */

const songs = [
    {
        title: "Jo Tum Mere Ho",
        artist: "Anuv Jain",
        src: "songs/song1.mp3",
        cover: "asserts/cover1.jpg"
    },
    {
        title: "Barbad",
        artist: "AudioCopper",
        src: "songs/song2.mp3",
        cover: "asserts/cover2.jpg"
    },
    {
        title: "Maahi",
        artist: "Reprise",
        src: "songs/song3.mp3",
        cover: "asserts/cover3.jpg"
    },
    {
        title: "Tum ho Toh",
        artist: "Slowed + Reverb",
        src: "songs/song4.mp3",
        cover: "asserts/cover4.jpg"
    },
    {
        title: "Ve Kamleya",
        artist: "Rocky Aur Rani",
        src: "songs/song5.mp3",
        cover: "asserts/cover5.jpg"
    }
];

/* ==========================
   DOM ELEMENTS
========================== */

const audio = document.getElementById("audio");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const cover = document.getElementById("cover");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniCover = document.getElementById("miniCover");
const playBtn = document.getElementById("play");
const miniPlay = document.getElementById("miniPlay");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const volumeSlider = document.getElementById("volume");
const album = document.querySelector(".album");
const playlistEl = document.getElementById("playlist");
const playlistCount = document.querySelector(".section-title span");
const searchInput = document.getElementById("searchSong");
const favoriteSongBtn = document.getElementById("favoriteSong");
const copyBtn = document.getElementById("copySong");
const downloadBtn = document.getElementById("downloadSong");
const recentList = document.getElementById("recentList");
const themeBtn = document.getElementById("themeBtn");
const clock = document.getElementById("clock");
const toast = document.getElementById("toast");
const navItems = document.querySelectorAll(".sidebar nav li");

/* ==========================
   STATE
========================== */

const defaultCover = "asserts/default-cover.jpg";
const savedSong = Number(localStorage.getItem("lastSong"));
const savedVolumeValue = localStorage.getItem("volume");
const savedVolume = savedVolumeValue === null ? NaN : Number(savedVolumeValue);

let currentSong = Number.isInteger(savedSong) && songs[savedSong] ? savedSong : 0;
let isPlaying = false;
let shuffleMode = false;
let repeatMode = false;
let currentView = "home";
let favorites = new Set(readStoredArray("favorites"));
let recentlyPlayed = readStoredArray("recentlyPlayed").filter(index => songs[index]);

/* ==========================
   HELPERS
========================== */

function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

function saveRecentlyPlayed() {
    localStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));
}

function formatTime(time) {
    if (!Number.isFinite(time)) return "0:00";

    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function showToast(message) {
    toast.innerText = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function updatePlayIcons() {
    const icon = isPlaying ? "pause" : "play";
    playBtn.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    miniPlay.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
    album.classList.toggle("playing", isPlaying);
}

function updateFavoriteUI() {
    const isFavorite = favorites.has(currentSong);

    favoriteSongBtn.classList.toggle("active", isFavorite);
    favoriteSongBtn.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-heart"></i> ${isFavorite ? "Favorited" : "Favorite"}`;

    document.querySelectorAll(".fav-btn").forEach(btn => {
        const index = Number(btn.dataset.index);
        const icon = btn.querySelector("i");
        const active = favorites.has(index);
        icon.className = `fa-${active ? "solid" : "regular"} fa-heart`;
        btn.classList.toggle("active", active);
    });
}

function getVisibleSongIndexes() {
    const query = searchInput.value.trim().toLowerCase();
    let indexes = songs.map((_, index) => index);

    if (currentView === "favorites") {
        indexes = indexes.filter(index => favorites.has(index));
    }

    if (currentView === "recent") {
        indexes = recentlyPlayed;
    }

    if (query) {
        indexes = indexes.filter(index => {
            const song = songs[index];
            return `${song.title} ${song.artist}`.toLowerCase().includes(query);
        });
    }

    return indexes;
}

/* ==========================
   RENDERING
========================== */

function renderPlaylist() {
    const indexes = getVisibleSongIndexes();
    playlistEl.innerHTML = "";
    playlistCount.innerText = `${indexes.length} ${indexes.length === 1 ? "Song" : "Songs"}`;

    if (!indexes.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerText = searchInput.value.trim() ? "No songs match your search." : "No songs to show here yet.";
        playlistEl.appendChild(empty);
        return;
    }

    indexes.forEach(index => {
        const song = songs[index];
        const card = document.createElement("div");
        card.className = `song-card${index === currentSong ? " active" : ""}`;
        card.dataset.index = index;
        card.innerHTML = `
            <img src="${song.cover}" alt="${song.title}">
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
            <span class="song-duration" data-index="${index}">${song.duration || "--:--"}</span>
            <button class="fav-btn${favorites.has(index) ? " active" : ""}" data-index="${index}" aria-label="Toggle favorite">
                <i class="fa-${favorites.has(index) ? "solid" : "regular"} fa-heart"></i>
            </button>
        `;

        card.querySelector("img").addEventListener("error", event => {
            event.currentTarget.src = defaultCover;
        }, { once: true });

        card.addEventListener("click", () => {
            loadSong(index);
            playSong();
        });

        card.querySelector(".fav-btn").addEventListener("click", event => {
            event.stopPropagation();
            toggleFavorite(index);
        });

        playlistEl.appendChild(card);
    });
}

function renderRecentList() {
    recentList.innerHTML = "";

    if (!recentlyPlayed.length) {
        const li = document.createElement("li");
        li.innerText = "No recent songs";
        recentList.appendChild(li);
        return;
    }

    recentlyPlayed.forEach(index => {
        const song = songs[index];
        const li = document.createElement("li");
        li.dataset.index = index;
        li.innerHTML = `<strong>${song.title}</strong><span>${song.artist}</span>`;
        li.addEventListener("click", () => {
            loadSong(index);
            playSong();
        });
        recentList.appendChild(li);
    });
}

function setView(view) {
    currentView = view;

    navItems.forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });

    if (view === "home" || view === "playlist") {
        searchInput.value = "";
    }

    renderPlaylist();
    document.querySelector(".playlist-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ==========================
   PLAYER
========================== */

function loadSong(index) {
    if (!songs[index]) return;

    currentSong = index;
    const song = songs[currentSong];

    title.innerText = song.title;
    artist.innerText = song.artist;
    cover.src = song.cover;
    miniCover.src = song.cover;
    miniTitle.innerText = song.title;
    miniArtist.innerText = song.artist;
    audio.src = song.src;
    progress.value = 0;
    currentTime.innerText = "0:00";
    duration.innerText = song.duration || "0:00";

    localStorage.setItem("lastSong", String(currentSong));
    renderPlaylist();
    updateFavoriteUI();
}

function playSong() {
    audio.play()
        .then(() => {
            isPlaying = true;
            updatePlayIcons();
            addToRecentlyPlayed(currentSong);
        })
        .catch(() => {
            isPlaying = false;
            updatePlayIcons();
            showToast("Tap play again to start the song.");
        });
}

function pauseSong() {
    audio.pause();
    isPlaying = false;
    updatePlayIcons();
}

function togglePlay() {
    isPlaying ? pauseSong() : playSong();
}

function getNextIndex() {
    if (!shuffleMode || songs.length < 2) {
        return (currentSong + 1) % songs.length;
    }

    let nextIndex = currentSong;
    while (nextIndex === currentSong) {
        nextIndex = Math.floor(Math.random() * songs.length);
    }
    return nextIndex;
}

function nextSong() {
    loadSong(getNextIndex());
    playSong();
}

function previousSong() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    const previousIndex = currentSong - 1 < 0 ? songs.length - 1 : currentSong - 1;
    loadSong(previousIndex);
    playSong();
}

function addToRecentlyPlayed(index) {
    recentlyPlayed = [index, ...recentlyPlayed.filter(item => item !== index)].slice(0, 6);
    saveRecentlyPlayed();
    renderRecentList();

    if (currentView === "recent") {
        renderPlaylist();
    }
}

function toggleFavorite(index = currentSong) {
    if (favorites.has(index)) {
        favorites.delete(index);
        showToast("Removed from Favorites");
    } else {
        favorites.add(index);
        showToast("Added to Favorites");
    }

    saveFavorites();
    updateFavoriteUI();

    if (currentView === "favorites") {
        renderPlaylist();
    }
}

function preloadDurations() {
    songs.forEach((song, index) => {
        if (song.duration) return;

        const probe = new Audio();
        probe.preload = "metadata";
        probe.src = song.src;

        probe.addEventListener("loadedmetadata", () => {
            songs[index].duration = formatTime(probe.duration);
            renderPlaylist();
        }, { once: true });
    });
}

/* ==========================
   EVENTS
========================== */

playBtn.addEventListener("click", togglePlay);
miniPlay.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", previousSong);
favoriteSongBtn.addEventListener("click", () => toggleFavorite());

shuffleBtn.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    shuffleBtn.classList.toggle("active", shuffleMode);
    showToast(shuffleMode ? "Shuffle On" : "Shuffle Off");
});

repeatBtn.addEventListener("click", () => {
    repeatMode = !repeatMode;
    repeatBtn.classList.toggle("active", repeatMode);
    showToast(repeatMode ? "Repeat On" : "Repeat Off");
});

audio.addEventListener("loadedmetadata", () => {
    const formattedDuration = formatTime(audio.duration);
    songs[currentSong].duration = formattedDuration;
    progress.max = Math.floor(audio.duration) || 0;
    duration.innerText = formattedDuration;
    renderPlaylist();
});

audio.addEventListener("timeupdate", () => {
    progress.value = Math.floor(audio.currentTime) || 0;
    currentTime.innerText = formatTime(audio.currentTime);
});

audio.addEventListener("ended", () => {
    if (repeatMode) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
});

audio.addEventListener("error", () => {
    pauseSong();
    showToast("This audio file could not be loaded.");
});

cover.addEventListener("error", () => {
    cover.src = defaultCover;
}, { once: true });

miniCover.addEventListener("error", () => {
    miniCover.src = defaultCover;
}, { once: true });

progress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) {
        audio.currentTime = Number(progress.value);
    }
});

volumeSlider.addEventListener("input", () => {
    audio.volume = Number(volumeSlider.value) / 100;
    localStorage.setItem("volume", String(audio.volume));
});

searchInput.addEventListener("input", renderPlaylist);

navItems.forEach(item => {
    item.addEventListener("click", () => setView(item.dataset.view));
});

copyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(songs[currentSong].title);
        showToast("Song name copied");
    } catch {
        showToast(songs[currentSong].title);
    }
});

downloadBtn.addEventListener("click", () => {
    const song = songs[currentSong];
    const link = document.createElement("a");
    link.href = song.src;
    link.download = `${song.title.replace(/[\\/:*?"<>|]/g, "")}.mp3`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Download started");
});

themeBtn.addEventListener("click", () => {
    const lightMode = document.body.classList.toggle("light");
    localStorage.setItem("theme", lightMode ? "light" : "dark");
    themeBtn.innerHTML = `<i class="fa-solid fa-${lightMode ? "sun" : "moon"}"></i>`;
    showToast(lightMode ? "Light Mode" : "Dark Mode");
});

document.addEventListener("keydown", event => {
    if (event.target.tagName === "INPUT") return;

    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }

    if (event.code === "ArrowRight") nextSong();
    if (event.code === "ArrowLeft") previousSong();
});

/* ==========================
   CLOCK AND LOADER
========================== */

function updateClock() {
    const now = new Date();
    clock.innerText = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader");
        loader.style.opacity = "0";

        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }, 800);
});

/* ==========================
   INITIALIZE
========================== */

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

if (Number.isFinite(savedVolume)) {
    audio.volume = Math.min(Math.max(savedVolume, 0), 1);
    volumeSlider.value = Math.round(audio.volume * 100);
} else {
    audio.volume = Number(volumeSlider.value) / 100;
}

setInterval(updateClock, 1000);
updateClock();
renderRecentList();
loadSong(currentSong);
updatePlayIcons();
preloadDurations();

setTimeout(() => {
    showToast("Welcome to NeoBeats");
}, 1200);
