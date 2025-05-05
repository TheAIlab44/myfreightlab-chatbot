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
    #chat-wrapper { display: flex; flex-direction: column; justify-content: flex-end; height: 90vh; width: 80vw; margin: 0 auto; background: #f9fbfc; border-radius: 12px; overflow: hidden; border: 1px solid #d3dce6; position: relative; }
    #chat { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .message { padding: 14px 18px; border-radius: 18px; max-width: 80%; font-size: 15px; line-height: 1.6; box-shadow: 0 2px 6px rgba(0,0,0,0.05); animation: fadeInUp 0.4s ease-out; }
    .user-message { align-self: flex-start; background: #e6f0ff; color: #003366; border-bottom-right-radius: 0; }
    .bot-message { align-self: flex-end; background: #fff; color: #222; border-bottom-left-radius: 0; }
    #input-area { display: flex; padding: 12px 16px; border-top: 1px solid #ccc; gap: 10px; background: white; }
    #userInput { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; outline: none; font-size: 15px; }
    #sendBtn { width: 44px; height: 44px; border-radius: 50%; border: none; background: #0077c8; color: white; cursor: pointer; }
    #resetBtn { position: absolute; top: 10px; left: 10px; background: white; border: 1px solid #ccc; padding: 4px 8px; border-radius: 12px; cursor: pointer; font-size: 13px; }
    .dynamic-sidebar { position: fixed; top: 0; right: -320px; width: 320px; height: 100vh; background: #fff; border-left: 1px solid #ddd; box-shadow: -2px 0 6px rgba(0,0,0,0.05); transition: right 0.3s ease-in-out; z-index: 9999; overflow-y: auto; }
    .dynamic-sidebar.open { right: 0; }
    .sidebar-header { padding: 16px; background: #0077c8; color: white; font-weight: bold; font-size: 16px; }
    .sidebar-content { padding: 10px; }
    .prompt { padding: 10px; background: #f0f0f0; border-radius: 6px; margin-bottom: 8px; cursor: grab; font-size: 14px; }
    details summary { font-weight: 600; cursor: pointer; list-style: none; padding: 10px 0; }
    .floating-toggle { position: fixed; top: 50%; right: 0; transform: translateY(-50%); background-color: #0077c8; color: white; padding: 10px; border-radius: 8px 0 0 8px; cursor: pointer; font-size: 20px; z-index: 99999; }
    #toggleHistory { top: 40%; }
  </style>

  <button id="resetBtn">✨ Nouveau chat</button>
  <div id="chat"></div>
  <div id="input-area">
    <input type="text" id="userInput" placeholder="Pose ta question ici..." />
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
      <!-- tes blocs <details> ... ici ... -->
      <!-- tu peux remettre tous tes blocs prompts/logistique/etc ici -->
      <details>
      <summary>▶ Opérations logistiques</summary>
      <div class="prompt" draggable="true">Tu peux m’optimiser un itinéraire express entre Shanghai et Anvers ?</div>
      <div class="prompt" draggable="true">Quel est le plus rapide entre bateau, train ou avion pour l’Asie–Europe ?</div>
      <div class="prompt" draggable="true">Un hub à Rotterdam, c’est une bonne idée pour livrer l’Allemagne ?</div>
      <div class="prompt" draggable="true">Comment je peux gagner du temps sur mes transits intercontinentaux ?</div>
      <div class="prompt" draggable="true">Quels sont les pièges à éviter avec une chaîne logistique multi-clients ?</div>
    </details>

    <details>
      <summary>▶ Commerce international</summary>
      <div class="prompt" draggable="true">Quels sont les incoterms les plus souvent utilisés en 2024 ?</div>
      <div class="prompt" draggable="true">Est-ce qu’il y a des accords de libre-échange avec l’Inde ?</div>
      <div class="prompt" draggable="true">Y a-t-il des sanctions qui pourraient bloquer certaines destinations ?</div>
      <div class="prompt" draggable="true">Comment prévoir les droits de douane pour exporter en Afrique ?</div>
      <div class="prompt" draggable="true">Comment profiter des accords UE–Canada ?</div>
    </details>

    <details>
      <summary>▶ Veille & analyses</summary>
      <div class="prompt" draggable="true">Quels sont les flux logistiques qui augmentent en ce moment ?</div>
      <div class="prompt" draggable="true">Y a-t-il des risques géopolitiques à suivre de près ?</div>
      <div class="prompt" draggable="true">Tu peux me sortir un résumé des dernières tendances logistiques ?</div>
      <div class="prompt" draggable="true">Quels indicateurs économiques impacteront le fret maritime ?</div>
      <div class="prompt" draggable="true">Donne-moi une analyse sur le marché Asie–Europe aujourd’hui</div>
    </details>

    <details>
      <summary>▶ Marché & tendances</summary>
      <div class="prompt" draggable="true">Quelles routes gagnent en popularité en 2024 ?</div>
      <div class="prompt" draggable="true">Quels ports sont en train de monter en puissance ?</div>
      <div class="prompt" draggable="true">Tu vois des ruptures ou innovations dans le transport cette année ?</div>
      <div class="prompt" draggable="true">Y a-t-il une tendance vers le rail ou le fluvial ?</div>
      <div class="prompt" draggable="true">Comment évoluent les attentes clients en matière de logistique ?</div>
    </details>

    <details>
      <summary>▶ Stratégie & gestion</summary>
      <div class="prompt" draggable="true">Tu peux m’aider à faire un benchmark de transporteurs ?</div>
      <div class="prompt" draggable="true">Quelle est la meilleure stratégie pour mon service logistique ?</div>
      <div class="prompt" draggable="true">Comment optimiser ma gestion des stocks entre 2 continents ?</div>
      <div class="prompt" draggable="true">Faut-il mieux un entrepôt central ou plusieurs hubs ?</div>
      <div class="prompt" draggable="true">Comment améliorer le service client dans la chaîne logistique ?</div>
    </details>

    <details>
      <summary>▶ Cas pratiques & simulations</summary>
      <div class="prompt" draggable="true">Je t’envoie un doc, tu peux me résumer les infos clés ?</div>
      <div class="prompt" draggable="true">Peux-tu m’écrire une synthèse à partir de ces trois fichiers ?</div>
      <div class="prompt" draggable="true">Tu peux créer une instruction transport depuis ce modèle ?</div>
      <div class="prompt" draggable="true">Lis ce PDF et dis-moi s’il manque des infos critiques</div>
      <div class="prompt" draggable="true">Peux-tu vérifier la cohérence de cette liasse documentaire ?</div>
    </details>
  </div>
</div>
`;
// ton wrapper.innerHTML complet reste inchangé ici...

  const container = document.getElementById("chat-container");
  if (!container) return;
  container.appendChild(wrapper);

  const chat = wrapper.querySelector("#chat");
  const userInput = wrapper.querySelector("#userInput");
  const sendBtn = wrapper.querySelector("#sendBtn");
  const resetBtn = wrapper.querySelector("#resetBtn");

  const togglePromptBtn = wrapper.querySelector("#togglePrompt");
  const toggleHistoryBtn = wrapper.querySelector("#toggleHistory");
  const promptPanel = wrapper.querySelector("#promptPanel");
  const historyPanel = wrapper.querySelector("#historyPanel");
  const historyList = wrapper.querySelector("#historyList");
  const sidebar = promptPanel;
  const prompts = wrapper.querySelectorAll(".prompt");

  togglePromptBtn.addEventListener("click", () => promptPanel.classList.toggle("open"));
  toggleHistoryBtn.addEventListener("click", () => historyPanel.classList.toggle("open"));

  prompts.forEach(prompt => {
    prompt.addEventListener("click", () => {
      userInput.value = prompt.textContent;
      userInput.focus();
      sidebar.classList.remove("open");
    });
    prompt.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", prompt.textContent));
  });

  userInput.addEventListener("dragover", e => e.preventDefault());
  userInput.addEventListener("drop", e => {
    e.preventDefault();
    userInput.value = e.dataTransfer.getData("text");
    sidebar.classList.remove("open");
  });

  async function fetchUserMessages(userId) {
    try {
      const response = await fetch("https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      if (!response.ok) throw new Error("Erreur lors de la requête");
      const data = await response.json();
      console.log("Messages reçus :", data);
      return data;
    } catch (error) {
      console.error("Erreur :", error);
      return [];
    }
  }

  function getLastMessages(messages) {
    const map = new Map();
    messages.forEach(msg => {
      if (!map.has(msg.session_id) || msg.id > map.get(msg.session_id).id) {
        map.set(msg.session_id, msg);
      }
    });
    const sorted = Array.from(map.values()).sort((a, b) => b.id - a.id);
    return sorted.map(m => {
  const parsed = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
  const tmp = document.createElement("div");
tmp.innerHTML = parsed.content || '';
const textOnly = tmp.textContent || tmp.innerText || "";
const clean = textOnly.replace(/[\u{1F600}-\u{1F6FF}]/gu, ""); // facultatif : enlève les emojis

return {
  session_id: m.session_id,
  preview: clean.substring(0, 20) + (clean.length > 20 ? '...' : '')
};

});
  }

  async function loadChatHistory() {
    try {
      console.log("📥 Chargement historique en cours...");
      let data = await fetchUserMessages(user_id);
      const previews = getLastMessages(data);
      console.log("Prévisualisations :", previews);

      historyList.innerHTML = "";
previews.forEach(({ session_id, preview }) => {
  // Container principal
  const container = document.createElement("div");
  container.className = "prompt";
  container.style.display = "flex";
  container.style.justifyContent = "space-between";
  container.style.alignItems = "center";
  container.style.position = "relative";

  // Titre cliquable
  const title = document.createElement("span");
  title.textContent = preview;
  title.style.flex = "1";
  title.style.cursor = "pointer";

  // Menu bouton (3 points)
  const menuBtn = document.createElement("span");
  menuBtn.textContent = "⋮";
  menuBtn.style.cursor = "pointer";
  menuBtn.style.padding = "0 8px";
  menuBtn.style.userSelect = "none";

  // Menu déroulant
  const menu = document.createElement("div");
  menu.style.position = "absolute";
  menu.style.top = "100%";
  menu.style.right = "0";
  menu.style.background = "white";
  menu.style.border = "1px solid #ccc";
  menu.style.borderRadius = "6px";
  menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
  menu.style.display = "none";
  menu.style.zIndex = "999";

  // Options du menu
  const renameOption = document.createElement("div");
  renameOption.textContent = "Renommer";
  renameOption.style.padding = "8px";
  renameOption.style.cursor = "pointer";
  renameOption.addEventListener("click", () => {
    const newName = prompt("Nouveau nom pour cette session :", preview);
    if (newName) {
      title.textContent = newName;
      // (optionnel) Tu peux sauvegarder ce nom en localStorage ou backend ici
    }
    menu.style.display = "none";
  });

  const deleteOption = document.createElement("div");
  deleteOption.textContent = "Supprimer";
  deleteOption.style.padding = "8px";
  deleteOption.style.cursor = "pointer";
  deleteOption.addEventListener("click", () => {
    container.remove();
    // (optionnel) Tu peux aussi supprimer sur le backend ici
  });

  menu.appendChild(renameOption);
  menu.appendChild(deleteOption);

  // Toggle menu au clic
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // évite de propager le clic
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  // Clic sur titre = recharger l’historique
  title.addEventListener("click", async () => {
    localStorage.setItem("chat_id", session_id);
    chat.innerHTML = "";
    const full = data.filter(m => m.session_id === session_id);
    full.forEach(m => {
      const parsed = JSON.parse(m.message);
      appendMessage(parsed.content, parsed.type === "human" ? "user-message" : "bot-message");
    });
    historyPanel.classList.remove("open");
  });

  // Fermer le menu si on clique ailleurs
  document.addEventListener("click", () => {
    menu.style.display = "none";
  });

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
    localStorage.removeItem("chatHistory");
    savesessionIDtolocalStorage();
    chat_id = loadsessionIDfromlocalstorage();
    chat.innerHTML = "";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
  });

  function appendMessage(message, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = message;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
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
    localStorage.setItem("chat_id", generateSessionID());
  }

  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  sendBtn.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, "user-message");
    userInput.value = "";
    const loader = document.createElement("div");
    loader.className = "message bot-message";
    loader.innerHTML = "Je réfléchis...";
    chat.appendChild(loader);
    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        body: JSON.stringify({ question: text, user_id, chat_id }),
        headers: { "Content-Type": "application/json" },
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

  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });

  loadChatHistory();
  loadChatFromLocalStorage();
});
