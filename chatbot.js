// chatbot.js

document.addEventListener("DOMContentLoaded", function () {
  const chatContainer = document.getElementById("chat-container");

  if (!chatContainer) return;

  const chatBox = document.createElement("div");
  chatBox.style.border = "1px solid #ccc";
  chatBox.style.padding = "10px";
  chatBox.style.maxWidth = "300px";
  chatBox.style.margin = "0 auto";
  chatBox.style.fontFamily = "Arial, sans-serif";
  chatBox.innerHTML = `
    <p><strong>Bot :</strong> Bonjour ! Comment puis-je vous aider ?</p>
    <input type="text" id="user-input" placeholder="Écris ici..." style="width: 100%; padding: 5px;" />
  `;

  chatContainer.appendChild(chatBox);

  const input = chatBox.querySelector("#user-input");
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const userText = input.value;
      const userMessage = document.createElement("p");
      userMessage.innerHTML = `<strong>Vous :</strong> ${userText}`;
      chatBox.insertBefore(userMessage, input);
      input.value = "";

      // Réponse basique
      const botReply = document.createElement("p");
      botReply.innerHTML = `<strong>Bot :</strong> Merci pour votre message !`;
      chatBox.insertBefore(botReply, input);
    }
  });
});
