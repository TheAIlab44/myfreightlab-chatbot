  // === ChatBot MyFreightLab avec historique, prompts, sidebar, multi-PJ et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const user_id    = new URLSearchParams(location.search).get("user_id");

  // — Session utilities
  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  }
  function saveSessionID() {
    if (!localStorage.getItem("chat_id")) {
      localStorage.setItem("chat_id", generateSessionID());
    }
  }
  function loadSessionID() {
    let id = localStorage.getItem("chat_id");
    if (!id) {
      id = generateSessionID();
      localStorage.setItem("chat_id", id);
    }
    return id;
  }
  saveSessionID();
  let chat_id = loadSessionID();

  // — Build UI
const wrapper = document.createElement("div");
wrapper.id = "chat-wrapper";
wrapper.innerHTML = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    * { font-family: 'Inter', sans-serif; }

    html, body {
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    #chat-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      height: 90vh;
      width: 80vw;
      margin: 5vh auto;
      background: #f9fbfc;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #d3dce6;
      position: relative;
    }

    #chat {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
      height: calc(90vh - 100px);
    }

    .message {
      padding: 14px 18px;
      border-radius: 18px;
      max-width: 80%;
      font-size: 15px;
      line-height: 1.6;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      animation: fadeInUp 0.4s ease-out;
    }

    .user-message {
      align-self: flex-start;
      background: #e6f0ff;
      color: #003366;
      border-bottom-right-radius: 0;
    }

    .bot-message {
      align-self: flex-end;
      background: #fff;
      color: #222;
      border-bottom-left-radius: 0;
    }

    /* on rend input-area relatif pour le file-preview absolu */
    #input-area {
      position: relative;
      display: flex;
      padding: 12px 16px;
      border-top: 1px solid #ccc;
      gap: 8px; /* espacement réduit pour accueillir 3 boutons */
      background: white;
      align-items: center;
    }

    #userInput {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
      outline: none;
      font-size: 15px;
      overflow-y: hidden;
      resize: none;
    }

    /* === Bouton “Envoyer” personnalisé === */
