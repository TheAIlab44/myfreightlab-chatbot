document.addEventListener("DOMContentLoaded", async () => {
  const bucketName = "myfreightlab"; // adapte si nécessaire

  // === Supabase config
  const supabaseUrl = "https://asjqmzgcajcizutrldqw.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzanFtemdjYWpjaXp1dHJsZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTY1MjAsImV4cCI6MjA1NjU5MjUyMH0.8AGX4EI6F88TYrs1aunsFuwLWJfj3Zf_SJW1Y1tiTZc";
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>
      #uploadInput { display: none; }

      .explorer {
        padding: 20px;
        background: #f5f7fa;
        border-radius: 10px;
        border: 1px solid #ccc;
        font-family: "Segoe UI", sans-serif;
        max-width: 100%;
      }

      .explorer-toolbar {
        margin-bottom: 15px;
      }

      .explorer-toolbar button {
        padding: 8px 12px;
        background: #e4e6eb;
        border: 1px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }

      .explorer-toolbar button:hover {
        background-color: #d0d2d6;
      }

      .explorer-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      }

      .folder-item {
        width: 100px;
        height: 90px;
        background: white;
        border: 1px solid #c0c0c0;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        cursor: pointer;
        padding: 5px;
      }

      .folder-item:hover {
        background: #eef;
        border-color: #339;
      }
    </style>

    <div class="explorer">
      <div class="explorer-toolbar">
        <button id="create-folder">📁 Nouveau dossier</button>
      </div>
      <div id="upload-area">
        📤 Glisse un fichier ici ou <label for="uploadInput" style="color: #0077c8; cursor: pointer; text-decoration: underline;">clique pour choisir</label>
        <input type="file" id="uploadInput" />
      </div>
      <div class="explorer-grid" id="folder-container">
        <!-- Les dossiers s’empilent ici -->
      </div>
    </div>
  `;


  document.body.appendChild(wrapper);

    let folderCount = 1;
  const folderContainer = wrapper.querySelector("#folder-container");
  const createBtn = wrapper.querySelector("#create-folder");

  createBtn.addEventListener("click", () => {
    const folder = document.createElement("div");
    folder.className = "folder-item";
    folder.innerHTML = `📁 Dossier ${folderCount++}`;
    folderContainer.appendChild(folder);
  });


  const uploadArea = wrapper.querySelector("#upload-area");
  const uploadInput = wrapper.querySelector("#uploadInput");
  const filelist = wrapper.querySelector("#file-list");

  // 📥 Liste les fichiers
  async function fetchFiles() {
    const { data, error } = await supabase.storage.from(bucketName).list("docs");
    if (error) {
      filelist.innerHTML = `<p style="color:red;">Erreur chargement : ${error.message}</p>`;
      return;
    }

    if (!data.length) {
      filelist.innerHTML = `<p>Aucun fichier pour l'instant.</p>`;
      return;
    }

    filelist.innerHTML = "";
    data.forEach(file => {
      const div = document.createElement("div");
      div.className = "file-entry";
      div.textContent = file.name;
      filelist.appendChild(div);
    });
  }

  // 📤 Upload
  async function handleUpload(file) {
    const filePath = `docs/${file.name}`;
    const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      upsert: true
    });
    if (error) {
      alert("Erreur d'upload : " + error.message);
    } else {
      alert("✅ Fichier ajouté !");
      fetchFiles();
    }
  }

  uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.style.background = "#e0f0ff";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.background = "#f0f8ff";
  });

  uploadArea.addEventListener("drop", e => {
    e.preventDefault();
    uploadArea.style.background = "#f0f8ff";
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  });

  uploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  });

  fetchFiles(); // initial load
});
