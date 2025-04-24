document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";

  const wrapper = document.createElement("div");
  wrapper.id = "chat-wrapper";
  wrapper.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
      * { font-family: 'Inter', sans-serif; }

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
        right: 10px;
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
        z-index: 10000;
      }
    </style>

    <button id="resetBtn">♻️ Nouveau chat</button>
    <div id="chat"></div>
    <div id="input-area">
      <input type="text" id="userInput" placeholder="Pose ta question ici..." />
      <button id="sendBtn">▶</button>
    </div>

    <div class="floating-toggle" id="togglePrompt">💡</div>
    <div class="dynamic-sidebar" id="promptPanel">
      <div class="sidebar-header">💡 Idées de prompts</div>
      <div class="sidebar-content">
        <!-- Ajoute ici tous les <details> avec prompts -->
        <details>
          <summary>▶ Opérations logistiques</summary>
          <div class="prompt" draggable="true">Tu peux m’optimiser un itinéraire express entre Shanghai et Anvers ?</div>
        </details>
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
  const toggleBtn = wrapper.querySelector("#togglePrompt");
  const sidebar = wrapper.querySelector("#promptPanel");
  const prompts = wrapper.querySelectorAll(".prompt");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  prompts.forEach(prompt => {
    prompt.addEventListener("click", () => {
      userInput.value = prompt.textContent;
      userInput.focus();
      sidebar.classList.remove("open");
    });
    prompt.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", prompt.textContent);
    });
  });

  userInput.addEventListener("dragover", e => e.preventDefault());
  userInput.addEventListener("drop", e => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text");
    userInput.value = text;
    sidebar.classList.remove("open");
  });

  resetBtn.addEventListener("click", () => {
    chat.innerHTML = "";
    appendMessage("Que puis-je faire pour vous aujourd'hui ?", "bot-message");
  });

  function appendMessage(message, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerHTML = message;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
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
        body: JSON.stringify({ question: text }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      loader.remove();
      appendMessage(data.output || "Pas de réponse", "bot-message");
    } catch (err) {
      loader.remove();
      appendMessage("Erreur de connexion", "bot-message");
    }
  });

  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });
});
