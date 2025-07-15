// 1) Initialisation du client Supabase
const SUPABASE_URL      = "https://asjqmzgcajcizutrldqw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzanFtemdjYWpjaXp1dHJsZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTY1MjAsImV4cCI6MjA1NjU5MjUyMH0.8AGX4EI6F88TYrs1aunsFuwLWJfj3Zf_SJW1Y1tiTZc";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  .explorer {
    padding:20px;
    min-height:100vh;
    box-sizing:border-box;
    transition: background 0.3s, border-color 0.3s;
    border: 2px dashed transparent;
  }

  .explorer-grid {
    display:flex;
    flex-wrap:wrap;
    gap:15px;
  }

  .add-folder,
  .folder-item,
  .file-item {
    width:100px;
    height:120px;
    border-radius:10px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition:background 0.2s, box-shadow 0.2s;
    position:relative;
  }

  .add-folder {
    border:2px dashed #6c63ff;
    background:#fff;
    color:#6c63ff;
    font-size:32px;
  }
  .add-folder:hover {
    background:#f0f0ff;
  }

  .folder-item {
    background:#fff;
    border:1px solid #d1d5db;
    box-shadow:0 1px 3px rgba(0,0,0,0.1);
  }
  .folder-item.dragover {
    border-color:#00aa00;
    background:#f0fff0;
  }

  .file-item {
    background:#fff;
    border:1px solid #d1d5db;
    box-shadow:0 1px 3px rgba(0,0,0,0.1);
  }

  .emoji {
    font-size:36px;
    margin-bottom:6px;
  }
.name {
    font-size:12px;
    text-align:center;
    white-space: normal;
    overflow-wrap: anywhere;
    /* **AJOUT : 3 lignes + ellipsis** */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .menu-button {
    position:absolute;
    top:6px;
    right:6px;
    font-size:18px;
  }

  .context-menu {
    position:absolute;
    background:#fff;
    border:1px solid #ccc;
    border-radius:5px;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    z-index:1000;
    width:100px;
  }
  .context-menu div {
    padding:6px 12px;
    cursor:pointer;
  }
  .context-menu div:hover {
    background:#f0f0f0;
  }

  .dragging {
    opacity:0.5;
  }

  .folder-contents {
    margin-top:6px;
    display:flex;
    flex-wrap:wrap;
    gap:4px;
    justify-content:center;
  }

  .file-item-mini {
    width:20px;
    height:20px;
    font-size:10px;
    text-align:center;
    line-height:20px;
    border:1px solid #ccc;
    border-radius:3px;
  }

  /* Surbrillance de la drop-zone lors d'un drag externe */
  .explorer.dragover {
    border-color: #00aa00;
    background: linear-gradient(90deg, #f0fff0 0%, #eaffea 100%);
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

  // ————— Refs DOM (une seule fois) —————
  const folderContainer   = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn         = wrapper.querySelector("#create-folder");
  const dropZone          = wrapper.querySelector("#drop-zone");

// ————— External drag highlighting —————
let externalDragCounter = 0;
document.addEventListener("dragenter", e => {
  // Ne déclenche que si on drague un (ou plusieurs) fichier(s) venant de l’extérieur
  if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
    externalDragCounter++;
    dropZone.classList.add("dragover"); // applique la classe CSS .explorer.dragover
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
  // Lorsque l’on lâche un fichier externe, retire immédiatement la surbrillance
  if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
    externalDragCounter = 0;
    dropZone.classList.remove("dragover");
  }
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
  el.dataset.id = folder.id;
  el.draggable = true;

  // On garde l’emoji + .name, mais on s’assure qu’il y a <div class="name">…</div>
  el.innerHTML = `
    <div class="emoji">📁</div>
    <div class="name">${folder.name}</div>
  `;


// - on vérifie que la cible du clic n'est ni le bouton ⋮, ni un élément du menu contextuel.
el.addEventListener("click", e => {
  if (
    !e.target.closest(".menu-button") &&
    !e.target.closest(".context-menu")
  ) {
    openFolder(folder.id);
  }
});
;

  // Bouton “⋮” pour le context menu
  const btn = document.createElement("div");
  btn.className = "menu-button";
  btn.textContent = "⋮";
  el.appendChild(btn);

  // Drag & Drop pour déposer un fichier dans ce dossier
  el.addEventListener("dragover", e => {
    e.preventDefault();
    el.classList.add("dragover");
  });
  el.addEventListener("dragleave", () => el.classList.remove("dragover"));
  el.addEventListener("drop", e => {
    e.preventDefault();
    el.classList.remove("dragover");
    const dragging = document.querySelector(".file-item.dragging");
    if (!dragging) return;
    const fid  = dragging.dataset.id;
    const fobj = files.find(x => x.id === fid);
    fobj.folderId = folder.id;
    saveFiles();
    clearAndRender();
  });

  // Pour l’effet visuel lors du dragstart / dragend
  el.addEventListener("dragstart", () => el.classList.add("dragging"));
  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
    // Réordonner le tableau "folders" suivant l’ordre visuel
    const order = Array.from(folderContainer.querySelectorAll(".folder-item"))
      .map(n => n.dataset.id);
    folders.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    saveFolders();
  });

  // Context-menu du dossier (Renommer / Supprimer)
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
      files.forEach(f => {
        if (f.folderId === folder.id) f.folderId = null;
      });
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

  el.innerHTML = `
    <div class="emoji">📄</div>
    <div class="name">${file.name}</div>
  `;

  // 1) Clic → ouvrir l’URL si elle existe
el.addEventListener("click", e => {
  if (
    e.target.closest(".menu-button") ||
    e.target.closest(".context-menu")
  ) {
    return;
  }

  if (file.url) {
    window.open(file.url, "_blank");
  } else {
    alert("Pas d’URL valide pour ce fichier (file.url est undefined)");
  }
});


  // 2) Effet visuel drag & drop
  el.addEventListener("dragstart", () => el.classList.add("dragging"));
  el.addEventListener("dragend",   () => el.classList.remove("dragging"));

  // 3) Bouton “⋮” + menu contextuel Renommer / Supprimer
  const btn = document.createElement("div");
  btn.className = "menu-button";
  btn.textContent = "⋮";
  btn.addEventListener("click", e => {
    e.stopPropagation();
    closeMenus();
    const menu = document.createElement("div");
    menu.className = "context-menu";

    // Renommer
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

    // Supprimer
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

  // ————— Restore local + affichage initial —————
  loadFolders();
  loadFiles();
  clearAndRender();

   // 1) Charger les fichiers de l’utilisateur depuis Supabase
  async function loadUserFiles() {
    try {
      const { data: rows, error } = await sb
        .from("documents")
        .select("id as file_id, original_name as file_name, storage_key")
        .eq("user_id", user_id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      console.log("🏷️ rows reçues de Supabase :", rows);

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
  } // ← Fin de loadUserFiles

  // → c’est ici que l’on appelle loadUserFiles, et non à l’intérieur d’une autre fonction :
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

}); // ← fermeture du IIFE DOMContentLoaded

// ✅ FONCTION À AJOUTER EN DEHORS de DOMContentLoaded :
window.getUserDocuments = async function(userId, fileId = null) {
  let query = supabase
    .from("documents")
    .select("*")
    .filter("metadata->>user_id", "eq", userId);

  if (fileId) {
    query = query.filter("metadata->>file_id", "eq", fileId);
  }

  const { data, error } = await query.limit(50);
  if (error) throw new Error(error.message);

  console.log("📄 Documents récupérés :", data);
  return data;
};


