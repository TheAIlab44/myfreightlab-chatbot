document.addEventListener("DOMContentLoaded", async () => {
  const bucketName = "myfreightlab";
  const supabaseUrl = "https://asjqmzgcajcizutrldqw.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  const supabase = createClient(supabaseUrl, supabaseKey);
  // ⚠️ À remplacer dynamiquement par tes vraies valeurs selon ta logique de session
let user_id = localStorage.getItem("user_id") || "demo_user";
let chat_id = localStorage.getItem("chat_id") || "demo_chat";
let currentFolderId = "root"; // peut être modifié quand un dossier est cliqué


  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      .explorer {
        padding: 20px;
        font-family: "Segoe UI", sans-serif;
        min-height: calc(100vh - 100px);
        transition: background 0.3s;
        box-sizing: border-box;
      }

      .explorer.dragover {
        background: #f6fff6;
        outline: 2px dashed #00aa00;
      }

      .explorer-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        align-items: flex-start;
      }

      .add-folder {
        width: 90px;
        height: 110px;
        background: transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 34px;
        color: green;
        cursor: pointer;
      }

      .folder-item {
        width: 90px;
        height: 110px;
        background: transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 14px;
        cursor: pointer;
        position: relative;
      }

      .folder-item .emoji {
        font-size: 34px;
        margin-bottom: 2px;
      }

      .folder-item .name {
        font-size: 13px;
        line-height: 1.2;
        word-break: break-word;
      }

      .menu-button {
        position: absolute;
        top: 6px;
        right: 6px;
        font-size: 18px;
        cursor: pointer;
      }

      .context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        width: 100px;
      }

      .context-menu div {
        padding: 6px 12px;
        cursor: pointer;
      }

      .context-menu div:hover {
        background-color: #f0f0f0;
      }

      .dragging {
        opacity: 0.5;
      }
    </style>

    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  let folderCount = 1;
  const folderContainer = wrapper.querySelector("#folder-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");

  function closeMenus() {
    document.querySelectorAll(".context-menu").forEach(menu => menu.remove());
  }

  function createFolder(nameText = `Dossier ${folderCount++}`) {
    const folder = document.createElement("div");
    folder.className = "folder-item";
    folder.setAttribute("draggable", "true");

    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = "📁";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = nameText;
    name.contentEditable = false;

    const menuBtn = document.createElement("div");
    menuBtn.className = "menu-button";
    menuBtn.textContent = "⋮";

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMenus();

      const menu = document.createElement("div");
      menu.className = "context-menu";

      const renameOption = document.createElement("div");
      renameOption.textContent = "Renommer";
      renameOption.onclick = () => {
        name.contentEditable = true;
        name.focus();
        menu.remove();
      };

      const deleteOption = document.createElement("div");
      deleteOption.textContent = "Supprimer";
      deleteOption.onclick = () => folder.remove();

      menu.appendChild(renameOption);
      menu.appendChild(deleteOption);
      folder.appendChild(menu);
    });

    document.addEventListener("click", closeMenus);

    name.addEventListener("dblclick", () => {
      name.contentEditable = true;
      name.focus();
    });

    name.addEventListener("blur", () => {
      name.contentEditable = false;
    });

    folder.appendChild(emoji);
    folder.appendChild(name);
    folder.appendChild(menuBtn);
    folderContainer.appendChild(folder);

    folder.addEventListener("dragstart", () => {
      folder.classList.add("dragging");
    });

    folder.addEventListener("dragend", () => {
      folder.classList.remove("dragging");
    });
  }

  createBtn.addEventListener("click", () => {
    const folderName = prompt("Nom du nouveau dossier :");
    if (folderName) createFolder(folderName);
  });

  // 🎯 Drag & Drop pour la zone de fichier
let dragCounter = 0;

["dragenter", "dragover"].forEach(eventType => {
  document.addEventListener(eventType, e => {
    e.preventDefault();
    dragCounter++;
    dropZone.style.display = "block";
    dropZone.style.opacity = "1";
    dropZone.style.pointerEvents = "all";
  });
});

["dragleave"].forEach(eventType => {
  document.addEventListener(eventType, e => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dropZone.style.opacity = "0";
      dropZone.style.pointerEvents = "none";
      dropZone.style.display = "none";
    }
  });
});

document.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0; // reset
  dropZone.style.opacity = "0";
  dropZone.style.pointerEvents = "none";
  dropZone.style.display = "none";
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.style.opacity = "0";
  dropZone.style.pointerEvents = "none";
  dropZone.style.display = "none";

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const folderId = currentFolderId || "root"; // ← à adapter si tu gères les dossiers cliqués

  // 1. Upload dans Supabase Storage
  const path = `${user_id}/${folderId}/${file.name}`;
  const { data, error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("❌ Erreur upload Supabase :", error.message);
    appendMessage("❌ Upload échoué", "bot-message");
    return;
  }

  // 2. URL publique
  const { data: publicURLData } = supabase.storage.from(bucketName).getPublicUrl(path);
  const fileUrl = publicURLData.publicUrl;

  // 3. Envoi au webhook N8N
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("chat_id", chat_id);
  formData.append("file_name", file.name);
  formData.append("file_url", fileUrl);
  formData.append("folder_id", folderId);

  appendMessage(`📎 Fichier reçu : ${file.name}`, "user-message");

  try {
    const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook-test/34e003f9-99db-4b40-a513-9304c01a1182", {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    appendMessage(result.output || "✅ Fichier vectorisé !", "bot-message");

    // (optionnel) Affichage dans l’UI
    // addFileToUI(file.name, fileUrl);
  } catch (err) {
    console.error(err);
    appendMessage("❌ Erreur lors de l’envoi au webhook", "bot-message");
  }
});


  
  function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll(".folder-item:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
});
