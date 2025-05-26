// === ChatBot MyFreightLab avec historique, prompts, sidebar fermable, et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  console.log("🧩 user_id récupéré :", user_id);

  // Génère ou récupère un session_id existant
  savesessionIDtolocalStorage();
  let chat_id = loadsessionIDfromlocalstorage();

  // Création du wrapper + HTML/CSS
  const wrapper = document.createElement("div");
  wrapper.id = "chat-wrapper";
  wrapper.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
      * { font-family: 'Inter', sans-serif; }
      html, body { margin:0; padding:0; height:100vh; overflow:hidden; }
      #chat-wrapper {
        display:flex;
        flex-direction:column;
        justify-content:flex-end;
        height:90vh;
        width:80vw;
        margin:5vh auto;
        background:#f9fbfc;
        border-radius:12px;
        overflow:hidden;
        border:1px solid #d3dce6;
        position:relative;
      }
      #chat {
        flex:1;
        overflow-y:auto;
        padding:1rem;
        display:flex;
        flex-direction:column;
        gap:16px;
        align-items:center;
        height:calc(90vh - 100px);
      }
      .message {
        padding:14px 18px;
        border-radius:18px;
        max-width:80%;
        font-size:15px;
        line-height:1.6;
        box-shadow:0 2px 6px rgba(0,0,0,0.05);
        animation:fadeInUp 0.4s ease-out;
      }
      .user-message {
        align-self:flex-start;
        background:#e6f0ff;
        color:#003366;
        border-bottom-right-radius:0;
      }
      .bot-message {
        align-self:flex-end;
        background:#fff;
        color:#222;
        border-bottom-left-radius:0;
      }
      #input-area {
        display:flex;
        padding:12px 16px;
        border-top:1px solid #ccc;
        gap:10px;
        background:white;
      }
      #userInput {
        flex:1;
        padding:10px;
        border-radius:8px;
        border:1px solid #ccc;
        outline:none;
        font-size:15px;
      }
      #sendBtn {
        width:44px;
        height:44px;
        border-radius:50%;
        border:none;
        background:#0077c8;
        color:white;
        cursor:pointer;
      }
      #resetBtn {
        position:absolute;
        top:10px;
        left:10px;
        background:white;
        border:1px solid #ccc;
        padding:4px 8px;
        border-radius:12px;
        cursor:pointer;
        font-size:13px;
      }
      .dynamic-sidebar {
        position:fixed;
        top:0; right:-320px;
        width:320px;
        height:100vh;
        background:#fff;
        border-left:1px solid #ddd;
        box-shadow:-2px 0 6px rgba(0,0,0,0.05);
        transition:right 0.3s ease-in-out;
        z-index:9999;
        overflow-y:auto;
      }
      .dynamic-sidebar.open { right:0; }
      .sidebar-header {
        padding:16px;
        background:#0077c8;
        color:white;
        font-weight:bold;
        font-size:16px;
      }
      .sidebar-content { padding:10px; }
      .prompt {
        padding:10px;
        background:#f0f0f0;
        border-radius:6px;
        margin-bottom:8px;
        cursor:grab;
        font-size:14px;
      }
      details summary {
        font-weight:600;
        cursor:pointer;
        list-style:none;
        padding:10px 0;
      }
      .floating-toggle {
        position:fixed;
        top:50%;
        right:0;
        transform:translateY(-50%);
        background:#0077c8;
        color:white;
        padding:10px;
        border-radius:8px 0 0 8px;
        cursor:pointer;
        font-size:20px;
        z-index:99999;
      }
      #toggleHistory { top:40%; }
    </style>

    <button id="resetBtn">✨ Nouveau chat</button>
    <div id="chat"></div>
    <div id="input-area">
      <input type="text" id="userInput" placeholder="Pose ta question ici…" />
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
        <!-- tes <details> de prompts ici -->
          <details>
  <summary>▶ Opérations logistiques</summary>
  <div class="prompt">Tu peux m’optimiser un itinéraire express entre Shanghai et Anvers ?</div>
  <div class="prompt">Quel est le plus rapide entre bateau, train ou avion pour l’Asie–Europe ?</div>
  <div class="prompt">Un hub à Rotterdam, c’est une bonne idée pour livrer l’Allemagne ?</div>
  <div class="prompt">Comment je peux gagner du temps sur mes transits intercontinentaux ?</div>
  <div class="prompt">Quels sont les pièges à éviter avec une chaîne logistique multi-clients ?</div>
