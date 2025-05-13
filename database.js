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
        border: 3px solid green;
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
        height: 100px;
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

    name.addEventListener("dblclick", () => {
      name.contentEditable = true;
      name.focus();
    });

    name.addEventListener("blur", () => {
      name.contentEditable = false;
    });

    folder.appendChild(emoji);
    folder.appendChild(name);
    folderContainer.appendChild(folder);

    folder.addEventListener("dragstart", () => {
      folder.classList.add("dragging");
    });

    folder.addEventListener("dragend", () => {
      folder.classList.remove("dragging");
    });
  });

  // ✅ Drag & Drop global
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

  // ✅ Fonction utilitaire (hors du clic)
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
