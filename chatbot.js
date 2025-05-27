// === ChatBot MyFreightLab avec historique, prompts, sidebar, multi-PJ et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const user_id   = new URLSearchParams(location.search).get("user_id");

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
      /* ==== TON CSS ICI (inchangé) ==== */
    </style>
    <button id="resetBtn">✨ Nouveau chat</button>
    <div id="chat"></div>
    <div id="input-area">
      <textarea id="userInput" placeholder="Pose ta question ici…" rows="2"></textarea>
      <button id="sendBtn">▶</button>
    </div>
    <div class="floating-toggle" id="toggleHistory">🕓</div>
    <div class="dynamic-sidebar" id="historyPanel">
      <div class="sidebar-header">🕓 Historique</div><div class="sidebar-content" id="historyList"></div>
    </div>
    <div class="floating-toggle" id="togglePrompt">💡</div>
    <div class="dynamic-sidebar" id="promptPanel">
      <div class="sidebar-header">💡 Prompts</div><div class="sidebar-content"><!-- tes prompts --></div>
    </div>
  `;
  document.getElementById("chat-container").appendChild(wrapper);

  // — Key elements
  const chat           = wrapper.querySelector("#chat");
  const userInput      = wrapper.querySelector("#userInput");
  const sendBtn        = wrapper.querySelector("#sendBtn");
  const resetBtn       = wrapper.querySelector("#resetBtn");
  const toggleHistory  = wrapper.querySelector("#toggleHistory");
  const historyPanel   = wrapper.querySelector("#historyPanel");
  const historyList    = wrapper.querySelector("#historyList");
  const togglePrompt   = wrapper.querySelector("#togglePrompt");
  const promptPanel    = wrapper.querySelector("#promptPanel");
  const prompts        = wrapper.querySelectorAll(".prompt");

  // — File preview & storage
  let pendingFiles = [];
  const filePreview = document.createElement("div");
  filePreview.id = "file-preview";
  Object.assign(filePreview.style, {
    display:    "none",
    padding:    "8px",
    background: "#f0f0f0",
    borderRadius:"6px",
    marginBottom:"8px",
    maxWidth:   "80%",
  });
  userInput.before(filePreview);

  // — Global dropZone
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  Object.assign(dropZone.style, {
    border:     "2px dashed #ccc",
    padding:    "40px",
    textAlign:  "center",
    position:   "fixed",
    top:0,left:0,right:0,bottom:0,
    background: "rgba(255,255,255,0.95)",
    display:    "none",
    zIndex:     10000,
  });
  dropZone.textContent = "📂 Déposez vos fichiers…";
  document.body.appendChild(dropZone);

  // — Sidebar toggles & prompt clicks
  toggleHistory.addEventListener("click", () => historyPanel.classList.toggle("open"));
  togglePrompt .addEventListener("click", () => promptPanel .classList.toggle("open"));
  prompts.forEach(p => p.onclick = () => {
    userInput.value = p.textContent;
    promptPanel.classList.remove("open");
    userInput.focus();
  });

  // — Show/hide dropZone
  ["dragenter","dragover"].forEach(evt => {
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.display = "block";
      dropZone.style.opacity = "1";
    });
  });
  ["dragleave","drop"].forEach(evt => {
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.opacity = "0";
      setTimeout(() => dropZone.style.display = "none", 300);
    });
  });

  // — Handle file drop
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    pendingFiles.push(...e.dataTransfer.files);
    filePreview.style.display = "block";
    filePreview.innerHTML = pendingFiles
      .map((f,i) => `📎 PJ ${i+1}: ${f.name}`)
      .join("<br>") + "<br><i>Rédigez la consigne puis ▶</i>";
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
    if (!text && pendingFiles.length===0) return;
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
        pendingFiles.forEach(f => fd.append("file", f));
        fd.append("question", text);
        fd.append("user_id", user_id);
        fd.append("chat_id", chat_id);
        fd.append("type", text ? "filesWithText" : "files");

        // debug FormData
        for (let [k,v] of fd.entries()) console.log("📦", k, v);

        res = await fetch(webhookURL, { method:"POST", body:fd });
        const raw = await res.text();
        console.log("⬅️ raw resp", raw);
        data = JSON.parse(raw);

        pendingFiles = [];
        filePreview.style.display = "none";
        filePreview.innerHTML = "";
      } else {
        res = await fetch(webhookURL, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({question:text, user_id, chat_id, type:"text"})
        });
        data = await res.json();
      }

      loader.remove();
      appendMessage(data.output || "Pas de réponse", "bot-message");
      loadHistory();
    } catch (e) {
      loader.remove();
      appendMessage("❌ Erreur de connexion", "bot-message");
      console.error(e);
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
