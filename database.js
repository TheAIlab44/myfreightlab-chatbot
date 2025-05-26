document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      /* ... (styles unchanged) ... */
    </style>

    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">➕</div>
      </div>
      <div class="uploaded-files" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const folderContainer = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");
  let folderCount = 1;
  let folders = [];

  // --- Persistence helpers ---
  function saveFolders() {
    const names = folders.map(f => f.name);
    localStorage.setItem('folders', JSON.stringify(names));
  }
  function loadFolders() {
    const data = localStorage.getItem('folders');
    if (data) {
      try {
        const names = JSON.parse(data);
        names.forEach(name => createFolder(name, false));
      } catch {}
    }
  }

  // --- Rendering items ---
  function renderFileItem(name) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.setAttribute('draggable', 'true');

    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = "📄";

    const nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.textContent = name || "Sans nom";
    nameDiv.contentEditable = false;

    // Context menu button
    const menuBtn = document.createElement("div");
    menuBtn.className = "menu-button";
    menuBtn.textContent = "⋮";

    menuBtn.addEventListener("click", e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement('div'); menu.className = 'context-menu';
      const renameOpt = document.createElement('div'); renameOpt.textContent = 'Renommer';
      renameOpt.onclick = () => { nameDiv.contentEditable = true; nameDiv.focus(); menu.remove(); };
      const deleteOpt = document.createElement('div'); deleteOpt.textContent = 'Supprimer';
      deleteOpt.onclick = () => fileItem.remove();
      menu.append(renameOpt, deleteOpt);
      fileItem.appendChild(menu);
    });

    nameDiv.addEventListener('blur', () => nameDiv.contentEditable = false);
    nameDiv.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameDiv.blur(); } });

    fileItem.append(emoji, nameDiv, menuBtn);
    uploadedContainer.appendChild(fileItem);

    // Drag events for reordering
    fileItem.addEventListener('dragstart', () => fileItem.classList.add('dragging'));
    fileItem.addEventListener('dragend', () => fileItem.classList.remove('dragging'));
  }

  async function loadUserFiles() {
    try {
      const formData = new FormData(); formData.append("user_id", user_id);
      const res = await fetch(filesWebhookUrl, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const files = await res.json();
      uploadedContainer.innerHTML = '';
      files.forEach(item => {
        const displayName = item.file_name || item.originalName || item.file_id;
        renderFileItem(displayName);
      });
    } catch (err) {
      console.error("❌ Impossible de charger les fichiers :", err);
    }
  }

  // Load persisted folders and files
  loadFolders();
  await loadUserFiles();

  function closeMenus() { document.querySelectorAll('.context-menu').forEach(m => m.remove()); }
  document.addEventListener('click', closeMenus);

  // Create folder function, with persistence
  function createFolder(nameText = `Dossier ${folderCount++}`, persist = true) {
    const folder = document.createElement('div');
    folder.className = 'folder-item'; folder.setAttribute('draggable','true');

    const emoji = document.createElement('div'); emoji.className = 'emoji'; emoji.textContent = '📁';
    const nameDiv = document.createElement('div'); nameDiv.className = 'name'; nameDiv.textContent = nameText; nameDiv.contentEditable = false;
    const menuBtn = document.createElement('div'); menuBtn.className = 'menu-button'; menuBtn.textContent = '⋮';

    menuBtn.addEventListener('click', e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement('div'); menu.className = 'context-menu';
      const renameOpt = document.createElement('div'); renameOpt.textContent = 'Renommer';
      renameOpt.onclick = () => { nameDiv.contentEditable = true; nameDiv.focus(); menu.remove(); };
      const deleteOpt = document.createElement('div'); deleteOpt.textContent = 'Supprimer';
      deleteOpt.onclick = () => { folder.remove(); if (persist) { folders = folders.filter(f => f.name !== nameDiv.textContent); saveFolders(); } };
      menu.append(renameOpt, deleteOpt); folder.appendChild(menu);
    });

    nameDiv.addEventListener('blur', () => {
      nameDiv.contentEditable = false;
      if (persist) {
        const idx = folders.findIndex(f => f.element === folder);
        if (idx !== -1) { folders[idx].name = nameDiv.textContent; saveFolders(); }
      }
    });
    nameDiv.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameDiv.blur(); } });

    folder.append(emoji, nameDiv, menuBtn);
    folderContainer.appendChild(folder);

    // Persist
    if (persist) {
      folders.push({ name: nameText, element: folder });
      saveFolders();
    }

    // Drag for reorder
    folder.addEventListener('dragstart', () => folder.classList.add('dragging'));
    folder.addEventListener('dragend', () => folder.classList.remove('dragging'));

    // Select folder
    folder.addEventListener('click', () => {
      const folderName = nameDiv.textContent.trim();
      currentFolderId = folderName.replace(/\s+/g, '_').toLowerCase();
      console.log("📁 Dossier sélectionné :", currentFolderId);
      alert(`📁 Dossier sélectionné : ${folderName}`);
    });
  }

  createBtn.addEventListener('click', () => createFolder());

  // Reordering folders
  folderContainer.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = folderContainer.querySelector('.dragging');
    const after = getDragAfterElement(folderContainer, e.clientX);
    if (!after) folderContainer.appendChild(dragging);
    else folderContainer.insertBefore(dragging, after);
    // Update folder order in memory
    folders = Array.from(folderContainer.querySelectorAll('.folder-item')).map(el => ({ name: el.querySelector('.name').textContent, element: el }));
    saveFolders();
  });

  // Reordering file items
  uploadedContainer.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = uploadedContainer.querySelector('.dragging');
    const after = getDragAfterElement(uploadedContainer, e.clientX);
    if (!after) uploadedContainer.appendChild(dragging);
    else uploadedContainer.insertBefore(dragging, after);
  });

  // File upload drag & drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', async e => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (!files.length) return;
    for (const file of files) {
      const formData = new FormData(); formData.append('file', file); formData.append('user_id', user_id);
      try {
        const res = await fetch("https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182", { method: 'POST', body: formData });
        const result = await res.json(); console.log("🧠 Webhook réponse :", result);
        alert("✅ Fichier vectorisé avec succès !");
        renderFileItem(file.name);
      } catch (err) {
        console.error("❌ Webhook échoué :", err); alert("Erreur lors de l’envoi au webhook !");
      }
    }
  });

  function getDragAfterElement(container, x) {
    const elements = [...container.querySelectorAll(':scope > .folder-item, :scope > .file-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
});
