// == Explorateur de fichiers vectorisés avec dossiers et persistence ==

document.addEventListener("DOMContentLoaded", async () => {
  // ————— Paramètres & états —————
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";
  let folders = [];
  let files = [];
  let folderCount = 1;

  // ————— Helpers localStorage —————
  function saveFolders() { localStorage.setItem("myFolders", JSON.stringify(folders)); }
  function loadFolders() {
    const d = localStorage.getItem("myFolders");
    if (d) { try { folders = JSON.parse(d); } catch { folders = []; } }
  }
  function saveFiles() { localStorage.setItem("myFiles", JSON.stringify(files)); }
  function loadFiles() {
    const d = localStorage.getItem("myFiles");
    if (d) { try { files = JSON.parse(d); } catch { files = []; } }
  }

  // ————— Création du wrapper + CSS —————
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      body { margin:0; font-family:"Segoe UI",sans-serif; background:#f4f6fa; }
      .explorer { padding:20px; min-height:100vh; box-sizing:border-box; }
      .explorer-grid { display:flex; flex-wrap:wrap; gap:15px; }
      .add-folder, .folder-item, .file-item {
        width:100px; height:120px; border-radius:10px;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        cursor:pointer; transition:background 0.2s, box-shadow 0.2s; position:relative;
      }
      .add-folder { border:2px dashed #6c63ff; background:#fff; color:#6c63ff; font-size:32px; }
      .add-folder:hover { background:#f0f0ff; }
      .folder-item { background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .folder-item.dragover { border-color:#00aa00; background:#f0fff0; }
      .file-item { background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .emoji { font-size:36px; margin-bottom:6px; }
      .name { font-size:12px; text-align:center; word-break:break-all; }
      .menu-button { position:absolute; top:6px; right:6px; font-size:18px; }
      .context-menu { position:absolute; background:#fff; border:1px solid #ccc; border-radius:5px;
        box-shadow:0 2px 8px rgba(0,0,0,0.2); z-index:1000; width:100px; }
      .context-menu div { padding:6px 12px; cursor:pointer; }
      .context-menu div:hover { background:#f0f0f0; }
      .dragging { opacity:0.5; }
      .uploaded-files { display:flex; flex-wrap:wrap; gap:15px; margin-top:20px; }
    </style>
    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">＋</div>
      <//div>
      <div class="explorer-grid" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // ————— Refs DOM —————
  const folderContainer = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");

  // ————— Context menu helper —————
  function closeMenus() { document.querySelectorAll(".context-menu").forEach(m => m.remove()); }
  document.addEventListener("click", closeMenus);

  // ————— Rendu unifié —————
  function clearAndRender() {
    folderContainer.innerHTML = "";
    folderContainer.appendChild(createBtn);
    folders.forEach(f => renderFolderItem(f));
    uploadedContainer.innerHTML = "";
    files.filter(f => f.folderId === null).forEach(f => renderFileItem(f));
  }

  // ————— Ouvrir un dossier —————
  function openFolder(folderId) {
    folderContainer.style.display = "none";
    createBtn.style.display = "none";
    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.style.margin = "10px";
    back.addEventListener("click", () => {
      back.remove();
      folderContainer.style.display = "flex";
      createBtn.style.display = "flex";
      clearAndRender();
    });
    wrapper.prepend(back);
    uploadedContainer.innerHTML = "";
    files.filter(f => f.folderId === folderId).forEach(f => renderFileItem(f));
  }

  // ————— Rendu d’un dossier —————
  function renderFolderItem(folder) {
    const el = document.createElement("div");
    el.className = "folder-item";
    el.dataset.id = folder.id;
    el.draggable = true;
    el.innerHTML = `<div class="emoji">📁</div><div class="name">${folder.name}</div>`;

    // click pour ouvrir
    el.addEventListener("click", e => {
      if (!e.target.classList.contains("menu-button")) {
        openFolder(folder.id);
      }
    });

    // bouton contexte
    const btn = document.createElement("div");
    btn.className = "menu-button";
    btn.textContent = "⋮";
    el.appendChild(btn);

    // click pour entrer dans le dossier (sauf sur le bouton ⋮)
el.addEventListener("click", e => {
  if (!e.target.classList.contains("menu-button")) {
    openFolder(folder.id);
  }
});


    // drop files into folder
    el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
    el.addEventListener("drop", e => {
      e.preventDefault();
      el.classList.remove("dragover");
      const dragging = document.querySelector(".file-item.dragging");
      if (!dragging) return;
      const fid = dragging.dataset.id;
      files.find(x => x.id === fid).folderId = folder.id;
      saveFiles();
      clearAndRender();
    });

    // reorder folders
    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      const order = Array.from(folderContainer.querySelectorAll(".folder-item")).map(n => n.dataset.id);
      folders.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      saveFolders();
    });

    // menu contextuel dossier
    btn.addEventListener("click", e => {
      e.stopPropagation();
      closeMenus();
      const menu = document.createElement("div");
      menu.className = "context-menu";
      const ren = document.createElement("div");
      ren.textContent = "Renommer";
      ren.onclick = () => {
        const nm = prompt("Nom du dossier", folder.name);
        if (nm) { folder.name = nm; saveFolders(); clearAndRender(); }
      };
      const del = document.createElement("div");
      del.textContent = "Supprimer";
      del.onclick = () => {
        folders = folders.filter(x => x.id !== folder.id);
        files.forEach(f => { if (f.folderId === folder.id) f.folderId = null; });
        saveFolders(); saveFiles(); clearAndRender();
      };
      menu.append(ren, del);
      el.appendChild(menu);
    });

    folderContainer.appendChild(el);
  }

  // ————— Rendu d’un fichier —————
  function renderFileItem(file) {
    const el = document.createElement("div"); el.className = "file-item"; el.dataset.id = file.id; el.draggable = true;
    el.innerHTML = `<div class="emoji">📄</div><div class="name">${file.name}</div>`;
    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    const btn = document.createElement("div"); btn.className = "menu-button"; btn.textContent = "⋮";
    btn.addEventListener("click", e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement("div"); menu.className = "context-menu";
      const ren = document.createElement("div"); ren.textContent = "Renommer";
      ren.onclick = () => { const nm = prompt("Nom du fichier", file.name); if (nm) { file.name = nm; saveFiles(); clearAndRender(); }};
      const del = document.createElement("div"); del.textContent = "Supprimer";
      del.onclick = () => { files = files.filter(x => x.id !== file.id); saveFiles(); clearAndRender(); };
      menu.append(ren, del); el.appendChild(menu);
    }); el.appendChild(btn);
    uploadedContainer.appendChild(el);
  }

  // ————— Création de dossier —————
  createBtn.addEventListener("click", () => { const nm = prompt("Nom du dossier", `Dossier ${folders.length+1}`); if(!nm) return; const id = crypto.randomUUID(); folders.push({ id, name: nm }); saveFolders(); clearAndRender(); });

  // ————— Init + Webhook + Drop —————
  loadFolders(); loadFiles(); clearAndRender();
  async function loadUserFiles() { try { const fd = new FormData(); fd.append("user_id", user_id); const res = await fetch(filesWebhookUrl, { method: "POST", body: fd }); if (!res.ok) throw; const data = await res.json(); files = data.map(i => ({ id: i.file_id, name: i.file_name || i.file_id, folderId: null })); saveFiles(); clearAndRender(); } catch { clearAndRender(); }}
  await loadUserFiles();

  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", async e => { e.preventDefault(); dropZone.classList.remove("dragover"); for (const f of e.dataTransfer.files) { const fd = new FormData(); fd.append("file", f); fd.append("user_id", user_id); try { await fetch("https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182", { method: "POST", body: fd }); const id = crypto.randomUUID(); files.push({ id, name: f.name, folderId: null }); } catch {} } saveFiles(); clearAndRender(); });

});
