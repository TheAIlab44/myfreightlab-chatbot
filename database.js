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
        font-size: 28px;
        color: green;
        cursor: pointer;
        width: 60px;
        height: 90px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px dashed green;
        border-radius: 10px;
        user-select: none;
      }

      .folder-item {
        width: 100px;
        height: 90px;
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
        padding: 5px;
        position: relative;
      }

      .folder-actions {
        display: flex;
        gap: 5px;
        font-size: 12px;
        justify-content: center;
        margin-top: 4px;
      }

      .folder-actions span {
        cursor: pointer;
      }

      .folder-actions span:hover {
        color: red;
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

    const name = document.createElement("div");
    name.textContent = `📁 Dossier ${folderCount++}`;
    name.contentEditable = false;

    name.addEventListener("dblclick", () => {
      name.contentEditable = true;
      name.focus();
    });

    name.addEventListener("blur", () => {
      name.contentEditable = false;
    });

    const actions = document.createElement("div");
    actions.className = "folder-actions";

    const renameBtn = document.createElement("span");
    renameBtn.textContent = "✏️";
    renameBtn.title = "Renommer";
    renameBtn.onclick = () => {
      name.contentEditable = true;
      name.focus();
    };

    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Supprimer";
    deleteBtn.onclick = () => folder.remove();

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    folder.appendChild(name);
    folder.appendChild(actions);
    folderContainer.appendChild(folder);

    folder.addEventListener("dragstart", () => folder.classList.add("dragging"));
    folder.addEventListener("dragend", () => folder.classList.remove("dragging"));
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
