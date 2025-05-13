<script type="module">
  document.addEventListener("DOMContentLoaded", () => {
    const explorer = document.createElement("div");
    explorer.innerHTML = `
      <style>
        .explorer {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-family: "Segoe UI", sans-serif;
          padding: 1rem;
        }
        .folder {
          width: 100px;
          text-align: center;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #ccc;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 10px 5px;
          position: relative;
          cursor: pointer;
        }
        .folder .label {
          margin-top: 5px;
          font-size: 14px;
          word-break: break-word;
        }
        .folder .menu {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 13px;
          display: none;
          flex-direction: column;
          z-index: 10;
        }
        .folder .menu button {
          background: none;
          border: none;
          padding: 4px 8px;
          text-align: left;
          cursor: pointer;
        }
        .folder .menu button:hover {
          background: #eee;
        }
        .folder .dots {
          position: absolute;
          top: 4px;
          right: 4px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }
        .create-folder {
          font-size: 32px;
          color: green;
          background: none;
          border: none;
          cursor: pointer;
        }
      </style>

      <button class="create-folder" title="Nouveau dossier">＋</button>
      <div class="explorer" id="folder-container"></div>
    `;

    document.body.appendChild(explorer);

    const folderContainer = explorer.querySelector("#folder-container");
    const createButton = explorer.querySelector(".create-folder");

    let folders = JSON.parse(localStorage.getItem("myFolders")) || [];
    let counter = folders.length + 1;

    function saveAndRenderFolders() {
      localStorage.setItem("myFolders", JSON.stringify(folders));
      renderFolders();
    }

    function renderFolders() {
      folderContainer.innerHTML = "";
      folders.forEach((folder, index) => {
        const div = document.createElement("div");
        div.className = "folder";
        div.innerHTML = `
          📁
          <div class="label">${folder}</div>
          <button class="dots">⋮</button>
          <div class="menu">
            <button data-action="rename">Renommer</button>
            <button data-action="delete">Supprimer</button>
          </div>
        `;

        const dots = div.querySelector(".dots");
        const menu = div.querySelector(".menu");

        dots.addEventListener("click", e => {
          e.stopPropagation();
          document.querySelectorAll(".menu").forEach(m => m.style.display = "none");
          menu.style.display = "flex";
        });

        document.addEventListener("click", () => menu.style.display = "none");

        menu.querySelector('[data-action="rename"]').addEventListener("click", () => {
          const newName = prompt("Nouveau nom :", folders[index]);
          if (newName) {
            folders[index] = newName;
            saveAndRenderFolders();
          }
        });

        menu.querySelector('[data-action="delete"]').addEventListener("click", () => {
          folders.splice(index, 1);
          saveAndRenderFolders();
        });

        folderContainer.appendChild(div);
      });
    }

    createButton.addEventListener("click", () => {
      folders.push(`Dossier ${counter++}`);
      saveAndRenderFolders();
    });

    renderFolders();
  });
</script>
