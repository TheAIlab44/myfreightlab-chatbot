document.addEventListener("DOMContentLoaded", async () => {
  // ————— Paramètres & états —————
  const urlParams       = new URLSearchParams(window.location.search);
  const user_id         = urlParams.get("user_id");
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";
  let folders = [];
  let files   = [];
  let folderCount = 1;

  // ————— Helpers localStorage —————
  function saveFolders() {
    localStorage.setItem("myFolders", JSON.stringify(folders));
  }
  function loadFolders() {
    const d = localStorage.getItem("myFolders");
    if (d) {
      try { folders = JSON.parse(d); }
      catch { folders = []; }
    }
  }

  function saveFiles() {
    localStorage.setItem("myFiles", JSON.stringify(files));
  }
  function loadFiles() {
    const d = localStorage.getItem("myFiles");
    if (d) {
      try { files = JSON.parse(d); }
      catch { files = []; }
    }
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
      .add-folder {
        border:2px dashed #6c63ff; background:#fff; color:#6c63ff; font-size:32px;
      }
      .add-folder:hover { background:#f0f0ff; }
      .folder-item {
        background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1);
      }
      .folder-item.dragover { border-color:#00aa00; background:#f0fff0; }
      .file-item {
        background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1);
      }
      .emoji { font-size:36px; margin-bottom:6px; }
      .name { font-size:12px; text-align:center; word-break:break-all; }
      .menu-button { position:absolute; top:6px; right:6px; font-size:18px; }
      .context-menu {
        position:absolute; background:#fff; border:1px solid #ccc; border-radius:5px;
        box-shadow:0 2px 8px rgba(0,0,0,0.2); z-index:1000; width:100px;
      }
      .context-menu div { padding:6px 12px; cursor:pointer; }
      .context-menu div:hover { background:#f0f0f0; }
      .dragging { opacity:0.5; }
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
    </style>
    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
      <div class="uploaded-files" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // ————— Refs DOM + compteur drag externe —————
  const folderContainer   = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn         = wrapper.querySelector("#create-folder");
  const dropZone          = wrapper.querySelector("#drop-zone");

  let externalDragCounter = 0;

  // ————— External drag highlighting —————
  document.addEventListener("dragenter", e => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      externalDragCounter++;
      dropZone.classList.add("dragover");
    }
  });

  document.addEventListener("dragleave", e => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      externalDragCounter--;
      if (externalDragCounter === 0) {
        dropZone.classList.remove("dragover");
      }
    }
  });

  document.addEventListener("drop", e => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      externalDragCounter = 0;
      dropZone.classList.remove("dragover");
    }
  });

  // ————— Drag & Drop pour l’upload —————
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
  });
  dropZone.addEventListener("dragleave", () => {
    /* facultatif : rien à faire ici */
  });
  dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    for (const f of e.dataTransfer.files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("user_id", user_id);

      try {
        await fetch(
          "https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182",
          { method: "POST", body: fd }
        );
        const id = crypto.randomUUID();
        files.push({ id, name: f.name, folderId: null });
      } catch {
        alert("Erreur upload fichier");
      }
    }

    saveFiles();
    clearAndRender();
  });

  // ————— Context menu helper —————
  function closeMenus() {
    document.querySelectorAll(".context-menu").forEach(m => m.remove());
  }
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
    createBtn.style.display    = "none";
    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.style.margin = "10px";
    back.addEventListener("click", () => {
      back.remove();
      folderContainer.style.display = "flex";
      createBtn.style.display       = "flex";
      clearAndRender();
    });
    wrapper.prepend(back);
    uploadedContainer.innerHTML = "";
    files
      .filter(f => f.folderId === folderId)
      .forEach(f => renderFileItem(f));
  }

  // ————— Rendu d’un dossier —————
  function renderFolderItem(folder) {
    const el = document.createElement("div");
    el.className = "folder-item";
    el.dataset.id  = folder.id;
    el.draggable    = true;
    el.innerHTML    = `
      <div class="emoji">📁</div>
      <div class="name">${folder.name}</div>
    `;
    // (le reste identique à votre version)
    // …
    folderContainer.appendChild(el);
  }

  // ————— Rendu d’un fichier —————
  function renderFileItem(file) {
    const el = document.createElement("div");
    el.className  = "file-item";
    el.dataset.id = file.id;
    el.draggable   = true;
    el.innerHTML   = `
      <div class="emoji">📄</div>
      <div class="name">${file.name}</div>
    `;
    // (le reste identique à votre version)
    uploadedContainer.appendChild(el);
  }

  // ————— Création de dossier —————
  createBtn.addEventListener("click", () => {
    const nm = prompt("Nom du dossier", `Dossier ${folders.length + 1}`);
    if (!nm) return;
    const id = crypto.randomUUID();
    folders.push({ id, name: nm });
    saveFolders();
    clearAndRender();
  });

  // ————— Restore local + affichage initial —————
  loadFolders();
  loadFiles();
  clearAndRender();

  // 1) Charger les fichiers de l’utilisateur depuis Supabase
  async function loadUserFiles() {
    try {
      const { data: rows, error } = await sb
        .from("files_metadata")
        .select("id as file_id, original_name as file_name, storage_key")
        .eq("user_id", user_id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      files = rows.map(item => {
        const existing = files.find(f => f.id === item.file_id);
        return {
          id: item.file_id,
          name: existing && existing.name !== item.file_id
                ? existing.name
                : (item.file_name || item.file_id),
          folderId: existing ? existing.folderId : null,
          url: `${SUPABASE_URL}/storage/v1/object/public/user-files/${item.storage_key}`
        };
      });

      saveFiles();
      clearAndRender();
    } catch (err) {
      console.error("❌ Impossible de charger les fichiers Supabase :", err);
      clearAndRender();
    }
  }

  // → Appel de loadUserFiles()
  await loadUserFiles();

  // 2) Drag & Drop pour l’upload
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    for (const f of e.dataTransfer.files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("user_id", user_id);

      try {
        await fetch(
          "https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182",
          { method: "POST", body: fd }
        );
        const id = crypto.randomUUID();
        files.push({ id, name: f.name, folderId: null });
      } catch {
        alert("Erreur upload fichier");
      }
    }

    saveFiles();
    clearAndRender();
  });
});
