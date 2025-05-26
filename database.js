document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";

  // Create wrapper and inject HTML/CSS
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      body { margin:0; font-family:"Segoe UI",sans-serif; background:#f4f6fa; }
      .explorer { padding:20px; min-height:100vh; box-sizing:border-box; }
      .explorer-grid { display:flex; flex-wrap:wrap; gap:15px; }
      .add-folder, .folder-item, .file-item {
        width:100px; height:120px; border-radius:10px; display:flex;
        flex-direction:column; align-items:center; justify-content:center;
        cursor:pointer; transition:background 0.2s, box-shadow 0.2s;
      }
      .add-folder { border:2px dashed #6c63ff; background:#fff; color:#6c63ff; font-size:32px; }
      .add-folder:hover { background:#f0f0ff; }
      .folder-item { background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .folder-item.dragover { border-color:#6c63ff; background:#f9f9ff; }
      .file-item { background:#fff; border:1px solid #d1d5db; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .emoji { font-size:36px; margin-bottom:6px; }
      .name { font-size:12px; text-align:center; word-break:break-all; }
      .menu-button { position:absolute; top:6px; right:6px; font-size:18px; }
      .context-menu { position:absolute; background:#fff; border:1px solid #ccc; border-radius:5px;
        box-shadow:0 2px 8px rgba(0,0,0,0.2); z-index:1000; width:100px; }
      .context-menu div { padding:6px 12px; cursor:pointer; }
      .context-menu div:hover { background:#f0f0f0; }
      .dropzone { flex:1; padding:20px; border:2px dashed transparent; }
      .dropzone.dragover { border-color:#6c63ff; background:rgba(108,99,255,0.05); }
    </style>

    <div class="explorer">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">＋</div>
      </div>
      <div class="explorer-grid" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const folderContainer = document.getElementById('folder-container');
  const uploadedContainer = document.getElementById('uploaded-files-container');
  const createBtn = document.getElementById('create-folder');

  // State
  let folders = [];
  let files = []; // { name, id, folderId }

  // Persistence
  function saveState() {
    localStorage.setItem('vf_folders', JSON.stringify(folders));
    localStorage.setItem('vf_files', JSON.stringify(files));
  }
  function loadState() {
    try { folders = JSON.parse(localStorage.getItem('vf_folders')) || []; } catch { folders = []; }
    try { files = JSON.parse(localStorage.getItem('vf_files')) || []; } catch { files = []; }
  }

  // Render
  function clearAndRender() {
    folderContainer.innerHTML = '';
    createBtn && folderContainer.appendChild(createBtn);
    folders.forEach(f => renderFolderItem(f));
    uploadedContainer.innerHTML = '';
    files.forEach(f => renderFileItem(f));
  }

  // Folder
  function renderFolderItem(folder) {
    const el = document.createElement('div');
    el.className = 'folder-item'; el.dataset.id = folder.id; el.draggable = true;
    el.innerHTML = `<div class="emoji">📁</div><div class="name">${folder.name}</div>`;
    const btn = document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮';
    el.appendChild(btn);
    folderContainer.appendChild(el);

    // Drag&drop files into folder
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', () => el.classList.remove('dragover'));
    el.addEventListener('drop', e => {
      e.preventDefault(); el.classList.remove('dragover');
      const dragging = document.querySelector('.file-item.dragging');
      if (dragging) {
        const fid = dragging.dataset.id;
        const f = files.find(x=>x.id===fid);
        f.folderId = folder.id;
        saveState(); clearAndRender();
      }
    });

    // Reorder folders
    el.addEventListener('dragstart', () => el.classList.add('dragging'));
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      // Update order
      const order = Array.from(folderContainer.querySelectorAll('.folder-item')).map(n=>n.dataset.id);
      folders.sort((a,b)=> order.indexOf(a.id)-order.indexOf(b.id));
      saveState();
    });

    // Context menu
    btn.addEventListener('click', e => {
      e.stopPropagation(); closeMenus();
      const menu = document.createElement('div'); menu.className='context-menu';
      const ren = document.createElement('div'); ren.textContent='Renommer';
      ren.onclick = () => {
        const nm = prompt('Nom du dossier', folder.name);
        if(nm){ folder.name=nm; saveState(); clearAndRender(); }
      };
      const del = document.createElement('div'); del.textContent='Supprimer';
      del.onclick = () => {
        folders = folders.filter(x=>x.id!==folder.id);
        files = files.filter(x=>x.folderId!==folder.id);
        saveState(); clearAndRender();
      };
      menu.append(ren,del); el.appendChild(menu);
    });
  }

  // File
  function renderFileItem(file) {
    const el = document.createElement('div');
    el.className='file-item'; el.dataset.id=file.id; el.draggable=true;
    el.innerHTML = `<div class="emoji">📄</div><div class="name">${file.name}</div>`;
    uploadedContainer.appendChild(el);

    // Drag events
    el.addEventListener('dragstart', ()=>el.classList.add('dragging'));
    el.addEventListener('dragend', ()=>el.classList.remove('dragging'));

    // Context menu
    const btn = document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮'; el.appendChild(btn);
    btn.addEventListener('click', e=>{
      e.stopPropagation(); closeMenus();
      const menu=document.createElement('div'); menu.className='context-menu';
      const ren=document.createElement('div'); ren.textContent='Renommer';
      ren.onclick=()=>{
        const nm = prompt('Nom du fichier', file.name);
        if(nm){ file.name=nm; saveState(); clearAndRender(); }
      };
      const del=document.createElement('div'); del.textContent='Supprimer';
      del.onclick=()=>{ files=files.filter(x=>x.id!==file.id); saveState(); clearAndRender(); };
      menu.append(ren,del); el.appendChild(menu);
    });
  }

  function closeMenus() { document.querySelectorAll('.context-menu').forEach(m=>m.remove()); }
  document.addEventListener('click', closeMenus);

  // Create new folder
  createBtn.addEventListener('click', ()=>{
    const name = prompt('Nom du dossier', `Dossier ${folders.length+1}`);
    if(!name) return;
    const id = crypto.randomUUID(); folders.push({id,name}); saveState(); clearAndRender();
  });

  // Drop files on main container
  const dropzone = wrapper.querySelector('.explorer');
  dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', ()=>dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', async e=>{
    e.preventDefault(); dropzone.classList.remove('dragover');
    const dt = e.dataTransfer.files;
    if(!dt.length) return;
    for(const file of dt){
      const formData=new FormData(); formData.append('file',file); formData.append('user_id',user_id);
      try{
        const res=await fetch("https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182",{method:'POST',body:formData});
        const json=await res.json(); console.log(json);
        const id=crypto.randomUUID();
        files.push({id, name:file.name, folderId:null});
        saveState(); clearAndRender();
      }catch(err){ console.error(err); alert('Erreur upload'); }
    }
  });

  // Initialize
  loadState(); clearAndRender();
});