</details>

<details>
  <summary>▶ Commerce international</summary>
  <div class="prompt">Quels sont les incoterms les plus souvent utilisés en 2024 ?</div>
  <div class="prompt">Est-ce qu’il y a des accords de libre-échange avec l’Inde ?</div>
  <div class="prompt">Y a-t-il des sanctions qui pourraient bloquer certaines destinations ?</div>
  <div class="prompt">Comment prévoir les droits de douane pour exporter en Afrique ?</div>
  <div class="prompt">Comment profiter des accords UE–Canada ?</div>
</details>

<details>
  <summary>▶ Veille & analyses</summary>
  <div class="prompt">Quels sont les flux logistiques qui augmentent en ce moment ?</div>
  <div class="prompt">Y a-t-il des risques géopolitiques à suivre de près ?</div>
  <div class="prompt">Tu peux me sortir un résumé des dernières tendances logistiques ?</div>
  <div class="prompt">Quels indicateurs économiques impacteront le fret maritime ?</div>
  <div class="prompt">Donne-moi une analyse sur le marché Asie–Europe aujourd’hui</div>
</details>

<details>
  <summary>▶ Marché & tendances</summary>
  <div class="prompt">Quelles routes gagnent en popularité en 2024 ?</div>
  <div class="prompt">Quels ports sont en train de monter en puissance ?</div>
  <div class="prompt">Tu vois des ruptures ou innovations dans le transport cette année ?</div>
  <div class="prompt">Y a-t-il une tendance vers le rail ou le fluvial ?</div>
  <div class="prompt">Comment évoluent les attentes clients en matière de logistique ?</div>
</details>

<details>
  <summary>▶ Stratégie & gestion</summary>
  <div class="prompt">Tu peux m’aider à faire un benchmark de transporteurs ?</div>
  <div class="prompt">Quelle est la meilleure stratégie pour mon service logistique ?</div>
  <div class="prompt">Comment optimiser ma gestion des stocks entre 2 continents ?</div>
  <div class="prompt">Faut-il mieux un entrepôt central ou plusieurs hubs ?</div>
  <div class="prompt">Comment améliorer le service client dans la chaîne logistique ?</div>
</details>

<details>
  <summary>▶ Cas pratiques & simulations</summary>
  <div class="prompt">Je t’envoie un doc, tu peux me résumer les infos clés ?</div>
  <div class="prompt">Peux-tu m’écrire une synthèse à partir de ces trois fichiers ?</div>
  <div class="prompt">Tu peux créer une instruction transport depuis ce modèle ?</div>
  <div class="prompt">Lis ce PDF et dis-moi s’il manque des infos critiques</div>
  <div class="prompt">Peux-tu vérifier la cohérence de cette liasse documentaire ?</div>
