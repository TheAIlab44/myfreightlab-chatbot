// === ChatBot MyFreightLab avec historique, prompts, sidebar fermable, et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  console.log("🧩 user_id récupéré :", user_id);
  savesessionIDtolocalStorage();
  let chat_id = loadsessionIDfromlocalstorage();

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
      justify-content: flex-start; /* ← passe de flex-end à flex-start */
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
      height: calc(90vh - 100px); /* ← limite la hauteur pour que seul le chat scroll */
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

    #input-area {
      display: flex;
      padding: 12px 16px;
      border-top: 1px solid #ccc;
      gap: 10px;
      background: white;
    }

    #userInput {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
      outline: none;
      font-size: 15px;
    }

    #sendBtn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: #0077c8;
      color: white;
      cursor: pointer;
    }

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
    }

    .dynamic-sidebar {
      position: fixed;
      top: 0;
      right: -320px;
      width: 320px;
      height: 100vh;
      background: #fff;
      border-left: 1px solid #ddd;
      box-shadow: -2px 0 6px rgba(0,0,0,0.05);
      transition: right 0.3s ease-in-out;
      z-index: 9999;
      overflow-y: auto;
    }

    .dynamic-sidebar.open {
      right: 0;
    }

    .sidebar-header {
      padding: 16px;
      background: #0077c8;
      color: white;
      font-weight: bold;
      font-size: 16px;
    }

    .sidebar-content {
      padding: 10px;
    }

    .prompt {
      padding: 10px;
      background: #f0f0f0;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: grab;
      font-size: 14px;
    }

    details summary {
      font-weight: 600;
      cursor: pointer;
      list-style: none;
      padding: 10px 0;
    }

    .floating-toggle {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background-color: #0077c8;
      color: white;
      padding: 10px;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      font-size: 20px;
      z-index: 99999;
    }

    #toggleHistory {
      top: 40%;
    }

    /* aperçu des pièces jointes */
    #file-preview {
      display: none;
      align-self: flex-start;
      max-width: 80%;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 14px;
    }
  </style>

  <button id="resetBtn">✨ Nouveau chat</button>
  <div id="chat"></div>
  <div id="input-area">
    <textarea id="userInput" placeholder="Pose ta question ici…" rows="2" style="resize: none; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 15px; flex: 1; overflow-y: auto;"></textarea>
    <button id="sendBtn">▶</button>
  </div>

  <div class="floating-toggle" id="toggleHistory">🕓</div>
  <div class="dynamic-sidebar" id="historyPanel">
    <div class="sidebar-header">🕓 Historique des conversations</div>
    <div class="sidebar-content" id="historyList"></div>
  </div>

  <div class="floating-toggle" id="togglePrompt">💡</div>
  <div class="dynamic-sidebar" id="promptPanel">
    <div class="sidebar-header">💡 Idées de prompts</div>
    <div class="sidebar-content">
      <!-- … vos <details> de prompts … -->
    </div>
  </div>
`;
// → récupérer la zone de chat pour y injecter les messages
// → récupérer la zone de chat pour y injecter les messages
const chat = wrapper.querySelector("#chat");

// → monter le wrapper dans la page
const container = document.getElementById("chat-container");
if (!container) return;
container.appendChild(wrapper);

// → créer la dropZone
const dropZone = document.createElement("div");
dropZone.id = "drop-zone";
dropZone.style.cssText = `
  border: 2px dashed #ccc;
  padding: 40px;
  text-align: center;
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  font-size: 18px;
  z-index: 10000;
  transition: opacity 0.3s ease;
  pointer-events: all;