/* === Bouton “Envoyer” personnalisé (taille réduite à 40×40) === */
#sendBtn {
  background: linear-gradient(135deg, #005a9c 0%, #0077c8 100%);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
#sendBtn::before {
  content: "▶";
  color: white;
  font-size: 14px;       /* diminué pour rester centré dans 40×40 */
  transform: translateX(1px);
}
#sendBtn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
#sendBtn:active {
  transform: scale(0.98);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

    /* === Bouton “Stop” (interruption) === */
    #stopBtn {
      background: #d3d3d3;           /* gris clair */
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: not-allowed;           /* désactivé par défaut */
      color: #666;
      font-size: 18px;
      opacity: 0.6;
      transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
    }
    #stopBtn.enabled {
      background: #FF953D;          
      color: white;
      cursor: pointer;
      opacity: 1;
    }
    #stopBtn.enabled:hover {
      background: #CC7731;          /* rouge plus foncé */
    }
    #stopBtn.enabled:active {
      transform: scale(0.95);
    }

    /* === Bouton “Nouveau chat” (resetBtn) : style d’origine === */
    #resetBtn {
      position: absolute;
      top: 10px;
      left: 10px;
      background: white;
      border: 1px solid #ccc;
      padding: 4px 8px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      transition: background 0.1s ease, color 0.1s ease, box-shadow 0.1s ease;
    }
    #resetBtn:hover {
      background: #f0f0f0;
    }

    /* === Bouton “➕” (ajout de fichier) personnalisé === */
    #attachBtn {
      background: #0077c8;
      border: none;
      color: white;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      font-size: 20px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border 0.15s ease;
    }
    #attachBtn:hover {
      background: white;
      color: #0077c8;
      border: 2px solid #0077c8;
    }
    #attachBtn:active {
      transform: scale(0.95);
    }

    /* dropZone */
    #drop-zone {
      border: 2px dashed #ccc;
      padding: 40px;
      text-align: center;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.95);
      display: none;
      z-index: 10000;
    }

    /* preview mini icônes (au-dessus de l’input-area) */
    #file-preview {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 16px;
      display: flex;
      gap: 8px;
      z-index: 20;
    }
    /* chaque icône agrandie */
    #file-preview .file-item {
      width: 56px;
      height: 56px;
      background: #fff;
      border: 1px solid #d3dce6;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: transform 0.1s ease;
    }
    #file-preview .file-item:hover {
      transform: scale(1.03);
    }
    /* image */
    #file-preview .file-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* icône d’extension */
    #file-preview .file-item .file-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #666;
      background: #f0f0f0;
    }
    /* bouton “×” pour supprimer */
    #file-preview .file-clear {
      margin-left: 8px;
      font-weight: bold;
      font-size: 18px;
      color: #c00;
      cursor: pointer;
    }
    #file-preview .file-clear:hover {
      color: #800;
    }

    /* sidebars et prompts */
    .dynamic-sidebar {
      position: fixed; top: 0; right: -320px;
      width: 320px; height: 100vh;
      background: #fff; border-left: 1px solid #ddd;
      box-shadow: -2px 0 6px rgba(0,0,0,0.05);
      transition: right 0.3s ease-in-out; z-index: 9999;
      overflow-y: auto;
    }
    .dynamic-sidebar.open { right: 0; }
    .sidebar-header {
      padding: 16px; background: #0077c8; color: white;
      font-weight: bold; font-size: 16px;
    }
    .sidebar-content { padding: 10px; }
    .prompt {
      padding: 10px; background: #f0f0f0;
      border-radius: 6px; margin-bottom: 8px;
      cursor: grab; font-size: 14px;
    }
    details summary { font-weight: 600; cursor: pointer; }
    .floating-toggle {
      position: fixed; top: 50%; right: 0;
      transform: translateY(-50%);
      background-color: #0077c8; color: white;
      padding: 10px; border-radius: 8px 0 0 8px;
      cursor: pointer; font-size: 20px; z-index: 99999;
    }
    #toggleHistory { top: 40%; }
  </style>

  <button id="resetBtn">✨ Nouveau chat</button>
  <div id="chat"></div>
  <div id="input-area">

    <!-- Bouton “+” pour ouvrir la boîte de sélection de fichiers -->
    <button id="attachBtn" title="Ajouter des pièces jointes">＋</button>

    <!-- Champ file input masqué -->
    <input type="file" id="fileInput" multiple style="display: none;" />

    <textarea id="userInput" placeholder="Pose ta question ici…" rows="1"></textarea>

    <!-- Bouton “Stop” -->
    <button id="stopBtn" disabled>■</button>

    <!-- Bouton “Envoyer” -->
    <button id="sendBtn"></button>
    <div id="file-preview"></div>
  </div>
  <div id="drop-zone">📂 Déposez vos fichiers…</div>

  <div class="floating-toggle" id="toggleHistory">🕓</div>
  <div class="dynamic-sidebar" id="historyPanel">
    <div class="sidebar-header">🕓 Historique des conversations</div>
    <div class="sidebar-content" id="historyList"></div>
  </div>
  <div class="floating-toggle" id="togglePrompt">💡</div>
  <div class="dynamic-sidebar" id="promptPanel">
    <div class="sidebar-header">💡 Idées de prompts</div>
    <div class="sidebar-content"><!-- vos <details> ici --></div>
  </div>
