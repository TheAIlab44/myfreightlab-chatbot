// == Explorateur de fichiers vectorisés avec dossiers et persistence ==

document.addEventListener("DOMContentLoaded", async () => {
  // --- Params & State ---
  const urlParams = new URLSearchParams(window.location.search);
  const user_id = urlParams.get("user_id");
  const filesWebhookUrl = "https://myfreightlab.app.n8n.cloud/webhook/52758b10-2216-481a-a29f-5ecdb9670937";
  let folders = [];
  let files = [];
  let folderCount = 1;

  // --- localStorage Helpers ---
  function saveFolders() { localStorage.setItem('vf_folders', JSON.stringify(folders)); }
  function loadFolders() {
    const d = localStorage.getItem('vf_folders');
    if (d) try { folders = JSON.parse(d) } catch { folders = [] }
  }
  function saveFiles() { localStorage.setItem('vf_files', JSON.stringify(files)); }
  function loadFiles() {
    const d = localStorage.getItem('vf_files');
    if (d) try { files = JSON.parse(d) } catch { files = [] }
  }

  // --- Build UI ---
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <style>
      /* ... styles inchangés ... */
    </style>
    <div class="explorer" id="drop-zone">
      <div class="explorer-grid" id="folder-container">
        <div class="add-folder" id="create-folder">＋</div>
      </div>
      <div class="uploaded-files" id="uploaded-files-container"></div>
    </div>
  `;
  document.body.appendChild(wrapper);
  const folderContainer = wrapper.querySelector('#folder-container');
  const uploadedContainer = wrapper.querySelector('#uploaded-files-container');
  const createBtn = wrapper.querySelector('#create-folder');
  const dropZone = wrapper.querySelector('#drop-zone');

  // --- Context menus ---
  function closeMenus() { document.querySelectorAll('.context-menu').forEach(m=>m.remove()) }
  document.addEventListener('click', closeMenus);

  // --- Rendering ---
  function clearAndRender() {
    // global view
    folderContainer.style.display = '';
    createBtn.style.display = '';
    document.querySelectorAll('.back-button').forEach(b => b.remove());

    // Dossiers
    folderContainer.innerHTML = '';
    folderContainer.appendChild(createBtn);
    folders.forEach(f => renderFolderItem(f));
    // Fichiers racine
    uploadedContainer.innerHTML = '';
    files.filter(f=>f.folderId===null).forEach(f=>renderFileItem(f));
  }

  // Render folder with click, drop & mini-files
  function renderFolderItem(folder) {
    const el = document.createElement('div');
    el.className = 'folder-item'; el.dataset.id = folder.id; el.draggable = true;
    el.innerHTML = `<div class="emoji">📁</div><div class="name">${folder.name}</div>`;
    // click to open
    el.addEventListener('click', e => {
      if (e.target.classList.contains('menu-button')) return;
      openFolder(folder.id);
    });
    // context btn
    const btn = document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮'; el.appendChild(btn);
    // mini-files
    const contents = document.createElement('div'); contents.className='folder-contents'; el.appendChild(contents);
    files.filter(f=>f.folderId===folder.id).forEach(file=>{
      const mini = document.createElement('div'); mini.className='file-item-mini'; mini.textContent=file.name;
      contents.appendChild(mini);
    });
    // drop into folder
    el.addEventListener('dragover', e=>{ e.preventDefault(); el.classList.add('dragover') });
    el.addEventListener('dragleave', ()=>el.classList.remove('dragover'));
    el.addEventListener('drop', e=>{
      e.preventDefault(); el.classList.remove('dragover');
      const dragging = document.querySelector('.file-item.dragging');
      if (!dragging) return;
      const fid = dragging.dataset.id;
      files.find(x=>x.id===fid).folderId = folder.id;
      saveFiles(); clearAndRender();
    });
    // reorder folder
    el.addEventListener('dragstart', ()=>el.classList.add('dragging'));
    el.addEventListener('dragend', ()=>{
      el.classList.remove('dragging');
      const order = Array.from(folderContainer.querySelectorAll('.folder-item')).map(n=>n.dataset.id);
      folders.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)); saveFolders();
    });
    // context menu rename/delete
    btn.addEventListener('click', e=>{
      e.stopPropagation(); closeMenus();
      const menu=document.createElement('div'); menu.className='context-menu';
      const ren=document.createElement('div'); ren.textContent='Renommer';
      ren.onclick=()=>{ const nm=prompt('Nom du dossier',folder.name); if(nm){ folder.name=nm; saveFolders(); clearAndRender(); }};
      const del=document.createElement('div'); del.textContent='Supprimer';
      del.onclick=()=>{ folders=folders.filter(x=>x.id!==folder.id); files.forEach(f=>{ if(f.folderId===folder.id) f.folderId=null }); saveFolders(); saveFiles(); clearAndRender(); };
      menu.append(ren,del); el.appendChild(menu);
    });
    folderContainer.appendChild(el);
  }
  // render file
  function renderFileItem(file) {
    const el = document.createElement('div'); el.className='file-item'; el.dataset.id=file.id; el.draggable=true;
    el.innerHTML=`<div class="emoji">📄</div><div class="name">${file.name}</div>`;
    el.addEventListener('dragstart',()=>el.classList.add('dragging'));
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
    // file context
    const btn=document.createElement('div'); btn.className='menu-button'; btn.textContent='⋮';
    btn.addEventListener('click',e=>{
      e.stopPropagation(); closeMenus();
      const menu=document.createElement('div'); menu.className='context-menu';
      const ren=document.createElement('div'); ren.textContent='Renommer';
      ren.onclick=()=>{ const nm=prompt('Nom du fichier',file.name); if(nm){ file.name=nm; saveFiles(); clearAndRender(); }};
      const del=document.createElement('div'); del.textContent='Supprimer';
      del.onclick=()=>{ files=files.filter(x=>x.id!==file.id); saveFiles(); clearAndRender(); };
      menu.append(ren,del); el.appendChild(menu);
    }); el.appendChild(btn);
    uploadedContainer.appendChild(el);
  }

  // open folder view
  function openFolder(folderId) {
    folderContainer.style.display='none'; createBtn.style.display='none';
    const back=document.createElement('button'); back.textContent='← Retour'; back.className='back-button'; back.style.margin='10px';
    back.addEventListener('click',()=>{ back.remove(); clearAndRender(); });
    wrapper.prepend(back);
    uploadedContainer.innerHTML = '';
    files.filter(f=>f.folderId===folderId).forEach(f=>renderFileItem(f));
  }

  // create folder btn
  createBtn.addEventListener('click',()=>{
    const nm=prompt('Nom du dossier',`Dossier ${folders.length+1}`);
    if(!nm) return;
    const id=crypto.randomUUID(); folders.push({id,name:nm}); saveFolders(); clearAndRender();
  });

  // initial load
  loadFolders(); loadFiles(); clearAndRender();

  // fetch external files
  async function loadUserFiles() {
    try {
      const fd=new FormData(); fd.append('user_id',user_id);
      const res=await fetch(filesWebhookUrl,{method:'POST',body:fd});
      if(!res.ok) throw new Error(res.statusText);
      const data=await res.json();
      files=data.map(i=>({id:i.file_id,name:i.file_name||i.file_id,folderId:null}));
      saveFiles(); clearAndRender();
    } catch(e) { clearAndRender(); }
  }
  await loadUserFiles();

  // wrapper drop for new files
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('dragover')});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop',async e=>{
    e.preventDefault(); dropZone.classList.remove('dragover');
    for(const f of e.dataTransfer.files){
      const fd=new FormData(); fd.append('file',f); fd.append('user_id',user_id);
      try{ await fetch('https://myfreightlab.app.n8n.cloud/webhook/34e003f9-99db-4b40-a513-9304c01a1182',{method:'POST',body:fd});
      const id=crypto.randomUUID(); files.push({id,name:f.name,folderId:null}); }
      catch{} }
    saveFiles(); clearAndRender();
  });
});
