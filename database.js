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
      }

      .explorer-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        align-items: flex-start;
      }

      .add-folder {
        font-size: 32px;
        color: green;
        cursor: pointer;
        width: 80px;
        height: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 3px dotted green;
        border-radius: 50%;
        background-color: #f0fff0;
        box-shadow: 0 2px 4px rgba(0, 128, 0, 0.1);
        user-select: none;
        transition: background 0.2s;
      }

      .add-folder:hover {
        background-color: #ccffcc;
      }

      .folder-item {
        width: 90px;
        height: 120px;
        background: white;
        border: 1px solid #c0c0c0;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        cursor: pointer;
        padding: 8px;
        position: relative;
      }

      .folder-item .emoji {
        font-size: 36px;
        margin-bottom: 4px;
      }

      .folder-item .name {
        font-size: 14px;
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

    <div class="explorer">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  let folderCount = 1;
  const folderContainer = wrapper.querySelector("#folder-container");
  const createBtn = wrapper.querySelector("#create-folder");

  function closeMenus() {
    document.querySelectorAll(".context-menu").forEach(menu => menu.remove());
  }

  createBtn.addEventListener("click", () => {
    const folder = document.createElement("div");
    folder.className = "folder-item";
    folder.setAttribute("draggable", "true");

    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = "📁";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = `Dossier ${folderCount++}`;
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
      renameOption.textContent = "✏️ Renommer";
      renameOption.onclick = () => {
        name.contentEditable = true;
        name.focus();
        menu.remove();
      };

      const deleteOption = document.createElement("div");
      deleteOption.textContent = "🗑️ Supprimer";
      deleteOption.onclick = () => {
        folder.remove();
      };

      menu.appendChild(renameOption);
      menu.appendChild(deleteOption);

      folder.appendChild(menu);

      // Position the menu below the 3-dot button
      const rect = menuBtn.getBoundingClientRect();
      menu.style.top = `${menuBtn.offsetTop + 20}px`;
      menu.style.right = `6px`;
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

    // Drag & Drop logic
    folder.addEventListener("dragstart", () => {
      folder.classList.add("dragging");
    });

    folder.addEventListener("dragend", () => {
      folder.classList.remove("dragging");
    });
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
