document.addEventListener("DOMContentLoaded", async () => {
  const bucketName = "myfreightlab";
  const supabaseUrl = "https://asjqmzgcajcizutrldqw.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  const supabase = createClient(supabaseUrl, supabaseKey);

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

  folderContainer.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = folderContainer.querySelector(".dragging");
    const afterElement = getDragAfterElement(folderContainer, e.clientX);
    if (afterElement == null) {
      folderContainer.appendChild(dragging);
    } else {
      folderContainer.insertBefore(dragging, afterElement);
    }
  });

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
      const filePath = `docs/${file.name}`;
      const { error } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
      if (error) {
        alert("Erreur d'upload : " + error.message);
      } else {
        alert("✅ Fichier ajouté !");
      }
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