`;

 document.getElementById("chat-container").appendChild(wrapper);

// — Key elements
const chat         = wrapper.querySelector("#chat");
const inputArea    = wrapper.querySelector("#input-area");
const userInput    = wrapper.querySelector("#userInput");
const sendBtn      = wrapper.querySelector("#sendBtn");
const stopBtn      = wrapper.querySelector("#stopBtn");
let currentController = null;
const resetBtn     = wrapper.querySelector("#resetBtn");
const dropZone     = wrapper.querySelector("#drop-zone");
const toggleHistory= wrapper.querySelector("#toggleHistory");
const historyPanel = wrapper.querySelector("#historyPanel");
const historyList  = wrapper.querySelector("#historyList");
const togglePrompt = wrapper.querySelector("#togglePrompt");
const promptPanel  = wrapper.querySelector("#promptPanel");
const prompts      = wrapper.querySelectorAll(".prompt");

// — Fonction pour (dé)bloquer le bouton Stop
function setStopEnabled(enabled) {
  if (enabled) {
    stopBtn.disabled = false;
    stopBtn.classList.add("enabled");
    stopBtn.style.cursor = "pointer";
  } else {
    stopBtn.disabled = true;
    stopBtn.classList.remove("enabled");
    stopBtn.style.cursor = "not-allowed";
  }
}

// — Lorsque l’on clique sur Stop, on annule la requête en cours
stopBtn.addEventListener("click", () => {
  if (currentController) {
    currentController.abort();
    setStopEnabled(false);
  }
});

// --- HISTORIQUE DE CONVERSATION ---
// (reste inchangé)
async function fetchUserMessages(userId) {
  try {
    const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    if (!res.ok) throw new Error("Erreur fetch messages");
    return await res.json();
  } catch (err) {
    console.error("fetchUserMessages :", err);
    return [];
  }
}

function getLastSessions(messages) {
  const map = new Map();
  messages.forEach(m => {
    if (!map.has(m.session_id) || m.id > map.get(m.session_id).id) {
      map.set(m.session_id, m);
    }
  });
  return Array.from(map.values())
    .sort((a, b) => b.id - a.id);
}

function getSessionTitles() {
  return JSON.parse(localStorage.getItem("sessionTitles") || "{}");
}
function saveSessionTitles(titles) {
  localStorage.setItem("sessionTitles", JSON.stringify(titles));
}

async function loadHistory() {
  const all    = await fetchUserMessages(user_id);
  const lasts  = getLastSessions(all);
  const titles = getSessionTitles();

  // 1) Génération de titres par défaut si nécessaire
  lasts.forEach(({ session_id, message }) => {
    if (!(session_id in titles)) {
      const parsed = typeof message === "string" ? JSON.parse(message) : message;
      const tmp    = document.createElement("div");
      tmp.innerHTML = parsed.content || "";
      const txt = (tmp.textContent || "").slice(0, 30);
      titles[session_id] = txt + (txt.length === 30 ? "…" : "");
    }
  });
  saveSessionTitles(titles);

  // 2) Vider la liste avant rendu
  historyList.innerHTML = "";

  // 3) Pour chaque session, créer une ligne avec titre + menu
  lasts.forEach(({ session_id }) => {
    // Conteneur flex
    const entry = document.createElement("div");
    entry.className = "prompt";
    entry.dataset.id = session_id;
    Object.assign(entry.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
      padding: "8px"
    });

    // a) Titre cliquable
    const label = document.createElement("span");
    label.textContent = titles[session_id];
    Object.assign(label.style, {
      flex: "1",
      cursor: "pointer"
    });
    entry.appendChild(label);

    // b) Bouton “⋮”
    const menuBtn = document.createElement("span");
    menuBtn.textContent = "⋮";
    Object.assign(menuBtn.style, {
      cursor: "pointer",
      padding: "0 8px",
      userSelect: "none"
    });
    entry.appendChild(menuBtn);

    // c) Menu caché
    const menu = document.createElement("div");
    menu.className = "context-menu";
    Object.assign(menu.style, {
      position: "absolute",
      top: "100%",
      right: "0",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "6px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      display: "none",
      zIndex: "999"
    });

    // Option Renommer
    const renameOption = document.createElement("div");
    renameOption.textContent = "Renommer";
    Object.assign(renameOption.style, { padding: "8px", cursor: "pointer" });
    renameOption.addEventListener("click", () => {
      const newName = prompt("Nouveau titre :", label.textContent);
      if (newName) {
        label.textContent = newName;
        titles[session_id] = newName;
        saveSessionTitles(titles);
      }
      menu.style.display = "none";
    });
    menu.appendChild(renameOption);

    // Option Supprimer
    const deleteOption = document.createElement("div");
    deleteOption.textContent = "Supprimer";
    Object.assign(deleteOption.style, { padding: "8px", cursor: "pointer" });
    deleteOption.addEventListener("click", () => {
      delete titles[session_id];
      saveSessionTitles(titles);
      historyList.removeChild(entry);
    });
    menu.appendChild(deleteOption);

    entry.appendChild(menu);

    // 4) Événements
    // a) Clic sur le titre → charger la session
    label.addEventListener("click", async () => {
      localStorage.setItem("chat_id", session_id);
      chat.innerHTML = "";
      (await fetchUserMessages(user_id))
        .filter(m => m.session_id === session_id)
        .forEach(m => {
          const js = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
          const d  = document.createElement("div");
          d.className = `message ${js.type === "human" ? "user-message" : "bot-message"}`;
          d.innerHTML = js.content;
          chat.appendChild(d);
        });
      chat.scrollTop = 0;
      historyPanel.classList.remove("open");
    });

    // b) Toggle menu
    menuBtn.addEventListener("click", e => {
      e.stopPropagation();
      document.querySelectorAll(".context-menu").forEach(m => m.style.display = "none");
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    // c) Clic en dehors → fermer
    document.addEventListener("click", () => menu.style.display = "none");

    // 5) Ajout dans la sidebar
    historyList.appendChild(entry);
  });
}



resetBtn.addEventListener("click", () => {
  localStorage.removeItem("chat_id");
  localStorage.removeItem("chatHistory");
  saveSessionID();
  chat_id = loadSessionID();
  chat.innerHTML = "";
  appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
  loadHistory();
});

// — Ajuster la hauteur du textarea en fonction des sauts de ligne
function adjustTextareaHeight() {
  const lines = userInput.value.split("\n").length;
  userInput.rows = lines < 1 ? 1 : lines;
}
userInput.addEventListener("input", adjustTextareaHeight);

// 6) Lancer au démarrage
loadHistory();

// — File preview container INSIDE input-area
let pendingFiles = [];
const filePreview = document.createElement("div");
filePreview.id = "file-preview";
filePreview.style.display = "none";
inputArea.appendChild(filePreview);

  // — Récupérer le bouton “+” et le input type="file"
const attachBtn = wrapper.querySelector("#attachBtn");
const fileInput = wrapper.querySelector("#fileInput");

// — Ouvrir le sélecteur de fichiers au clic sur “+”
attachBtn.addEventListener("click", () => {
  fileInput.click();
});

// — Lorsqu’on choisit un ou plusieurs fichiers dans le sélecteur…
fileInput.addEventListener("change", e => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  // Ajouter les fichiers à pendingFiles
  pendingFiles.push(...files);

  // Afficher le preview (vider l’ancien si nécessaire)
  filePreview.innerHTML = "";
  filePreview.style.display = "flex";

  files.forEach(file => {
    const item = document.createElement("div");
    item.className = "file-item";

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);
      file._objectUrl = objectUrl;
      img.src = objectUrl;
      img.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
      item.appendChild(img);
    } else {
      const ico = document.createElement("div");
      ico.className = "file-icon";
      ico.textContent = file.name.split(".").pop().toUpperCase();
      item.appendChild(ico);
    }

    filePreview.appendChild(item);
  });

  // Si le bouton “×” n’est pas encore présent, l’ajouter
  if (!filePreview.querySelector(".file-clear")) {
    const clearBtn = document.createElement("div");
    clearBtn.className = "file-clear";
    clearBtn.textContent = "×";
    clearBtn.title = "Tout supprimer";
    clearBtn.style.cursor = "pointer";
    clearBtn.onclick = () => {
      pendingFiles.forEach(f => {
        if (f._objectUrl) {
          URL.revokeObjectURL(f._objectUrl);
          delete f._objectUrl;
        }
      });
      pendingFiles = [];
      filePreview.innerHTML = "";
      filePreview.style.display = "none";
    };
    filePreview.appendChild(clearBtn);
  }

  // Réinitialiser fileInput pour pouvoir re-sélectionner les mêmes fichiers
  fileInput.value = "";
});

// — sidebar toggles & prompts
toggleHistory.addEventListener("click", () => historyPanel.classList.toggle("open"));
togglePrompt .addEventListener("click", () => promptPanel.classList.toggle("open"));
prompts.forEach(p => p.addEventListener("click", () => {
  userInput.value = p.textContent;
  promptPanel.classList.remove("open");
  userInput.focus();
}));

// — Drag & Drop visual (éviter le “clignotement”)
let dragCounter = 0;
["dragenter", "dragover"].forEach(evt =>
  document.addEventListener(evt, e => {
    e.preventDefault();
    dragCounter++;
    dropZone.style.display = "block";
    dropZone.style.opacity = "1";
  })
);
["dragleave"].forEach(evt =>
  document.addEventListener(evt, e => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.style.opacity = "0";
      setTimeout(() => (dropZone.style.display = "none"), 300);
    }
  })
);
document.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.style.opacity = "0";
  setTimeout(() => (dropZone.style.display = "none"), 300);
});

// — Handle file drop with miniatures + bouton “fermer”
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.style.opacity = "0";
  setTimeout(() => (dropZone.style.display = "none"), 300);

  const files = Array.from(e.dataTransfer.files);
  pendingFiles.push(...files);

  filePreview.innerHTML = "";
  filePreview.style.display = "flex";

  files.forEach(file => {
    const item = document.createElement("div");
    item.className = "file-item";

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);
      file._objectUrl = objectUrl;
      img.src = objectUrl;
      img.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
      item.appendChild(img);
    } else {
      const ico = document.createElement("div");
      ico.className = "file-icon";
      ico.textContent = file.name.split(".").pop().toUpperCase();
      item.appendChild(ico);
    }

    filePreview.appendChild(item);
  });

  const clearBtn = document.createElement("div");
  clearBtn.className = "file-clear";
  clearBtn.textContent = "×";
  clearBtn.title = "Tout supprimer";
  clearBtn.style.cursor = "pointer";
  clearBtn.onclick = () => {
    pendingFiles.forEach(f => {
      if (f._objectUrl) {
        URL.revokeObjectURL(f._objectUrl);
        delete f._objectUrl;
      }
    });
    pendingFiles = [];
    filePreview.innerHTML = "";
    filePreview.style.display = "none";
  };
  filePreview.appendChild(clearBtn);

  console.log("📝 pendingFiles:", pendingFiles);
});

// — Append & save locally
function appendMessage(html, cls) {
  const m = document.createElement("div");
  m.className = `message ${cls}`;
  m.innerHTML = html;
  const prev = chat.scrollHeight;
  chat.appendChild(m);
  chat.scrollTop = prev === 0
    ? chat.scrollHeight
    : chat.scrollTop + (chat.scrollHeight - prev);
  saveLocal();
}
function saveLocal() {
  const arr = Array.from(chat.querySelectorAll(".message")).map(d => ({
    role: d.classList.contains("user-message") ? "user" : "bot",
    content: d.innerHTML
  }));
  localStorage.setItem("chatHistory", JSON.stringify(arr));
}

sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();
  // rien à envoyer ?
  if (!text && pendingFiles.length === 0) return;

  // 1) On affiche le message texte
  if (text) appendMessage(text, "user-message");

// — On affiche une bulle séparée pour chaque PJ —
if (pendingFiles.length > 0) {
  // on cache tout de suite la prévisualisation
  filePreview.innerHTML = "";
  filePreview.style.display = "none";

  pendingFiles.forEach(f => {
    const fileMsg = document.createElement("div");
    fileMsg.className = "message user-message";
    fileMsg.style.display = "flex";
    fileMsg.style.alignItems = "center";
    fileMsg.style.gap = "8px";

    // miniature ou icône
    if (f.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = f._objectUrl;
      img.style.width = img.style.height = "24px";
      img.style.objectFit = "cover";
      fileMsg.appendChild(img);
    } else {
      const ico = document.createElement("span");
      ico.textContent = "📎";
      fileMsg.appendChild(ico);
    }

    // nom du fichier
    const name = document.createElement("span");
    name.textContent = f.name;
    fileMsg.appendChild(name);

    chat.appendChild(fileMsg);
  });

  chat.scrollTop = chat.scrollHeight;
}

  // 4) Reset de l’input
  userInput.value = "";
  userInput.rows  = 1;
  userInput.focus();

  // 5) AbortController + envoi
  currentController = new AbortController();
  const { signal } = currentController;
  setStopEnabled(true);

  try {
    let res, data;
    if (pendingFiles.length > 0) {
      // formData avec **toutes** les PJ
      const fd = new FormData();
      pendingFiles.forEach(f => fd.append("files", f, f.name));
      fd.append("question", text);
      fd.append("user_id",   user_id);
      fd.append("chat_id",   chat_id);
      fd.append("type",      text ? "filesWithText" : "files");

      res  = await fetch(webhookURL, { method: "POST", body: fd, signal });
      data = await res.json();
    } else {
      // envoi texte seulement
      res  = await fetch(webhookURL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: text, user_id, chat_id, type: "text" }),
        signal
      });
      data = await res.json();
    }

    // 6) On nettoie les objectURLs et le tableau
    pendingFiles.forEach(f => f._objectUrl && URL.revokeObjectURL(f._objectUrl));
    pendingFiles = [];

    // 7) On retire le loader et on affiche la réponse
    loader.remove();
    appendMessage(data.output || "Pas de réponse", "bot-message");
    loadHistory();

  } catch (err) {
    loader.remove();
    if (err.name === "AbortError") {
      appendMessage("⚠️ Requête interrompue.", "bot-message");
    } else {
      appendMessage("❌ Erreur de connexion", "bot-message");
      console.error(err);
    }
  } finally {
    setStopEnabled(false);
    currentController = null;
    userInput.focus();
  }
});

// — Enter vs Shift+Enter
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// — Init
JSON.parse(localStorage.getItem("chatHistory") || "[]")
  .forEach(m => appendMessage(m.content, m.role === "user" ? "user-message" : "bot-message"));
chat.scrollTop = 0;
});

