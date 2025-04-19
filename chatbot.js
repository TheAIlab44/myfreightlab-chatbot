// chatbot.js

document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";

  // Create wrapper
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
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #ccc;
      }

      #chat {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .message {
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 85%;
        line-height: 1.4;
        font-size: 15px;
        white-space: pre-line;
      }

      .user-message {
        align-self: flex-end;
        background-color: #e1ecf9;
      }

      .bot-message {
        align-self: flex-start;
        background-color: #f0f0f0;
      }

      #input-area {
        display: flex;
        padding: 12px;
        border-top: 1px solid #ddd;
        background-color: #fff;
      }

      #userInput {
        flex: 1;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 15px;
      }

      #sendBtn {
        margin-left: 12px;
        padding: 12px 20px;
        background-color: #00478a;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
      }

      .loading {
        font-style: italic;
        opacity: 0.6;
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

  function appendMessage(message, className) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    msg.innerText = message;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function appendLoading() {
    const loader = document.createElement("div");
    loader.className = "message bot-message loading";
    loader.innerText = "Rédaction en cours...";
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
        body: JSON.stringify({ message: text }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      loader.remove();
      appendMessage(data.reply || "Je n'ai pas compris la réponse 🤖", "bot-message");
    } catch (error) {
      loader.remove();
      appendMessage("Erreur de connexion au serveur", "bot-message");
    }
  });
});
