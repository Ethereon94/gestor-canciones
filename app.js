// ===============================
// SERVICE WORKER REGISTRATION
// ===============================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
      .catch(err => console.error('❌ Error registrando Service Worker:', err));
  });
}

// ===============================
// DATA
// ===============================
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let currentSetlist = [];
let editingSongId = null;

// ===============================
// DOM
// ===============================
const songList = document.getElementById('songList');
const setlist = document.getElementById('setlist');
const historyList = document.getElementById('historyList');

const songNameInput = document.getElementById('songName');
const songKeyInput = document.getElementById('songKey');
const searchSongInput = document.getElementById('searchSong');
const setlistDateInput = document.getElementById('setlistDate');
const sortMode = document.getElementById('sortMode');
const filterKey = document.getElementById('filterKey');

const stageMode = document.getElementById('stageMode');
const stageSetlist = document.getElementById('stageSetlist');

const lyricsView = document.getElementById('lyricsView');
const lyricsTitle = document.getElementById('lyricsTitle');
const lyricsKey = document.getElementById('lyricsKey');
const lyricsContent = document.getElementById('lyricsContent');

const songEditor = document.getElementById('songEditor');
const editorName = document.getElementById('editorName');
const editorKeyInput = document.getElementById('editorKeyInput');
const editorLyrics = document.getElementById('editorLyrics');

// ===============================
// INIT
// ===============================
setlistDateInput.value = new Date().toISOString().split('T')[0];
renderSongs();
renderHistory();
searchSongInput.addEventListener('input', renderSongs);

// ===============================
// STORAGE
// ===============================
const saveSongs = () => localStorage.setItem('songs', JSON.stringify(songs));
const saveHistory = () => localStorage.setItem('history', JSON.stringify(history));

