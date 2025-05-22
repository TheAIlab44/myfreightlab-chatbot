document.addEventListener("DOMContentLoaded", async () => { 
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
     .explorer {
        padding: 20px;
        font-family: "Segoe UI", sans-serif;
        min-height: calc(100vh - 100px);
        height: 100%;
        flex: 1;
        border: 2px dashed transparent;
        transition: background 0.3s, border-color 0.3s;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .explorer.dragover {
        border-color: #00aa00;
        background: linear-gradient(90deg, #f0fff0 0%, #eaffea 100%);
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
        background: white;
        border: 2px dashed green;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: green;
        box-shadow: 0 2px 4px rgba(0, 128, 0, 0.1);
        cursor: pointer;
        transition: background 0.2s;
      }

      .add-folder:hover {
        background-color: #f0fff0;
      }

      .folder-item {
        width: 90px;
        height: 110px;
        background: white;
        border: 1px solid #c0c0c0;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        cursor: pointer;
        padding: 6px;
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
      /* Styles pour les fichiers uploadés */
      .uploaded-files {
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      }
      .file-item {
        width: 90px;
        height: 110px;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        padding: 6px;
      }
      .file-item .emoji {
        font-size: 32px;
        margin-bottom: 4px;
      }
      .file-item .name {
        font-size: 12px;
        word-break: break-all;
      }
    </style>

    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
      <!-- Nouvelle zone pour les fichiers vectorisés -->
      <div class="uploaded-files" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const folderContainer = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");
  let folderCount = 1;
  
  /**
   * Crée et injecte un élément visuel pour un fichier.
   * @param {string} name — nom du fichier à afficher
   */
  function renderFileItem(name) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";

    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = "📄";

    const nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.textContent = name || "Sans nom";

    fileItem.appendChild(emoji);
    fileItem.appendChild(nameDiv);
    uploadedContainer.appendChild(fileItem);
  }

  /**
   * Va chercher tous les fichiers de l'utilisateur et les affiche.
   */
  async function loadUserFiles() {
    try {
      const res = await fetch(`${filesWebhookUrl}?user_id=${encodeURIComponent(user_id)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const files = await res.json();

      // On vide d'abord l'ancien contenu (au cas où)
      uploadedContainer.innerHTML = "";

      files.forEach(item => {
        // file_name peut être null : on utilise le file_id comme fallback
        const displayName = item.file_name || item.file_id;
        renderFileItem(displayName);
      });
    } catch (err) {
      console.error("❌ Impossible de charger les fichiers :", err);
      // Vous pouvez afficher un message utilisateur ici
    }
  }

  // Charger les fichiers au démarrage
  await loadUserFiles();
  

// Fermer tous les menus contextuels
  function closeMenus() {
    document.querySelectorAll(".context-menu").forEach(menu => menu.remove());
  }

  // Écouteur global pour fermer les menus quand on clique ailleurs
  document.addEventListener("click", closeMenus);

  // Créer un dossier
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

    folder.addEventListener("dragstart", () => folder.classList.add("dragging"));
    folder.addEventListener("dragend", () => folder.classList.remove("dragging"));
  }

  // Création via le bouton "+"
  createBtn.addEventListener("click", () => createFolder());

  // Drag & drop dossier (réorganisation)
  folderContainer.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = folderContainer.querySelector(".dragging");
    const afterElement = getDragAfterElement(folderContainer, e.clientX);
    if (!afterElement) {
      folderContainer.appendChild(dragging);
    } else {
      folderContainer.insertBefore(dragging, afterElement);
    }
  });

let currentFolderId = "root";
let user_id = localStorage.getItem("user_id");

// Rendre les dossiers cliquables pour changer de currentFolderId
document.addEventListener("click", (e) => {
  const folder = e.target.closest(".folder-item");
  if (folder) {
    const folderName = folder.querySelector(".name").textContent.trim();
    currentFolderId = folderName.replace(/\s+/g, "_").toLowerCase();
    console.log("📁 Dossier sélectionné :", currentFolderId);
    alert(`📁 Dossier sélectionné : ${folderName}`);
  }
});

  // Drag & drop fichier (upload dans la drop zone)
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user_id);

      try {
        const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182", {
          method: "POST",
          body: formData
        });
        const result = await res.json();
        console.log("🧠 Webhook réponse :", result);
        alert("✅ Fichier vectorisé avec succès !");

        // **Ajout de l'icône + nom du fichier dans la zone**
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";

        const emoji = document.createElement("div");
        emoji.className = "emoji";
        emoji.textContent = "📄"; // ou autre icône selon le type

        const nameDiv = document.createElement("div");
        nameDiv.className = "name";
        nameDiv.textContent = file.name;

        fileItem.appendChild(emoji);
        fileItem.appendChild(nameDiv);
        uploadedContainer.appendChild(fileItem);

      } catch (err) {
        console.error("❌ Webhook échoué :", err);
        alert("Erreur lors de l’envoi au webhook !");
      }
    }
  });


// Fonction utilitaire pour le placement en drag
function getDragAfterElement(container, x) {
  const elements = [...container.querySelectorAll(".folder-item:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

});
