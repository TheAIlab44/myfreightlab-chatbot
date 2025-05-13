<script type="module">
document.addEventListener("DOMContentLoaded", () => {
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

      .folder-item {
        width: 100px;
        height: 90px;
        background: white;
        border: 1px solid #c0c0c0;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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

      #add-folder {
        font-size: 32px;
        color: green;
        cursor: pointer;
        user-select: none;
        margin-right: 15px;
      }

      .folder-name {
        margin-top: 5px;
        font-size: 13px;
        text-align: center;
      }
    </style>

    <div class="explorer">
      <div class="explorer-grid" id="folder-container">
        <div id="add-folder">➕</div>
        <!-- Dossiers générés -->
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  let folderCount = 1;
  const folderContainer = wrapper.querySelector("#folder-container");
  const addBtn = wrapper.querySelector("#add-folder");

  addBtn.addEventListener("click", () => {
    const folder = document.createElement("div");
    folder.className = "folder-item";
    folder.innerHTML = `
      📁
      <div class="folder-name">Dossier ${folderCount++}</div>
    `;
    folderContainer.appendChild(folder);
  });
});
</script>
