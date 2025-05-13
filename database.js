<script type="module">
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      .explorer {
        padding: 20px;
        background: #f5f7fa;
        border-radius: 10px;
        border: 1px solid #ccc;
        font-family: "Segoe UI", sans-serif;
      }

      .explorer-toolbar {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
      }

      #create-folder {
        background: none;
        border: none;
        font-size: 24px;
        color: green;
        cursor: pointer;
        padding: 0;
        margin: 0;
      }

      .explorer-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
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

      .folder-item:hover {
        background: #eef;
        border-color: #339;
      }

      .item-title {
        margin-top: 5px;
      }

      .menu-button {
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
      }

      .context-menu {
        position: absolute;
        top: 25px;
        right: 5px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        display: none;
        flex-direction: column;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10;
      }

      .context-menu button {
        background: none;
        border: none;
        padding: 8px 12px;
        cursor: pointer;
        text-align: left;
      }

      .context-menu button:hover {
        background: #f0f0f0;
      }
    </style>

    <div class="explorer">
      <div class="explorer-toolbar">
        <button id="create-folder">➕</button>
      </div>
      <div class="explorer-grid" id="folder-container">
        <!-- Dossiers s'empilent ici -->
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const folderContainer = wrapper.querySelector("#folder-container");
  const createBtn = wrapper.querySelector("#create-folder");

  let folderCount = 1;

  function createFolder(name = `Dossier ${folderCount++}`) {
    const folder = document.createElement("div");
    folder.className = "folder-item";
    folder.innerHTML = `
      <div>📁</div>
      <div class="item-title" contenteditable="false">${name}</div>
      <button class="menu-button">⋮</button>
      <div class="context-menu">
        <button class="rename">Renommer</button>
        <button class="delete">Supprimer</button>
      </div>
    `;

    const menuBtn = folder.querySelector(".menu-button");
    const menu = folder.querySelector(".context-menu");
    const renameBtn = folder.querySelector(".rename");
    const deleteBtn = folder.querySelector(".delete");
    const title = folder.querySelector(".item-title");

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", () => {
      menu.style.display = "none";
    });

    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      title.contentEditable = true;
      title.focus();
      menu.style.display = "none";
    });

    title.addEventListener("blur", () => {
      title.contentEditable = false;
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      folder.remove();
    });

    folderContainer.appendChild(folder);
  }

  createBtn.addEventListener("click", () => {
    createFolder();
  });
});
</script>
