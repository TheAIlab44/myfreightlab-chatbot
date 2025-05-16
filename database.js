document.addEventListener("DOMContentLoaded", async () => {
  const bucketName = "myfreightlab";
  const supabaseUrl = "https://asjqmzgcajcizutrldqw.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzanFtemdjYWpjaXp1dHJsZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTY1MjAsImV4cCI6MjA1NjU5MjUyMH0.8AGX4EI6F88TYrs1aunsFuwLWJfj3Zf_SJW1Y1tiTZc"; // remplace par ta vraie clé
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  const supabase = createClient(supabaseUrl, supabaseKey);

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
    </style>

    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const folderContainer = wrapper.querySelector("#folder-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");
  let folderCount = 1;

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

 // Valeurs par défaut pour test (à remplacer selon ton auth plus tard)
let user_id = localStorage.getItem("user_id") || "demo_user";
let chat_id = localStorage.getItem("chat_id") || "demo_chat";
let currentFolderId = "root";

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
    const path = `${user_id}/${currentFolderId}/${file.name}`;
    const { data: uploaded, error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      console.error("❌ Upload Supabase échoué :", uploadError.message);
      alert("Erreur d'upload : " + uploadError.message);
      continue;
    }

    const { data: publicURLData } = supabase.storage.from(bucketName).getPublicUrl(path);
    const fileUrl = publicURLData.publicUrl;

    const formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("chat_id", chat_id);
    formData.append("file_name", file.name);
    formData.append("file_url", fileUrl);
    formData.append("folder_id", currentFolderId);
    formData.append("file", file);


    try {
      const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook-test/34e003f9-99db-4b40-a513-9304c01a1182", {
        method: "POST",
        body: formData
      });

      const result = await res.json();
      console.log("🧠 Webhook réponse :", result);
      alert("✅ Fichier vectorisé avec succès !");
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


