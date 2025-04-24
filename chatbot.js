document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";

  const wrapper = document.createElement("div");
  wrapper.id = "chat-wrapper";
  wrapper.innerHTML = `
    <style>
      #chat-wrapper {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        height: 90vh;
        width: 80vw;
        margin: 0 auto;
        background: #f9fbfc;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #d3dce6;
        font-family: 'Inter', sans-serif;
        position: relative;
      }

      #chat {
        flex: 1;
        overflow-y: auto;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 18px;
        background-color: #f9fbfc;
        align-items: center;
      }

      .message {
        padding: 18px 20px;
        border-radius: 18px;
        max-width: 80%;
        font-size: 16px;
        white-space: normal;
        line-height: 1.8;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        animation: fadeInUp 1s ease-out both;
        animation-delay: 0.2s;
      }

      .user-message {
        align-self: flex-start;
        background-color: #e0f2ff;
        color: #00497a;
        border-bottom-right-radius: 0;
      }

      .bot-message {
        align-self: flex-end;
        background-color: #ffffff;
        color: #222;
        border-bottom-left-radius: 0;
      }

      .loading-dots::after {
        content: "";
        display: inline-block;
        width: 1em;
        text-align: left;
        animation: dots 1.2s steps(4, end) infinite;
      }

      @keyframes dots {
        0%, 20% { content: ""; }
        40% { content: "."; }
        60% { content: ".."; }
        80%, 100% { content: "..."; }
      }

      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      #input-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid #e0e0e0;
        background-color: #fff;
        gap: 10px;
      }

      #userInput {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 15px;
        background-color: #fcfcfc;
        outline: none;
        font-family: inherit;
        transition: all 0.2s ease;
      }

      #userInput:focus {
        border-color: #0077c8;
        box-shadow: 0 0 0 2px rgba(0,119,200,0.15);
      }

      #sendBtn {
        width: 46px;
        height: 46px;
        background-color: #0077c8;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #sendBtn::before {
        content: "";
        display: inline-block;
        width: 0;
        height: 0;
        border-left: 10px solid white;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        transform: translateX(1px);
      }

      #sendBtn:hover {
        background-color: #005fa1;
      }

      #resetBtn {
        position: absolute;
        top: 16px;
        left: 24px;
        background: #fff;
        border: 1px solid #d3dce6;
        color: #0077c8;
        font-size: 13px;
        padding: 4px 10px;
        border-radius: 14px;
        font-weight: 500;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
      }

      #resetBtn:hover {
        background-color: #0077c8;
        color: white;
      }

      .dynamic-sidebar {
        position: fixed;
        top: 0;
        right: -300px;
        width: 300px;
        height: 100vh;
        background-color: #ffffff;
        border-left: 2px solid #ccc;
        box-shadow: -4px 0 10px rgba(0, 0, 0, 0.1);
        transition: right 0.3s ease-in-out;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: sans-serif;
      }

      .dynamic-sidebar.open {
        right: 0;
      }

      .sidebar-header {
        background-color: #0073e6;
        color: white;
        padding: 15px;
        font-weight: bold;
        font-size: 16px;
        text-align: center;
      }

      .sidebar-content {
        padding: 15px;
        overflow-y: auto;
        flex-grow: 1;
      }

      .prompt {
        background: #f4f4f4;
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 6px;
        cursor: grab;
        transition: background 0.2s;
        font-size: 14px;
        word-break: break-word;
      }

      .prompt:hover {
        background: #e6f0ff;
      }

      .floating-toggle {
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        background-color: #0073e6;
        color: white;
        padding: 10px;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        z-index: 10000;
        font-weight: bold;
        box-shadow: -2px 0 6px rgba(0,0,0,0.1);
      }
    </style>

    <button id="resetBtn" title="Nouveau chat">♻️ Nouveau chat</button>
    <div id="chat"></div>
    <div id="input-area">
      <input type="text" id="userInput" placeholder="Pose ta question ici..." />
      <button id="sendBtn"></button>
    </div>
    <div class="floating-toggle" id="togglePrompt">💬</div>
    <div class="dynamic-sidebar" id="promptPanel">
      <div class="sidebar-header">💡 Idées de prompts</div>
      <div class="sidebar-content">
        <div class="prompt" draggable="true">Optimiser les itinéraires vers l’Europe</div>
        <div class="prompt" draggable="true">Analyser les coûts de transport par saison</div>
        <div class="prompt" draggable="true">Anticiper les frais douaniers par pays</div>
        <div class="prompt" draggable="true">Calculer l’empreinte carbone d’un trajet</div>
      </div>
    </div>
  `;

  const container = document.getElementById("chat-container");
  if (!container) return;
  container.appendChild(wrapper);

  const chat = wrapper.querySelector("#chat");
  const userInput = wrapper.querySelector("#userInput");
  const sendBtn = wrapper.querySelector("#sendBtn");
  const resetBtn = wrapper.querySelector("#resetBtn");

  const toggleBtn = wrapper.querySelector('#togglePrompt');
  const sidebar = wrapper.querySelector('#promptPanel');
  const prompts = wrapper.querySelectorAll('.prompt');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  prompts.forEach(prompt => {
    prompt.addEventListener('click', () => {
      userInput.value = prompt.textContent;
      userInput.focus();
    });
    prompt.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', prompt.textContent);
    });
  });

  if (userInput) {
    userInput.addEventListener('dragover', e => e.preventDefault());
    userInput.addEventListener('drop', e => {
      e.preventDefault();
      const text = e.dataTransfer.getData('text');
      userInput.value = text;
      sendBtn.click(); // Envoi direct au drop
    });
  }

  function formatTextToHTML(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\s*[-•]\s/gm, "• ")
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");
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
    history.forEach(msg => {
      appendMessage(msg.content, msg.role === "user" ? "user-message" : "bot-message", true);
    });
  }

  function appendMessage(message, className, isHTML = false) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = isHTML ? message : formatTextToHTML(message);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    saveChatToLocalStorage();
  }

  function appendLoading() {
    const loader = document.createElement("div");
    loader.className = "message bot-message loading loading-dots";
    loader.innerText = "Je réfléchis";
    chat.appendChild(loader);
    chat.scrollTop = chat.scrollHeight;
    return loader;
  }

  resetBtn.addEventListener("click", () => {
    if (confirm("Souhaites-tu démarrer une nouvelle conversation ?")) {
      localStorage.removeItem("chatHistory");
      chat.innerHTML = "";
      appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
    }
  });

  loadChatFromLocalStorage();

  sendBtn.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, "user-message");
    userInput.value = "";

    const loader = appendLoading();

    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        body: JSON.stringify({ question: text }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      loader.remove();

      const friendlyReplies = [
        "Tu veux que je te détaille ça ? 😊",
        "Si tu veux un exemple concret, je peux t’en donner un !",
        "Dis-moi si tu veux approfondir un point 🔍",
        "On continue ensemble sur ce sujet ?"
      ];
      const randomReply = friendlyReplies[Math.floor(Math.random() * friendlyReplies.length)];
      const finalReply = (data.output || "Je n'ai pas compris la réponse 🙇") + "\n\n" + randomReply;

      appendMessage(finalReply, "bot-message");

    } catch (error) {
      loader.remove();
      appendMessage("Erreur de connexion au serveur", "bot-message");
    }
  });

  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });
});