`;
dropZone.innerText = "📂 Déposez votre fichier ici";
document.body.appendChild(dropZone);

// → préparer la PJ en attente et son aperçu (UNE SEULE FOIS)
let pendingFile = null;
const userInput = wrapper.querySelector("#userInput");

const filePreview = document.createElement("div");
filePreview.id = "file-preview";
Object.assign(filePreview.style, {
  display: "none",
  alignSelf: "flex-start",
  maxWidth: "80%",
  padding: "8px",
  background: "#f0f0f0",
  borderRadius: "6px",
  marginBottom: "8px",
  fontSize: "14px",
});

// insérer l’aperçu juste au-dessus du textarea
userInput.before(filePreview);

// → récupérer tous les autres éléments une seule fois
const sendBtn = wrapper.querySelector("#sendBtn");
const resetBtn = wrapper.querySelector("#resetBtn");
const togglePromptBtn = wrapper.querySelector("#togglePrompt");
const toggleHistoryBtn = wrapper.querySelector("#toggleHistory");
const promptPanel = wrapper.querySelector("#promptPanel");
const historyPanel = wrapper.querySelector("#historyPanel");
const historyList = wrapper.querySelector("#historyList");
const sidebar = promptPanel;
const prompts = wrapper.querySelectorAll(".prompt");

// → listeners des toggles et des prompts
togglePromptBtn.addEventListener("click", () => promptPanel.classList.toggle("open"));
toggleHistoryBtn.addEventListener("click", () => historyPanel.classList.toggle("open"));
prompts.forEach(p => p.addEventListener("click", () => {
  userInput.value = p.textContent;
  userInput.focus();
  sidebar.classList.remove("open");
}));

// → drag & drop texte (pour copier un prompt dans le textarea)
userInput.addEventListener("dragover", e => e.preventDefault());
userInput.addEventListener("drop", e => {
  e.preventDefault();
  userInput.value = e.dataTransfer.getData("text");
  sidebar.classList.remove("open");
});

// … suite de votre code (fetchUserMessages, etc.) …


  async function fetchUserMessages(userId) {
    try {
      const response = await fetch("https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if (!response.ok) throw new Error("Erreur lors de la requête");
      return await response.json();
    } catch (error) {
      console.error("Erreur :", error);
      return [];
    }
  }

  function getLastMessages(messages) {
    const map = new Map();
    console.log('COUCOU', messages)
    messages.forEach(msg => {
      if (!map.has(msg.session_id) || msg.id > map.get(msg.session_id).id) {
        map.set(msg.session_id, msg);
      }
    });
    console.log('map', map)
    return Array.from(map.values())
      .sort((a, b) => b.id - a.id)
      .map(m => {
        const parsed = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
        console.log(parsed)
        const tmp = document.createElement("div");
        tmp.innerHTML = parsed.content || '';
        const textOnly = tmp.textContent || tmp.innerText || "";
        const clean = textOnly.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");
        return {
          session_id: m.session_id,
          preview: clean.substring(0, 30) + (clean.length > 30 ? '...' : '')
        };
      });
  }

  // --- Gestion des titres persistants dans localStorage ---
function getSessionTitles() {
  return JSON.parse(localStorage.getItem("sessionTitles") || "{}");
}

function saveSessionTitles(titles) {
  localStorage.setItem("sessionTitles", JSON.stringify(titles));
}

// --- Chargement de l’historique avec titres persistants et menu complet ---
async function loadChatHistory() {
  try {
    const data = await fetchUserMessages(user_id);
    const previews = getLastMessages(data);
    const titles = getSessionTitles();
    // Pour chaque session non encore renommée, on stocke la preview initiale
previews.forEach(({ session_id, preview }) => {
  if (!Object.prototype.hasOwnProperty.call(titles, session_id)) {
    titles[session_id] = preview;
  }
});
// On persiste ce mapping mis à jour
saveSessionTitles(titles);

    historyList.innerHTML = "";

    previews.forEach(({ session_id, preview }) => {
      const sessionMessages = data.filter(m => m.session_id === session_id);

      // Conteneur de chaque session
      const container = document.createElement("div");
      container.className = "prompt";
      Object.assign(container.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
      });

      // Titre persistant ou fallback
      const title = document.createElement("span");
      const titleText = titles[session_id] || preview;
      title.textContent = titleText;
      Object.assign(title.style, {
        flex: "1",
        cursor: "pointer",
      });

      // Bouton menu
      const menuBtn = document.createElement("span");
      menuBtn.textContent = "⋮";
      Object.assign(menuBtn.style, {
        cursor: "pointer",
        padding: "0 8px",
        userSelect: "none",
      });

      // Menu déroulant
      const menu = document.createElement("div");
      Object.assign(menu.style, {
        position: "absolute",
        top: "100%",
        right: "0",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        display: "none",
        zIndex: "999",
      });

      // Option Renommer
      const renameOption = document.createElement("div");
      renameOption.textContent = "Renommer";
      Object.assign(renameOption.style, {
        padding: "8px",
        cursor: "pointer",
      });
      renameOption.addEventListener("click", () => {
        const newName = prompt("Nouveau nom pour cette session :", title.textContent);
        if (newName) {
          title.textContent = newName;
          titles[session_id] = newName;
          saveSessionTitles(titles);
        }
        menu.style.display = "none";
      });

      // Option Supprimer
      const deleteOption = document.createElement("div");
      deleteOption.textContent = "Supprimer";
      Object.assign(deleteOption.style, {
        padding: "8px",
        cursor: "pointer",
      });
      deleteOption.addEventListener("click", () => container.remove());

      // Montage du menu
      menu.appendChild(renameOption);
      menu.appendChild(deleteOption);
      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });
      document.addEventListener("click", () => {
        menu.style.display = "none";
      });

     title.addEventListener("click", () => {
  // 1) On change de session
  localStorage.setItem("chat_id", session_id);

  // 2) On vide complètement l’affichage du chat
  chat.innerHTML = "";

  // 3) On reconstruit chaque message SANS appendMessage()
  sessionMessages.forEach(m => {
    const parsed = typeof m.message === "string"
      ? JSON.parse(m.message)
      : m.message;
    const msg = document.createElement("div");
    msg.className = `message ${parsed.type === "human" ? "user-message" : "bot-message"}`;
    msg.innerHTML = parsed.content;
    chat.appendChild(msg);
  });

  // 4) On force le scroll tout en haut
  chat.scrollTop = 0;

  // 5) On ferme la sidebar
  historyPanel.classList.remove("open");
});

      // Assemblage final
      container.appendChild(title);
      container.appendChild(menuBtn);
      container.appendChild(menu);
      historyList.appendChild(container);
    });

  } catch (err) {
    console.error("Erreur chargement historique", err);
  }
}

  resetBtn.addEventListener("click", () => {
  // 1) On supprime l’ancienne session pour en générer une nouvelle
  localStorage.removeItem("chat_id");
  localStorage.removeItem("chatHistory");

  // 2) Création d’une nouvelle session
  savesessionIDtolocalStorage();
  chat_id = loadsessionIDfromlocalstorage();

  // 3) On vide l’affichage et on remet le message de démarrage
  chat.innerHTML = "";
  appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");

  // 4) On recharge la sidebar pour inclure cette nouvelle session
  loadChatHistory();
});

  function appendMessage(message, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = message;
    const previousHeight = chat.scrollHeight;
  chat.appendChild(msg);
  const newHeight = chat.scrollHeight;
  // on fait défiler juste de la différence, pas tout le chat
  chat.scrollTop = previousHeight === 0
    ? newHeight             // si c'est le 1er message, on scroll en bas
    : chat.scrollTop + (newHeight - previousHeight);
  saveChatToLocalStorage();
}

  function saveChatToLocalStorage() {
    const messages = Array.from(chat.querySelectorAll(".message")).map(msg => ({
      role: msg.classList.contains("user-message") ? "user" : "bot",
      content: msg.innerHTML
    }));
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }

  function loadChatFromLocalStorage() {
    const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    history.forEach(msg => appendMessage(msg.content, msg.role === "user" ? "user-message" : "bot-message"));
  }

  function loadsessionIDfromlocalstorage() {
    let sessionID = localStorage.getItem("chat_id");
    if (!sessionID) sessionID = generateSessionID();
    return sessionID;
  }

  function savesessionIDtolocalStorage() {
    if (!localStorage.getItem("chat_id")) {
      localStorage.setItem("chat_id", generateSessionID());
    }
  }
  
  userInput.addEventListener("input", () => {
  if (pendingFile && userInput.value.trim() === "") {
    // si l’utilisateur efface tout, on réinitialise la PJ
    pendingFile = null;
    filePreview.style.display = "none";
  }
});


sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();

  // 1) Si ni texte ni fichier, on ne fait rien
  if (!text && !pendingFile) return;

  // 2) Afficher le message utilisateur (texte uniquement)
  if (text) {
    appendMessage(text, "user-message");
  }

  // 3) Afficher le loader
  const loader = document.createElement("div");
  loader.className = "message bot-message";
  loader.innerHTML = "Je réfléchis...";
  chat.appendChild(loader);
  chat.scrollTop = chat.scrollHeight;

  try {
    let res;
    if (pendingFile) {
      // --- Envoi du fichier + texte ---
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("question", text);
      formData.append("user_id", user_id);
      formData.append("chat_id", chat_id);
      formData.append("type", text ? "fileWithText" : "file");

      res = await fetch(webhookURL, {
        method: "POST",
        body: formData
      });

      // Réinitialiser l’état du fichier
      pendingFile = null;
      filePreview.textContent = "";
      filePreview.style.display = "none";

    } else {
      // --- Envoi du texte seul ---
      res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, user_id, chat_id, type: "text" }),
      });
    }

    const data = await res.json();
    loader.remove();
    appendMessage(data.output || "Pas de réponse", "bot-message");
    loadChatHistory();

  } catch (err) {
    loader.remove();
    appendMessage("❌ Erreur de connexion", "bot-message");
    console.error(err);
  } finally {
    // 4) Vider et remettre le focus sur le textarea
    userInput.value = "";
    userInput.focus();
  }
});


// Permet Shift+Entrée pour aller à la ligne, et Entrée seul pour envoyer
userInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // empêche l’ajout d’une nouvelle ligne
    sendBtn.click();         // déclenche l’envoi
  }
  // sinon (Shift+Enter), on laisse textarea ajouter le saut de ligne
});

// 🎯 Drag & Drop pour la zone de fichier
let dragCounter = 0;

["dragenter", "dragover"].forEach(eventType => {
  document.addEventListener(eventType, e => {
    e.preventDefault();
    dragCounter++;
    dropZone.style.display = "block";
    dropZone.style.opacity = "1";
    dropZone.style.pointerEvents = "all";
  });
});

["dragleave"].forEach(eventType => {
  document.addEventListener(eventType, e => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dropZone.style.opacity = "0";
      dropZone.style.pointerEvents = "none";
      dropZone.style.display = "none";
    }
  });
});

// reset du drag global
document.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0; // reset
  dropZone.style.opacity = "0";
  dropZone.style.pointerEvents = "none";
  dropZone.style.display = "none";
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.style.opacity = "0";
  dropZone.style.pointerEvents = "none";
  dropZone.style.display = "none";

  const file = e.dataTransfer.files[0];
  if (!file) return;

  // 1) on stocke le fichier dans pendingFile
  pendingFile = file;

  // 2) on affiche et configure la zone de prévisualisation existante
  filePreview.style.display = "block";
  filePreview.textContent = `📎 PJ prête : ${file.name} (rédigez votre consigne puis cliquez sur ▶)`;
});

// … reste du code pour recharger l’historique …
const currentChatId = localStorage.getItem("chat_id");
if (currentChatId) {
  fetchUserMessages(user_id).then(data => {
    // 1) On récupère tous les messages de la session actuelle
    const full = data.filter(m => m.session_id === currentChatId);

    // 2) On vide entièrement l’affichage du chat
    chat.innerHTML = "";

    // 3) On recrée manuellement chaque <div.message> sans trigger de scroll
    full.forEach(m => {
      const parsed = typeof m.message === "string"
        ? JSON.parse(m.message)
        : m.message;
      const msg = document.createElement("div");
      msg.className = `message ${parsed.type === "human" ? "user-message" : "bot-message"}`;
      msg.innerHTML = parsed.content;
      chat.appendChild(msg);
    });

    // 4) On force l’affichage sur le tout premier message
    chat.scrollTop = 0;

    // 5) On recharge la sidebar après affichage
    loadChatHistory();
  });
}

  // En dernier, la fonction utilitaire generateSessionID
  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
});
