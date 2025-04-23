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
        height: 80vh;
        width: 100%;
        background: #f9fbfc;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #d3dce6;
        font-family: 'Inter', sans-serif;
      }

      #chat {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background-color: #f9fbfc;
      }

      .message {
        padding: 14px 18px;
        border-radius: 18px;
        max-width: 80%;
        font-size: 15px;
        white-space: pre-line;
        line-height: 1.5;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      }

      .user-message {
        align-self: flex-end;
        background-color: #e3f0ff;
        color: #003366;
        border-bottom-right-radius: 0;
      }

      .bot-message {
        align-self: flex-start;
        background-color: #ffffff;
        color: #333;
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

      #input-area {
        display: flex;
        padding: 12px;
        border-top: 1px solid #e0e0e0;
        background-color: #fff;
      }

      #userInput {
        flex: 1;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 10px;
        font-size: 15px;
        background-color: #fefefe;
        outline: none;
        transition: all 0.2s ease;
      }

      #userInput:focus {
        border-color: #0066cc;
        box-shadow: 0 0 0 2px rgba(0,102,204,0.15);
      }

      #sendBtn {
        margin-left: 12px;
        padding: 12px 20px;
        background-color: #00478a;
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      #sendBtn:hover {
        background-color: #0060b5;
      }
    </style>

    <div id="chat"></div>
    <div id="input-area">
      <input type="text" id="userInput" placeholder="Ex : Quel est le coût du fret maritime ?" />
      <button id="sendBtn">Envoyer</button>
    </div>
  `;

  const container = document.getElementById("chat-container");
  if (!container) return;
  container.appendChild(wrapper);

  const chat = wrapper.querySelector("#chat");
  const userInput = wrapper.querySelector("#userInput");
  const sendBtn = wrapper.querySelector("#sendBtn");

  function saveChatToLocalStorage() {
    const messages = Array.from(chat.querySelectorAll(".message")).map(msg => ({
      role: msg.classList.contains("user-message") ? "user" : "bot",
      content: msg.innerText
    }));
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }

  function loadChatFromLocalStorage() {
    const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    history.forEach(msg => {
      appendMessage(msg.content, msg.role === "user" ? "user-message" : "bot-message");
    });
  }

  function appendMessage(message, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerText = message;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    saveChatToLocalStorage();
  }

  function appendLoading() {
    const loader = document.createElement("div");
    loader.className = "message bot-message loading loading-dots";
    loader.innerText = "Je réféchis";
    chat.appendChild(loader);
    chat.scrollTop = chat.scrollHeight;
    return loader;
  }

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
      const finalReply = (data.output || "Je n'ai pas compris la réponse 🤖") + "\n\n" + randomReply;

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
