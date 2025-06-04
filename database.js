<!-- 1) Chargement de la lib Supabase et création du client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
  const SUPABASE_URL     = "https://asjqmzgcajcizutrldqw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzanFtemdjYWpjaXp1dHJsZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTY1MjAsImV4cCI6MjA1NjU5MjUyMH0.8AGX4EI6F88TYrs1aunsFuwLWJfj3Zf_SJW1Y1tiTZc";
  const supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>

<script>
// === ChatBot MyFreightLab avec historique, prompts, sidebar, multi-PJ et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const user_id    = new URLSearchParams(location.search).get("user_id");

  // — Session utilities
  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
      width: 56px;
      height: 56px;
      background: #fff;
      border: 1px solid #d3dce6;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
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
  const chat          = wrapper.querySelector("#chat");
  const inputArea     = wrapper.querySelector("#input-area");
  const userInput     = wrapper.querySelector("#userInput");
  const sendBtn       = wrapper.querySelector("#sendBtn");
  const resetBtn      = wrapper.querySelector("#resetBtn");
  const dropZone      = wrapper.querySelector("#drop-zone");
  const toggleHistory = wrapper.querySelector("#toggleHistory");
  const historyPanel  = wrapper.querySelector("#historyPanel");
  const historyList   = wrapper.querySelector("#historyList");
  const togglePrompt  = wrapper.querySelector("#togglePrompt");
  const promptPanel   = wrapper.querySelector("#promptPanel");
  const prompts       = wrapper.querySelectorAll(".prompt");

  // --- HISTORIQUE DE CONVERSATION ---

  // 1) Récupération depuis le backend
  async function fetchUserMessages(userId) {
    try {
      const res = await fetch(
        "https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      if (!res.ok) throw new Error("Erreur fetch messages");
      return await res.json();
    } catch (err) {
      console.error("fetchUserMessages :", err);
      return [];
    }
  }

  // 2) On garde pour chaque session son dernier message
  function getLastSessions(messages) {
    const map = new Map();
    messages.forEach((m) => {
      if (!map.has(m.session_id) || m.id > map.get(m.session_id).id) {
        map.set(m.session_id, m);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.id - a.id);
  }

  // 3) Titres persistés en localStorage
  function getSessionTitles() {
    return JSON.parse(localStorage.getItem("sessionTitles") || "{}");
  }
  function saveSessionTitles(titles) {
    localStorage.setItem("sessionTitles", JSON.stringify(titles));
  }

  // 4) Construction de la sidebar
  async function loadHistory() {
    const all    = await fetchUserMessages(user_id);
    const lasts  = getLastSessions(all);
    const titles = getSessionTitles();

    // initialiser titres non renommés
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

    // vider la liste
    historyList.innerHTML = "";

    // recréer chaque entrée
    lasts.forEach(({ session_id }) => {
      const entry = document.createElement("div");
      entry.className = "prompt";
      entry.textContent = titles[session_id];
      entry.addEventListener("click", async () => {
        // switch de session
        localStorage.setItem("chat_id", session_id);
        chat.innerHTML = "";

        // recharger tous les messages de cette session
        (await fetchUserMessages(user_id))
          .filter((m) => m.session_id === session_id)
          .forEach((m) => {
            const js = typeof m.message === "string" ? JSON.parse(m.message) : m.message;
            const d  = document.createElement("div");
            d.className = `message ${js.type === "human" ? "user-message" : "bot-message"}`;
            d.innerHTML = js.content;
            chat.appendChild(d);
          });

        chat.scrollTop = 0;
        historyPanel.classList.remove("open");
      });
      historyList.appendChild(entry);
    });
  }

  // 5) Réinitialiser l’historique courant
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("chat_id");
    localStorage.removeItem("chatHistory");
    saveSessionID();
    chat_id = loadSessionID();
    chat.innerHTML = "";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
    loadHistory();
  });

  // 6) Lancer au démarrage
  loadHistory();

  // — File preview container INSIDE input-area
  let pendingFiles = [];
  const filePreview = document.createElement("div");
  filePreview.id = "file-preview";
  filePreview.style.display = "none";
  inputArea.appendChild(filePreview);

  // — sidebar toggles & prompts
  toggleHistory.addEventListener("click", () => historyPanel.classList.toggle("open"));
  togglePrompt.addEventListener("click", () => promptPanel.classList.toggle("open"));
  prompts.forEach((p) =>
    p.addEventListener("click", () => {
      userInput.value = p.textContent;
      promptPanel.classList.remove("open");
      userInput.focus();
    })
  );

  // — Drag & Drop visual (éviter le “clignotement”)
  let dragCounter = 0;
  ["dragenter", "dragover"].forEach((evt) =>
    document.addEventListener(evt, (e) => {
      e.preventDefault();
      dragCounter++;
      dropZone.style.display = "block";
      dropZone.style.opacity = "1";
    })
  );
  ["dragleave"].forEach((evt) =>
    document.addEventListener(evt, (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        dropZone.style.opacity = "0";
        setTimeout(() => (dropZone.style.display = "none"), 300);
      }
    })
  );
  // Masquer la dropZone si on lâche en dehors
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.style.opacity = "0";
    setTimeout(() => (dropZone.style.display = "none"), 300);
  });

  // — Handle file drop with miniatures + bouton “fermer”
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.style.opacity = "0";
    setTimeout(() => (dropZone.style.display = "none"), 300);

    const files = Array.from(e.dataTransfer.files);
    pendingFiles.push(...files);

    filePreview.innerHTML = "";
    filePreview.style.display = "flex";

    files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "file-item";

      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        file._objectUrl = objectUrl;
        img.src = objectUrl;
        img.addEventListener(
          "load",
          () => URL.revokeObjectURL(objectUrl),
          { once: true }
        );
        item.appendChild(img);
      } else {
        const ico = document.createElement("div");
        ico.className = "file-icon";
        ico.textContent = file.name.split(".").pop().toUpperCase();
        item.appendChild(ico);
      }

      filePreview.appendChild(item);
    });

    // — Bouton global “×” pour tout supprimer
    const clearBtn = document.createElement("div");
    clearBtn.className = "file-clear";
    clearBtn.textContent = "×";
    clearBtn.title = "Tout supprimer";
    clearBtn.style.cursor = "pointer"; // curseur pointer
    clearBtn.onclick = () => {
      pendingFiles.forEach((f) => {
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
    chat.scrollTop =
      prev === 0 ? chat.scrollHeight : chat.scrollTop + (chat.scrollHeight - prev);
    saveLocal();
  }
  function saveLocal() {
    const arr = Array.from(chat.querySelectorAll(".message")).map((d) => ({
      role: d.classList.contains("user-message") ? "user" : "bot",
      content: d.innerHTML,
    }));
    localStorage.setItem("chatHistory", JSON.stringify(arr));
  }

  // — Send logic
  sendBtn.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (!text && pendingFiles.length === 0) return;
    if (text) appendMessage(text, "user-message");

    const loader = document.createElement("div");
    loader.className = "message bot-message";
    loader.innerHTML = "Je réfléchis…";
    chat.appendChild(loader);
    chat.scrollTop = chat.scrollHeight;

    try {
      let res, data;
      if (pendingFiles.length > 0) {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append("file", f, f.name));
        fd.append("question", text);
        fd.append("user_id", user_id);
        fd.append("chat_id", chat_id);
        fd.append("type", text ? "filesWithText" : "files");
        for (let [k, v] of fd.entries()) console.log("📦", k, v);
        res = await fetch(webhookURL, { method: "POST", body: fd });
        data = await res.json();
        pendingFiles = [];
        filePreview.style.display = "none";
        filePreview.innerHTML = "";
      } else {
        res = await fetch(webhookURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, user_id, chat_id, type: "text" }),
        });
        data = await res.json();
      }
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
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // — Init
  JSON.parse(localStorage.getItem("chatHistory") || "[]").forEach((m) =>
    appendMessage(m.content, m.role === "user" ? "user-message" : "bot-message")
  );
  chat.scrollTop = 0;
});
</script>
