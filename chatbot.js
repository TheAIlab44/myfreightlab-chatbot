document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";

  const wrapper = document.createElement("div");
  wrapper.id = "chat-wrapper";
  wrapper.innerHTML = `

    <style>
      /* Styles du chatbot + prompts */
      #chat {
        flex: 1;
        overflow-y: auto;
        padding: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background-color: #f9fbfc;
        align-items: center;
      }
      .message {
        padding: 12px 16px;
        border-radius: 18px;
        max-width: 80%;
        font-size: 15px;
        white-space: normal;
        line-height: 1.5;
        box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        animation: fadeInUp 0.6s ease-out both;
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
      #sendBtn {
        width: 46px;
        height: 46px;
        background-color: #0077c8;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
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
        font-size: 14px;
      }

      .prompt:hover {
        background: #e6f0ff;
      }
    </style>

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
  const toggleBtn = wrapper.querySelector('#togglePrompt');
  const sidebar = wrapper.querySelector('#promptPanel');
  const prompts = wrapper.querySelectorAll('.prompt');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  prompts.forEach(prompt => {
    prompt.addEventListener('click', () => {
      userInput.value = prompt.textContent;
      userInput.focus();
    });

    prompt.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', prompt.textContent);
    });
  });

  userInput.addEventListener("dragover", e => e.preventDefault());

  userInput.addEventListener("drop", e => {
    e.preventDefault();
    userInput.value = e.dataTransfer.getData("text");

    const enterEvent = new KeyboardEvent("keypress", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      keyCode: 13
    });
    userInput.dispatchEvent(enterEvent);
  });

  function formatTextToHTML(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\s*[-•]\s/gm, "• ")
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");
  }

  function appendMessage(message, className, isHTML = false) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = isHTML ? message : formatTextToHTML(message);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function appendLoading() {
    const loader = document.createElement("div");
    loader.className = "message bot-message loading loading-dots";
    loader.innerText = "Je réfléchis";
    chat.appendChild(loader);
    chat.scrollTop = chat.scrollHeight;
    return loader;
  }

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

      const finalReply = (data.output || "Je n'ai pas compris la réponse 🙇");
      appendMessage(finalReply, "bot-message");

    } catch (error) {
      loader.remove();
      appendMessage("Erreur de connexion au serveur", "bot-message");
    }
  });

  userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendBtn.click();
  });
});
