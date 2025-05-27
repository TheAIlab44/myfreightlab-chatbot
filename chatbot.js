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
    width: 48px;
    height: 48px;
    background: #fff;
    border: 1px solid #d3dce6;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* image ou extension */
  #file-preview .file-item img,
  #file-preview .file-item .file-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
  <textarea id="userInput" placeholder="Pose ta question ici…" rows="2"
    style="resize:none; padding:10px; border-radius:8px; border:1px solid #ccc;
           font-size:15px; flex:1; overflow-y:auto;"></textarea>
  <button id="sendBtn">▶</button>
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
  const resetBtn     = wrapper.querySelector("#resetBtn");
  const dropZone     = wrapper.querySelector("#drop-zone");
  const toggleHistory= wrapper.querySelector("#toggleHistory");
  const historyPanel = wrapper.querySelector("#historyPanel");
  const historyList  = wrapper.querySelector("#historyList");
  const togglePrompt = wrapper.querySelector("#togglePrompt");
  const promptPanel  = wrapper.querySelector("#promptPanel");
  const prompts      = wrapper.querySelectorAll(".prompt");

  // — File preview container INSIDE input-area
  let pendingFiles = [];
  const filePreview = document.createElement("div");
  filePreview.id = "file-preview";
  filePreview.style.display = "none";
  inputArea.appendChild(filePreview);

  // — sidebar toggles
  toggleHistory.addEventListener("click", () => historyPanel.classList.toggle("open"));
  togglePrompt .addEventListener("click", () => promptPanel.classList.toggle("open"));
  prompts.forEach(p => p.addEventListener("click", () => {
    userInput.value = p.textContent;
    promptPanel.classList.remove("open");
    userInput.focus();
  }));

  // — Show/hide dropZone
  ["dragenter","dragover"].forEach(evt =>
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.display = "block";
      dropZone.style.opacity = "1";
    })
  );
  ["dragleave","drop"].forEach(evt =>
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.opacity = "0";
      setTimeout(() => dropZone.style.display = "none", 300);
    })
  );

  // — Handle file drop with miniatures
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    pendingFiles.push(...e.dataTransfer.files);

    // affiche la preview *mini* et uniquement icônes/images
    filePreview.innerHTML = "";
    filePreview.style.display = "flex";

    pendingFiles.forEach(file => {
      const item = document.createElement("div");
      item.className = "file-item";
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        item.appendChild(img);
      } else {
        const ico = document.createElement("div");
        ico.className = "file-icon";
        ico.textContent = file.name.split(".").pop().toUpperCase();
        item.appendChild(ico);
      }
      filePreview.appendChild(item);
    });

    dropZone.style.opacity = "0";
    setTimeout(() => dropZone.style.display = "none", 300);

    console.log("📝 pendingFiles:", pendingFiles);
  });


  // — Fetch history from webhook
  async function fetchUserMessages() {
    try {
      const r = await fetch("https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ user_id })
      });
      if (!r.ok) throw new Error();
      return r.json();
    } catch {
      return [];
    }
  }

  function getLastSessions(msgs) {
    const m = new Map();
    msgs.forEach(x => {
      if (!m.has(x.session_id) || x.id > m.get(x.session_id).id) {
        m.set(x.session_id, x);
      }
    });
    return Array.from(m.values()).sort((a,b) => b.id - a.id);
  }

  async function loadHistory() {
    const all = await fetchUserMessages();
    historyList.innerHTML = "";
    getLastSessions(all).forEach(entry => {
      const div = document.createElement("div");
      div.className = "prompt";
      div.textContent = entry.session_id;
      div.onclick = async () => {
        localStorage.setItem("chat_id", entry.session_id);
        chat.innerHTML = "";
        const sessionMsgs = (await fetchUserMessages())
          .filter(x => x.session_id === entry.session_id);
        sessionMsgs.forEach(m => {
          const js = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
          appendMessage(js.content, js.type==="human"?"user-message":"bot-message");
        });
        historyPanel.classList.remove("open");
      };
      historyList.appendChild(div);
    });
  }

  // — Append & save locally
  function appendMessage(html, cls) {
    const m = document.createElement("div");
    m.className = `message ${cls}`;
    m.innerHTML = html;
    const prev = chat.scrollHeight;
    chat.appendChild(m);
    chat.scrollTop = prev===0 ? chat.scrollHeight : chat.scrollTop + (chat.scrollHeight - prev);
    saveLocal();
  }
  function saveLocal() {
    const arr = Array.from(chat.querySelectorAll(".message")).map(d => ({
      role: d.classList.contains("user-message") ? "user" : "bot",
      content: d.innerHTML
    }));
    localStorage.setItem("chatHistory", JSON.stringify(arr));
  }

  // — Reset button
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("chat_id");
    localStorage.removeItem("chatHistory");
    saveSessionID();
    chat_id = loadSessionID();
    chat.innerHTML = "";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
    loadHistory();
  });

  // — Send logic
sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();
  if (!text && pendingFiles.length === 0) return;
  if (text) appendMessage(text, "user-message");

  // loader
  const loader = document.createElement("div");
  loader.className = "message bot-message";
  loader.innerHTML = "Je réfléchis…";
  chat.appendChild(loader);
  chat.scrollTop = chat.scrollHeight;

  try {
    let res, data;

    if (pendingFiles.length > 0) {
      // 1) Prépare le FormData
      const fd = new FormData();
      pendingFiles.forEach((f) => fd.append("file", f, f.name));
      fd.append("question", text);
      fd.append("user_id", user_id);
      fd.append("chat_id", chat_id);
      fd.append("type", text ? "filesWithText" : "files");

      // 2) Debug : inspecter le contenu sans renvoyer
      for (let [key, val] of fd.entries()) {
        console.log("📦 FormData:", key, val);
      }

      // 3) Fais UNE SEULE requête
      res = await fetch(webhookURL, { method: "POST", body: fd });
      console.log("⬅️ Statut:", res.status, res.statusText);

      // 4) Récupère la réponse
      data = await res.json();

      // 5) Réinitialise
      pendingFiles = [];
      filePreview.style.display = "none";
      filePreview.innerHTML = "";

    } else {
      // envoi texte seul
      res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          user_id,
          chat_id,
          type: "text"
        })
      });
      data = await res.json();
    }

    // affiche la réponse et recharge l’historique
    loader.remove();
    appendMessage(data.output || "Pas de réponse", "bot-message");
    loadHistory();

  } catch (err) {
    loader.remove();
    appendMessage("❌ Erreur de connexion", "bot-message");
    console.error(err);
  } finally {
    userInput.value = "";
    userInput.focus();
  }
});

  // — Enter vs Shift+Enter
  userInput.addEventListener("keydown", e => {
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // — Init
  loadHistory();
  JSON.parse(localStorage.getItem("chatHistory")||"[]")
      .forEach(m => appendMessage(m.content, m.role==="user"?"user-message":"bot-message"));
  chat.scrollTop = 0;
});