// ===============================
// RENDER SONGS
// ===============================
function renderSongs() {
  songList.innerHTML = '';

  let list = songs.filter(s =>
    s.name.toLowerCase().includes(searchSongInput.value.toLowerCase())
  );

  if (filterKey && filterKey.value) {
    list = list.filter(s => s.key === filterKey.value);
  }

  if (sortMode && sortMode.value === 'key') {
    list.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  list.forEach(song => {
    songList.innerHTML += `
      <li>
        <div>
          <strong>${song.name}</strong><br>
          <small>${song.key}</small>
        </div>
        <div>
          <button onclick="addToSetlistById('${song.id}')">➕</button>
          <button onclick="editSongById('${song.id}')">✏️</button>
          <button onclick="deleteSongById('${song.id}')">❌</button>
        </div>
      </li>`;
  });
}

// ===============================
// SETLIST
// ===============================
function renderSetlist() {
  setlist.innerHTML = '';
  currentSetlist.forEach((s, i) => {
    setlist.innerHTML += `
      <li>
        <div>
          <strong>${s.name}</strong><br>
          <small>${s.key}</small>
        </div>
        <div>
          <button onclick="moveUp(${i})">⬆️</button>
          <button onclick="moveDown(${i})">⬇️</button>
          <button onclick="removeFromSetlist(${i})">❌</button>
        </div>
      </li>`;
  });
}

// ===============================
// HISTORIAL
// ===============================
function renderHistory() {
  historyList.innerHTML = '';
  history.forEach((h, i) => {
    historyList.innerHTML += `
      <li>
        <strong>${h.date}</strong><br>
        <small>${h.songs.map(s => s.name).join(', ')}</small><br>
        <button onclick="loadHistory(${i})">↩</button>
        <button onclick="deleteHistoryItem(${i})">🗑</button>
      </li>`;
  });
}

// ===============================
// SONGS
// ===============================
function addSong() {
  const name = songNameInput.value.trim();
  const key = songKeyInput.value.trim();
  if (!name || !key) return alert('Completá los campos');

  if (songs.some(s => s.name.toLowerCase() === name.toLowerCase()))
    return alert('La canción ya existe');

  songs.push({ id: crypto.randomUUID(), name, key, lyrics: '' });
  saveSongs();
  renderSongs();
  songNameInput.value = songKeyInput.value = '';
}

function deleteSongById(id) {
  songs = songs.filter(s => s.id !== id);
  saveSongs();
  renderSongs();
}

// ===============================
// EDITAR
// ===============================
function editSongById(id) {
  const song = songs.find(s => s.id === id);
  editingSongId = id;
  editorName.value = song.name;
  editorKeyInput.value = song.key;
  editorLyrics.value = song.lyrics || '';
  songEditor.classList.remove('hidden');
}

function saveSongEdits() {
  const song = songs.find(s => s.id === editingSongId);
  song.name = editorName.value.trim();
  song.key = editorKeyInput.value.trim();
  song.lyrics = editorLyrics.value;
  saveSongs();
  renderSongs();
  closeSongEditor();
}

function closeSongEditor() {
  songEditor.classList.add('hidden');
  editingSongId = null;
}

// ===============================
// SETLIST OPS
// ===============================
function addToSetlistById(id) {
  if (currentSetlist.some(s => s.id === id)) return;
  currentSetlist.push(songs.find(s => s.id === id));
  renderSetlist();
}

const moveUp = i => {
  if (!i) return;
  [currentSetlist[i - 1], currentSetlist[i]] =
    [currentSetlist[i], currentSetlist[i - 1]];
  renderSetlist();
};

const moveDown = i => {
  if (i === currentSetlist.length - 1) return;
  [currentSetlist[i + 1], currentSetlist[i]] =
    [currentSetlist[i], currentSetlist[i + 1]];
  renderSetlist();
};

const removeFromSetlist = i => {
  currentSetlist.splice(i, 1);
  renderSetlist();
};

// ===============================
// GUARDAR SETLIST
// ===============================
function saveSetlist() {
  if (!currentSetlist.length) return;
  history.push({ date: setlistDateInput.value, songs: [...currentSetlist] });
  saveHistory();
  currentSetlist = [];
  renderSetlist();
  renderHistory();
}

// ===============================
// HISTORIAL OPS
// ===============================
function loadHistory(i) {
  currentSetlist = [...history[i].songs];
  renderSetlist();
}

function deleteHistoryItem(i) {
  if (!confirm('¿Borrar este setlist?')) return;
  history.splice(i, 1);
  saveHistory();
  renderHistory();
}

// ===============================
// COPIAR
// ===============================
function copySetlist() {
  if (!currentSetlist.length) return;
  const text = currentSetlist
    .map((s, i) => `${i + 1}. ${s.name} (${s.key})`)
    .join('\n');
  navigator.clipboard.writeText(text);
  alert('Setlist copiado');
}

function copySetlistWhatsApp() {
  if (!currentSetlist.length) return;
  const text = currentSetlist
    .map((s, i) => `${i + 1}. ${s.name} (${s.key})`)
    .join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

// ===============================
// MODO CANTO
// ===============================
function enterStageMode() {
  if (!currentSetlist.length) return;
  stageMode.classList.remove('hidden');
  stageSetlist.innerHTML = '';
  currentSetlist.forEach(song => {
    const li = document.createElement('li');
    li.textContent = `${song.name} – ${song.key}`;
    li.onclick = () => openLyrics(song);
    stageSetlist.appendChild(li);
  });
}

function exitStageMode() {
  stageMode.classList.add('hidden');
  lyricsView.classList.add('hidden');
}

function openLyrics(song) {
  stageMode.classList.add('hidden');
  lyricsView.classList.remove('hidden');
  lyricsTitle.textContent = song.name;
  lyricsKey.textContent = `Tonalidad: ${song.key}`;
  lyricsContent.textContent = song.lyrics || 'Sin letra';
}

function backToStage() {
  lyricsView.classList.add('hidden');
  stageMode.classList.remove('hidden');
}