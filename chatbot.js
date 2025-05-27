// === ChatBot MyFreightLab avec historique, prompts, sidebar fermable, multi-PJ et édition avant envoi ===
document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  console.log("🧩 user_id récupéré :", user_id);

  // utilitaires session
  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  function savesessionIDtolocalStorage() {
    if (!localStorage.getItem("chat_id")) {
      localStorage.setItem("chat_id", generateSessionID());
    }
  }
  function loadsessionIDfromlocalstorage() {
    let sid = localStorage.getItem("chat_id");
    if (!sid) sid = generateSessionID();
    return sid;
  }
  savesessionIDtolocalStorage();
  let chat_id = loadsessionIDfromlocalstorage();

  // → construire l’UI
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

  document.getElementById("chat-container").appendChild(wrapper);

  // → sélectionner une seule fois
  const chat       = wrapper.querySelector("#chat");
  const userInput  = wrapper.querySelector("#userInput");
  const sendBtn    = wrapper.querySelector("#sendBtn");
  const resetBtn   = wrapper.querySelector("#resetBtn");
  const togglePromptBtn  = wrapper.querySelector("#togglePrompt");
  const toggleHistoryBtn = wrapper.querySelector("#toggleHistory");
  const promptPanel  = wrapper.querySelector("#promptPanel");
  const historyPanel = wrapper.querySelector("#historyPanel");
  const historyList  = wrapper.querySelector("#historyList");
  const prompts      = wrapper.querySelectorAll(".prompt");

  // → multi-PJ
  let pendingFiles = [];
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
  userInput.before(filePreview);

  // → dropZone global
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  Object.assign(dropZone.style, {
    border: "2px dashed #ccc",
    padding: "40px",
    textAlign: "center",
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(255,255,255,0.95)",
    display: "none",
    fontSize: "18px",
    zIndex: 10000,
    transition: "opacity 0.3s",
  });
  dropZone.innerText = "📂 Déposez vos fichiers ici";
  document.body.appendChild(dropZone);

  // → toggles & prompt-clic
  togglePromptBtn.addEventListener("click", () => promptPanel.classList.toggle("open"));
  toggleHistoryBtn.addEventListener("click", () => historyPanel.classList.toggle("open"));
  prompts.forEach(p => p.addEventListener("click", () => {
    userInput.value = p.textContent;
    userInput.focus();
    promptPanel.classList.remove("open");
  }));

  // → dragenter/over pour afficher dropZone
  ["dragenter","dragover"].forEach(evt =>
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.display = "block";
      dropZone.style.opacity = "1";
    })
  );
  // → dragleave/drop global pour masquer
  ["dragleave","drop"].forEach(evt =>
    document.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.style.opacity = "0";
      setTimeout(()=> dropZone.style.display = "none", 300);
    })
  );
  // → drop proprement dit
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(f => pendingFiles.push(f));
    filePreview.style.display = "block";
    filePreview.innerHTML = pendingFiles
      .map((f,i)=>`📎 PJ ${i+1} : ${f.name}`)
      .join("<br>") + `<br><i>Rédigez votre consigne puis ▶</i>`;
    dropZone.style.opacity = "0";
    setTimeout(()=> dropZone.style.display = "none", 300);
  });

  // — fetch & historique
  async function fetchUserMessages(userId) {
    try {
      const r=await fetch("https://myfreightlab.app.n8n.cloud/webhook/fetchmessagehistory", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user_id:userId})
      });
      if(!r.ok) throw new Error();
      return await r.json();
    } catch { return []; }
  }
  function getLastMessages(msgs) {
    const m=new Map();
    msgs.forEach(x=> {
      if(!m.has(x.session_id)|| x.id>m.get(x.session_id).id) m.set(x.session_id,x);
    });
    return Array.from(m.values())
      .sort((a,b)=>b.id-a.id)
      .map(m=> {
        const js=typeof m.message==="string"?JSON.parse(m.message):m.message;
        const tmp=document.createElement("div");
        tmp.innerHTML=js.content||"";
        const txt=tmp.textContent||"";
        return { session_id:m.session_id, preview:txt.slice(0,30)+(txt.length>30?"…":"") };
      });
  }
  function getSessionTitles(){
    return JSON.parse(localStorage.getItem("sessionTitles")||"{}");
  }
  function saveSessionTitles(t){ localStorage.setItem("sessionTitles",JSON.stringify(t)); }
  async function loadChatHistory(){
    const data=await fetchUserMessages(user_id);
    const previews=getLastMessages(data);
    const titles=getSessionTitles();
    previews.forEach(({session_id,preview})=>{
      if(!titles[session_id]) titles[session_id]=preview;
    });
    saveSessionTitles(titles);
    historyList.innerHTML="";
    previews.forEach(({session_id,preview})=>{
      const sessMsgs=data.filter(x=>x.session_id===session_id);
      const c=document.createElement("div");
      c.className="prompt";
      Object.assign(c.style,{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"});
      const tspan=document.createElement("span");
      tspan.textContent=titles[session_id];
      Object.assign(tspan.style,{flex:"1",cursor:"pointer"});
      const mb=document.createElement("span");
      mb.textContent="⋮"; mb.style.padding="0 8px"; mb.style.cursor="pointer";
      const menu=document.createElement("div");
      Object.assign(menu.style,{position:"absolute",top:"100%",right:"0",background:"white",border:"1px solid #ccc",borderRadius:"6px",boxShadow:"0 2px 6px rgba(0,0,0,0.1)",display:"none",zIndex:"999"});
      const ren=document.createElement("div"); ren.textContent="Renommer"; ren.style.padding="8px"; ren.style.cursor="pointer";
      ren.onclick=()=>{
        const nn=prompt("Nouveau nom:",tspan.textContent);
        if(nn){ tspan.textContent=nn; titles[session_id]=nn; saveSessionTitles(titles); }
        menu.style.display="none";
      };
      const del=document.createElement("div"); del.textContent="Supprimer"; del.style.padding="8px"; del.style.cursor="pointer";
      del.onclick=()=>c.remove();
      menu.append(ren,del);
      mb.onclick=e=>{ e.stopPropagation(); menu.style.display=menu.style.display==="block"?"none":"block"; };
      document.addEventListener("click",()=>menu.style.display="none");
      tspan.onclick=()=>{
        localStorage.setItem("chat_id",session_id);
        chat.innerHTML="";
        sessMsgs.forEach(m=>{
          const js=typeof m.message==="string"?JSON.parse(m.message):m.message;
          const d=document.createElement("div");
          d.className=`message ${js.type==="human"?"user-message":"bot-message"}`;
          d.innerHTML=js.content;
          chat.appendChild(d);
        });
        chat.scrollTop=0;
        historyPanel.classList.remove("open");
      };
      c.append(tspan,mb,menu);
      historyList.appendChild(c);
    });
  }

  // — affichage et stockage local
  function appendMessage(html,cls){
    const m=document.createElement("div");
    m.className=`message ${cls}`;
    m.innerHTML=html;
    const prevH=chat.scrollHeight;
    chat.appendChild(m);
    const newH=chat.scrollHeight;
    chat.scrollTop = prevH===0?newH:chat.scrollTop+(newH-prevH);
    saveChatToLocalStorage();
  }
  function saveChatToLocalStorage(){
    const arr=Array.from(chat.querySelectorAll(".message")).map(m=>({
      role: m.classList.contains("user-message")?"user":"bot",
      content: m.innerHTML
    }));
    localStorage.setItem("chatHistory",JSON.stringify(arr));
  }

  // — bouton reset
  resetBtn.addEventListener("click",()=>{
    localStorage.removeItem("chat_id");
    localStorage.removeItem("chatHistory");
    savesessionIDtolocalStorage();
    chat_id=loadsessionIDfromlocalstorage();
    chat.innerHTML="";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?","bot-message");
    loadChatHistory();
  });

sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();

  // 1) Si ni texte ni PJ, on ne fait rien
  if (!text && pendingFiles.length === 0) return;

  // 2) Afficher le message utilisateur
  if (text) appendMessage(text, "user-message");

  // 3) Afficher le loader
  const loader = document.createElement("div");
  loader.className = "message bot-message";
  loader.innerHTML = "Je réfléchis…";
  chat.appendChild(loader);
  chat.scrollTop = chat.scrollHeight;

  try {
    let res;
    // — envoi Messages + PJ
    if (pendingFiles.length > 0) {
      const fd = new FormData();
      pendingFiles.forEach(file => fd.append("file", file));
      fd.append("question", text);
      fd.append("user_id", user_id);
      fd.append("chat_id", chat_id);
      fd.append("type", text ? "filesWithText" : "files");

      res = await fetch(webhookURL, { method: "POST", body: fd });

      // Réinitialiser la liste de fichiers
      pendingFiles = [];
      filePreview.style.display = "none";
      filePreview.innerHTML = "";

    } else {
      // — envoi texte seul
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
    }

    // 4) Récupérer la réponse et l’afficher
    const data = await res.json();
    loader.remove();
    appendMessage(data.output || "Pas de réponse", "bot-message");
    loadChatHistory();

  } catch (err) {
    // 5) En cas d’erreur
    loader.remove();
    appendMessage("❌ Erreur de connexion", "bot-message");
    console.error(err);

  } finally {
    // 6) Toujours réinitialiser l’input
    userInput.value = "";
    userInput.focus();
  }
});

  // — Shift+↵ newline, ↵ send
  userInput.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){
      e.preventDefault(); sendBtn.click();
    }
  });

  // — initial load
  loadChatHistory();
  const stored=JSON.parse(localStorage.getItem("chatHistory")||"[]");
  stored.forEach(m=>appendMessage(m.content,m.role==="user"?"user-message":"bot-message"));
  chat.scrollTop=0;
});