</details>
      </div>
    </div>
  `;
  document.getElementById("chat-container").appendChild(wrapper);


  // Création de la zone de drop
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  dropZone.style.cssText = `
    border: 2px dashed #ccc;
    padding: 40px;
    text-align: center;
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.95);
    font-size: 18px;
    z-index: 10000;
    transition: opacity 0.3s ease;
    pointer-events: all;
  `;
  dropZone.innerText = "📂 Déposez votre fichier ici";
  document.body.appendChild(dropZone);

  // Récupération des éléments
  const chat = wrapper.querySelector("#chat");
  const userInput = wrapper.querySelector("#userInput");
  const sendBtn = wrapper.querySelector("#sendBtn");
  const resetBtn = wrapper.querySelector("#resetBtn");
  const togglePromptBtn = wrapper.querySelector("#togglePrompt");
  const toggleHistoryBtn = wrapper.querySelector("#toggleHistory");
  const promptPanel = wrapper.querySelector("#promptPanel");
  const historyPanel = wrapper.querySelector("#historyPanel");
  const historyList = wrapper.querySelector("#historyList");
  const prompts = wrapper.querySelectorAll(".prompt");

  // Toggle sidebars
  togglePromptBtn.addEventListener("click", () => promptPanel.classList.toggle("open"));
  toggleHistoryBtn.addEventListener("click", () => historyPanel.classList.toggle("open"));

  // Click sur un prompt
  prompts.forEach(p => p.addEventListener("click", () => {
    userInput.value = p.textContent;
    userInput.focus();
    promptPanel.classList.remove("open");
  }));

  // Drag & drop sur l’input
  userInput.addEventListener("dragover", e => e.preventDefault());
  userInput.addEventListener("drop", e => {
    e.preventDefault();
    userInput.value = e.dataTransfer.getData("text");
    promptPanel.classList.remove("open");
  });

  // Fonction pour récupérer l’historique serveur
  async function fetchUserMessages(userId) {
    try {
      const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if (!res.ok) throw new Error("Erreur HTTP");
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  // Génère les aperçus pour la sidebar
  function getLastMessages(messages) {
    const map = new Map();
    messages.forEach(m => {
      if (!map.has(m.session_id) || m.id > map.get(m.session_id).id) {
        map.set(m.session_id, m);
      }
    });
    return Array.from(map.values())
      .sort((a,b) => b.id - a.id)
      .map(m => {
        const msg = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
        const tmp = document.createElement("div");
        tmp.innerHTML = msg.content || "";
        const text = (tmp.textContent || tmp.innerText).slice(0, 30);
        return { session_id: m.session_id, preview: text + (text.length === 30 ? "…" : "") };
      });
  }

  // Charge la sidebar sans toucher au chat principal
  async function loadChatHistory() {
    const data = await fetchUserMessages(user_id);
    const previews = getLastMessages(data);
    historyList.innerHTML = "";
    previews.forEach(({session_id, preview}) => {
      const row = document.createElement("div");
      row.className = "prompt";
      row.textContent = preview;
      row.addEventListener("click", () => {
        localStorage.setItem("chat_id", session_id);
        chat.innerHTML = "";
        data.filter(m => m.session_id === session_id)
            .forEach(m => {
              const pm = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
              if (pm.content) appendMessage(pm.content, pm.type === "human" ? "user-message" : "bot-message");
            });
        historyPanel.classList.remove("open");
      });
      historyList.appendChild(row);
    });
  }

  // Nouveau chat : supprime tout et recrée un session_id
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("chatHistory");
    localStorage.removeItem("chat_id");
    savesessionIDtolocalStorage();
    chat_id = loadsessionIDfromlocalstorage();
    chat.innerHTML = "";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
  });

  // Affiche un message dans le chat
  function appendMessage(content, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = content;
    chat.appendChild(msg);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }

  // Envoi d’un message texte
  sendBtn.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, "user-message");
    userInput.value = "";

    const loader = document.createElement("div");
    loader.className = "message bot-message";
    loader.innerHTML = "Je réfléchis…";
    chat.appendChild(loader);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, user_id, chat_id, type: "text" })
      });
      const data = await res.json();
      loader.remove();
      appendMessage(data.output || "Pas de réponse", "bot-message");
      loadChatHistory();
    } catch (err) {
      loader.remove();
      appendMessage("Erreur de connexion", "bot-message");
    }
  });
  userInput.addEventListener("keypress", e => { if (e.key === "Enter") sendBtn.click(); });

  // Drag & Drop global pour fichiers
  let dragCounter = 0;
  ["dragenter","dragover"].forEach(evt => {
    document.addEventListener(evt, e => {
      e.preventDefault();
      dragCounter++;
      dropZone.style.display = "block";
      dropZone.style.opacity = "1";
    });
  });
  ["dragleave"].forEach(evt => {
    document.addEventListener(evt, e => {
      e.preventDefault();
      if (--dragCounter <= 0) {
        dropZone.style.opacity = "0";
        setTimeout(() => dropZone.style.display = "none", 300);
      }
    });
  });
  document.addEventListener("drop", e => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.style.opacity = "0";
    setTimeout(() => dropZone.style.display = "none", 300);
  });

  dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user_id);
    formData.append("chat_id", chat_id);
    formData.append("type", "file");
    appendMessage(`📎 Fichier reçu : ${file.name}`, "user-message");
    try {
      const res = await fetch(webhookURL, { method: "POST", body: formData });
      const result = await res.json();
      appendMessage(result.output || "✅ Fichier traité !", "bot-message");
      loadChatHistory();
    } catch (err) {
      console.error(err);
      appendMessage("❌ Erreur lors de l’envoi du fichier", "bot-message");
    }
  });

  // Initialisation de la sidebar seule
  loadChatHistory();
});

// Utilitaires session_id
function loadsessionIDfromlocalstorage() {
  let sid = localStorage.getItem("chat_id");
  if (!sid) sid = generateSessionID();
  return sid;
}
function savesessionIDtolocalStorage() {
  if (!localStorage.getItem("chat_id")) {
    localStorage.setItem("chat_id", generateSessionID());
  }
}
function generateSessionID() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}
