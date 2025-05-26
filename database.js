document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");

  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";

  // --- Wrapper HTML & Styles ---
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      /* ... vos styles existants ... */
      .folder-contents {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: center;
      }
      .file-item-mini {
        width: 20px;
        height: 20px;
        font-size: 10px;
        text-align: center;
        line-height: 20px;
        border: 1px solid #ccc;
        border-radius: 3px;
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

  // --- Containers & Buttons ---
  const folderContainer = wrapper.querySelector("#folder-container");
  const uploadedContainer = wrapper.querySelector("#uploaded-files-container");
  const createBtn = wrapper.querySelector("#create-folder");
  const dropZone = wrapper.querySelector("#drop-zone");

  // --- State & Persistence ---
  let folders = [];
  let files = [];
  function saveFolders() { localStorage.setItem('myFolders', JSON.stringify(folders)); }
  function loadFolders() {
    const data = localStorage.getItem('myFolders');
    if (data) {
      try { folders = JSON.parse(data); } catch { folders = []; }
    }
  }
  function saveFiles() { localStorage.setItem('myFiles', JSON.stringify(files)); }
  function loadFiles() {
    const data = localStorage.getItem('myFiles');
    if (data) {
      try { files = JSON.parse(data); } catch { files = []; }
    }
  }

  loadFolders();
  loadFiles();

  // --- Rendering ---
  function clearAndRender() {
    // Dossiers
    folderContainer.innerHTML = '';
    folderContainer.appendChild(createBtn);
    folders.forEach(f => renderFolderItem(f));
    // Fichiers racine
    uploadedContainer.innerHTML = '';
    files.filter(f => f.folderId === null).forEach(f => renderFileItem(f));
  }

  // Render dossier + mini fichiers
  function renderFolderItem(folder) {
    const el = document.createElement('div');
    el.className = 'folder-item'; el.dataset.id = folder.id; el.draggable = true;
    el.innerHTML = `<div class="emoji">📁</div><div class="name">${folder.name}</div>`;
    const btn = document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮'; el.appendChild(btn);
    // Conteneur fichiers
    const contents = document.createElement('div'); contents.className='folder-contents'; el.appendChild(contents);
    files.filter(f => f.folderId === folder.id).forEach(file => {
      const mini = document.createElement('div'); mini.className='file-item-mini'; mini.textContent = file.name;
      contents.appendChild(mini);
    });
    // Drop sur dossier
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', () => el.classList.remove('dragover'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('dragover');
      const dragging = document.querySelector('.file-item.dragging');
      if (!dragging) return;
      const fid = dragging.dataset.id;
      const f = files.find(x => x.id === fid);
      f.folderId = folder.id;
      saveFiles(); clearAndRender();
    });
    // Reorder dossiers
    el.addEventListener('dragstart', () => el.classList.add('dragging'));
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      const order = Array.from(folderContainer.querySelectorAll('.folder-item')).map(n => n.dataset.id);
      folders.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
      saveFolders();
    });
    // Context menu dossier (rename/delete)
    btn.addEventListener('click', e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement('div'); menu.className='context-menu';
      const ren = document.createElement('div'); ren.textContent='Renommer';
      ren.onclick = () => {
        const nm = prompt('Nom du dossier', folder.name);
        if (nm) { folder.name = nm; saveFolders(); clearAndRender(); }
      };
      const del = document.createElement('div'); del.textContent='Supprimer';
      del.onclick = () => { folders = folders.filter(x=>x.id!==folder.id); files = files.filter(x=>x.folderId!==folder.id); saveFolders(); saveFiles(); clearAndRender(); };
      menu.append(ren, del); el.appendChild(menu);
    });
    folderContainer.appendChild(el);
  }

  // Render fichier racine
  function renderFileItem(file) {
    const el = document.createElement('div');
    el.className='file-item'; el.dataset.id=file.id; el.draggable=true;
    el.innerHTML = `<div class="emoji">📄</div><div class="name">${file.name}</div>`;
    // Drag events
    el.addEventListener('dragstart', () => el.classList.add('dragging'));
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    // Contexte fichier
    const btn = document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮'; el.appendChild(btn);
    btn.addEventListener('click', e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement('div'); menu.className='context-menu';
      const ren = document.createElement('div'); ren.textContent='Renommer';
      ren.onclick = () => { const nm = prompt('Nom du fichier', file.name); if(nm){ file.name=nm; saveFiles(); clearAndRender(); }};
      const del = document.createElement('div'); del.textContent='Supprimer';
      del.onclick = () => { files = files.filter(x=>x.id!==file.id); saveFiles(); clearAndRender(); };
      menu.append(ren, del); el.appendChild(menu);
    });
    uploadedContainer.appendChild(el);
  }

  function closeMenus() { document.querySelectorAll('.context-menu').forEach(m => m.remove()); }
  document.addEventListener('click', closeMenus);

  // Création dossier
  createBtn.addEventListener('click', () => {
    const name = prompt('Nom du dossier', `Dossier ${folders.length+1}`);
    if (!name) return;
    const id = crypto.randomUUID();
    folders.push({ id, name }); saveFolders(); clearAndRender();
  });

  // Upload fichiers sur wrapper
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', async e => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    const dt = e.dataTransfer.files;
    if (!dt.length) return;
    for (const file of dt) {
      const formData = new FormData(); formData.append('file', file); formData.append('user_id', user_id);
      try {
        await fetch("https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182", { method:'POST', body: formData });
        const id = crypto.randomUUID();
        files.push({ id, name: file.name, folderId: null });
        saveFiles(); clearAndRender();
      } catch (err) {
        console.error(err); alert('Erreur upload');
      }
    }
  });

  // Utilitaire drag reorder
  function getDragAfterElement(container, x) {
    const elements = [...container.querySelectorAll(':scope > .folder-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Initial render
  clearAndRender();
});
