let songs = JSON.parse(localStorage.getItem('songs')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let currentSetlist = [];
let editingSongId = null;

// DOM
const songList = document.getElementById('songList');
const setlist = document.getElementById('setlist');
const historyList = document.getElementById('historyList');
const songNameInput = document.getElementById('songName');
const songKeyInput = document.getElementById('songKey');
const searchSongInput = document.getElementById('searchSong');
const sortMode = document.getElementById('sortMode');
const filterKey = document.getElementById('filterKey');
const setlistDateInput = document.getElementById('setlistDate');

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

// INIT
setlistDateInput.value = new Date().toISOString().split('T')[0];
renderSongs();
renderHistory();
searchSongInput.addEventListener('input', renderSongs);

// STORAGE
const saveSongs = () => localStorage.setItem('songs', JSON.stringify(songs));
const saveHistory = () => localStorage.setItem('history', JSON.stringify(history));

// TOAST
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// SONGS
function addSong() {
  const name = songNameInput.value.trim();
  const key = songKeyInput.value.trim();

  if (!name || !key) {
    showToast('Completá los campos', 'error');
    return;
  }

  if (songs.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('La canción ya existe', 'error');
    return;
  }

  songs.push({ id: crypto.randomUUID(), name, key, lyrics: '' });
  saveSongs();
  renderSongs();
  songNameInput.value = songKeyInput.value = '';
  showToast('Canción agregada', 'success');
}

function renderSongs() {
  songList.innerHTML = '';

  let list = songs.filter(s =>
    s.name.toLowerCase().includes(searchSongInput.value.toLowerCase())
  );

  if (filterKey.value) list = list.filter(s => s.key === filterKey.value);

  list.sort(sortMode.value === 'key'
    ? (a, b) => a.key.localeCompare(b.key)
    : (a, b) => a.name.localeCompare(b.name)
  );

  list.forEach(song => {
    songList.innerHTML += `
      <li>
        <div>
          <strong>${song.name}</strong><br>
          <small>${song.key}</small>
        </div>
        <div>
          <button onclick="addToSetlist('${song.id}')">➕</button>
          <button onclick="editSong('${song.id}')">✏️</button>
          <button onclick="deleteSong('${song.id}')">❌</button>
        </div>
      </li>`;
  });
}

function deleteSong(id) {
  songs = songs.filter(s => s.id !== id);
  saveSongs();
  renderSongs();
  showToast('Canción eliminada', 'info');
}

// EDIT
function editSong(id) {
  const s = songs.find(x => x.id === id);
  editingSongId = id;
  editorName.value = s.name;
  editorKeyInput.value = s.key;
  editorLyrics.value = s.lyrics;
  songEditor.classList.remove('hidden');
}

function saveSongEdits() {
  const s = songs.find(x => x.id === editingSongId);
  s.name = editorName.value;
  s.key = editorKeyInput.value;
  s.lyrics = editorLyrics.value;
  saveSongs();
  renderSongs();
  closeSongEditor();
  showToast('Cambios guardados', 'success');
}

function closeSongEditor() {
  songEditor.classList.add('hidden');
  editingSongId = null;
}

// SETLIST
function addToSetlist(id) {
  const song = songs.find(s => s.id === id);
  if (currentSetlist.includes(song)) return;
  currentSetlist.push(song);
  renderSetlist();
}

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

function moveUp(i) {
  if (i === 0) return;
  [currentSetlist[i - 1], currentSetlist[i]] =
  [currentSetlist[i], currentSetlist[i - 1]];
  renderSetlist();
}

function moveDown(i) {
  if (i === currentSetlist.length - 1) return;
  [currentSetlist[i + 1], currentSetlist[i]] =
  [currentSetlist[i], currentSetlist[i + 1]];
  renderSetlist();
}

function removeFromSetlist(i) {
  currentSetlist.splice(i, 1);
  renderSetlist();
}

// HISTORIAL
function saveSetlist() {
  if (!currentSetlist.length) return;
  history.push({ date: setlistDateInput.value, songs: [...currentSetlist] });
  saveHistory();
  currentSetlist = [];
  renderSetlist();
  renderHistory();
  showToast('Setlist guardado', 'success');
}

function renderHistory() {
  historyList.innerHTML = '';
  history.forEach((h, i) => {
    historyList.innerHTML += `
      <li>
        <div>
          <strong>${h.date}</strong><br>
          <small>${h.songs.map(s => s.name).join(', ')}</small>
        </div>
        <div>
          <button onclick="loadHistory(${i})">↩</button>
          <button onclick="deleteHistory(${i})">🗑</button>
        </div>
      </li>`;
  });
}

function loadHistory(i) {
  currentSetlist = [...history[i].songs];
  renderSetlist();
  showToast('Setlist cargado', 'info');
}

function deleteHistory(i) {
  history.splice(i, 1);
  saveHistory();
  renderHistory();
}

// MODO CANTO
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

/* ✅ COPIAR */
function copySetlist() {
  if (!currentSetlist.length) {
    showToast('El setlist está vacío', 'error');
    return;
  }

  const text = currentSetlist
    .map((s, i) => `${i + 1}. ${s.name} (${s.key})`)
    .join('\n');

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Setlist copiado', 'success'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showToast('Setlist copiado', 'success');
}

/* ✅ WHATSAPP */
function copySetlistWhatsApp() {
  if (!currentSetlist.length) {
    showToast('El setlist está vacío', 'error');
    return;
  }

  const text = currentSetlist
    .map((s, i) => `${i + 1}. ${s.name} (${s.key})`)
    .join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}