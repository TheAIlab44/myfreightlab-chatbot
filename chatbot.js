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

  // Le code HTML avec style et structure sera ajouté ici (tronqué pour la lisibilité)
  // ...

  const container = document.getElementById("chat-container");
  if (!container) return;
  container.appendChild(wrapper);

  const chat = wrapper.querySelector("#chat");
  const userInput = wrapper.querySelector("#userInput");
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  dropZone.style.cssText = `
    border: 2px dashed #ccc;
    padding: 40px;
    text-align: center;
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    font-size: 18px;
    z-index: 10000;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;
  document.body.appendChild(dropZone);

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

  // ... (logique fetchUserMessages, getLastMessages, loadChatHistory)

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

  function loadsessionIDfromlocalstorage() {
    let sessionID = localStorage.getItem("chat_id");
    if (!sessionID) sessionID = generateSessionID();
    return sessionID;
  }

  function savesessionIDtolocalStorage() {
    if (!localStorage.getItem("chat_id")) {
      localStorage.setItem("chat_id", generateSessionID());
    }
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
    } catch (err) {
      loader.remove();
      appendMessage("Erreur de connexion", "bot-message");
    }
  });

  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendBtn.click();
  });

  ["dragenter", "dragover"].forEach(event => {
    document.addEventListener(event, e => {
      e.preventDefault();
      dropZone.style.opacity = "1";
      dropZone.style.pointerEvents = "auto";
    });
  });

  ["dragleave", "drop"].forEach(event => {
    document.addEventListener(event, e => {
      e.preventDefault();
      dropZone.style.opacity = "0";
      dropZone.style.pointerEvents = "none";
    });
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user_id);
    formData.append("chat_id", chat_id);

    appendMessage(`📎 Fichier reçu : ${file.name}`, "user-message");

    try {
      const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook/upload-file", {
        method: "POST",
        body: formData
      });
      const result = await res.json();
      appendMessage(result.output || "✅ Fichier traité avec succès !", "bot-message");
    } catch (err) {
      console.error(err);
      appendMessage("❌ Erreur lors de l’envoi du fichier", "bot-message");
    }
  });

  function generateSessionID() {
    return `${user_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
});
