<!-- 1) Chargement de la lib Supabase et création du client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
  // Remplacez par vos vraies valeurs Supabase
  const SUPABASE_URL     = "https://asjqmzgcajcizutrldqw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzanFtemdjYWpjaXp1dHJsZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTY1MjAsImV4cCI6MjA1NjU5MjUyMH0.8AGX4EI6F88TYrs1aunsFuwLWJfj3Zf_SJW1Y1tiTZc";
  const supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>

<script>
document.addEventListener("DOMContentLoaded", async () => {
  // ————— Paramètres & états —————
  const urlParams = new URLSearchParams(window.location.search);
  const user_id   = urlParams.get("user_id"); 
  let folders = [];
  let files   = [];

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
      .folder-contents {
        margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; justify-content:center;
      }
      .file-item-mini {
        width:20px; height:20px; font-size:10px; text-align:center;
        line-height:20px; border:1px solid #ccc; border-radius:3px;
      }
    </style>
    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">＋</div>
      </div>
      <div class="explorer-grid" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // ————— Refs DOM —————
  const folderContainer   = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn         = wrapper.querySelector("#create-folder");
  const dropZone          = wrapper.querySelector("#drop-zone");

  // ————— Context menu helper —————
  function closeMenus() {
    document.querySelectorAll(".context-menu").forEach(m => m.remove());
  }
  document.addEventListener("click", closeMenus);

  // ————— Rendu unifié —————
  function clearAndRender() {
    // Dossiers
    folderContainer.innerHTML = "";
    folderContainer.appendChild(createBtn);
    folders.forEach(f => renderFolderItem(f));

    // Fichiers racine
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
    files
      .filter(f => f.folderId === folderId)
      .forEach(f => renderFileItem(f));
  }

  // ————— Rendu d’un dossier —————
  function renderFolderItem(folder) {
    const el = document.createElement("div");
    el.className = "folder-item";
    el.dataset.id = folder.id;
    el.draggable = true;
    el.innerHTML = `<div class="emoji">📁</div><div class="name">${folder.name}</div>`;

    // clic pour ouvrir
    el.addEventListener("click", e => {
      if (!e.target.classList.contains("menu-button")) {
        openFolder(folder.id);
      }
    });

    // bouton contextuel
    const btn = document.createElement("div");
    btn.className = "menu-button";
    btn.textContent = "⋮";
    el.appendChild(btn);

    // drop → déplacer un fichier dans ce dossier
    el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
    el.addEventListener("drop", e => {
      e.preventDefault();
      el.classList.remove("dragover");
      const dragging = document.querySelector(".file-item.dragging");
      if (!dragging) return;
      const fid = dragging.dataset.id;
      const fobj = files.find(x => x.id === fid);
      fobj.folderId = folder.id;
      saveFiles();
      clearAndRender();
    });

    // reorder dossiers
    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      const order = Array.from(folderContainer.querySelectorAll(".folder-item"))
        .map(n => n.dataset.id);
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
        if (nm) {
          folder.name = nm;
          saveFolders();
          clearAndRender();
        }
      };
      const del = document.createElement("div");
      del.textContent = "Supprimer";
      del.onclick = () => {
        folders = folders.filter(x => x.id !== folder.id);
        files.forEach(f => { if (f.folderId === folder.id) f.folderId = null; });
        saveFolders();
        saveFiles();
        clearAndRender();
      };
      menu.append(ren, del);
      el.appendChild(menu);
    });

    folderContainer.appendChild(el);
  }

  // ————— Rendu d’un fichier —————
  function renderFileItem(file) {
    const el = document.createElement("div");
    el.className = "file-item";
    el.dataset.id = file.id;
    el.draggable = true;
    el.innerHTML = `<div class="emoji">📄</div><div class="name">${file.name}</div>`;

    // clic → ouvrir l’URL du fichier
    el.addEventListener("click", e => {
      if (!e.target.classList.contains("menu-button") && file.url) {
        window.open(file.url, "_blank");
      }
    });

    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend",   () => el.classList.remove("dragging"));

    // menu contextuel fichier
    const btn = document.createElement("div");
    btn.className = "menu-button";
    btn.textContent = "⋮";
    btn.addEventListener("click", e => {
      e.stopPropagation();
      closeMenus();
      const menu = document.createElement("div");
      menu.className = "context-menu";

      const ren = document.createElement("div");
      ren.textContent = "Renommer";
      ren.onclick = () => {
        const nm = prompt("Nom du fichier", file.name);
        if (nm) {
          file.name = nm;
          saveFiles();
          clearAndRender();
        }
      };

      const del = document.createElement("div");
      del.textContent = "Supprimer";
      del.onclick = () => {
        files = files.filter(x => x.id !== file.id);
        saveFiles();
        clearAndRender();
      };

      menu.append(ren, del);
      el.appendChild(menu);
    });
    el.appendChild(btn);

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

  // ————— Init + Chargement depuis Supabase + gestion du Drop —————
  loadFolders();
  loadFiles();
  clearAndRender();

  // 1) Charger les fichiers de l’utilisateur depuis Supabase
  async function loadUserFiles() {
    try {
      const { data: rows, error } = await supabase
        .from("files_metadata")
        .select("id as file_id, original_name as file_name, storage_key")
        .eq("user_id", user_id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      files = rows.map(item => ({
        id:       item.file_id,
        name:     item.file_name || item.file_id,
        folderId: null,
        url:      `${SUPABASE_URL}/storage/v1/object/public/user-files/${item.storage_key}`
      }));

      saveFiles();
      clearAndRender();
    } catch (err) {
      console.error("❌ Impossible de charger les fichiers Supabase :", err);
      clearAndRender();
    }
  }

  await loadUserFiles();

  // 2) Drop & upload direct vers Supabase Storage + insertion en files_metadata
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
      // Générer un chemin unique dans le bucket
      const ts = Date.now();
      const safeName = f.name.replace(/\s+/g, "_");
      const path = `uploads/${ts}-${safeName}`;

      // 2.1) Upload dans Supabase Storage (bucket "user-files")
      const { data: up, error: errUp } = await supabase
        .storage
        .from("user-files")
        .upload(path, f, { upsert: false });

      if (errUp) {
        alert("❌ Erreur upload : " + errUp.message);
        continue;
      }

      const storageKey = up.key || up.Key || path;

      // 2.2) Insérer les métadonnées dans files_metadata
      const { error: errIns } = await supabase
        .from("files_metadata")
        .insert({
          user_id:       user_id,
          original_name: f.name,
          storage_key:   storageKey,
          mime_type:     f.type
        });

      if (errIns) {
        alert("❌ Erreur enregistrement : " + errIns.message);
        continue;
      }

      // 2.3) Ajouter localement dans l’UI
      files.push({
        id:       storageKey,
        name:     f.name,
        folderId: null,
        url:      `${SUPABASE_URL}/storage/v1/object/public/user-files/${storageKey}`
      });
    }

    saveFiles();
    clearAndRender();
  });

});
</script>
