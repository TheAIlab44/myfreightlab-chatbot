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
      #drive-header {
        font-weight: bold;
        font-size: 20px;
        margin-bottom: 1rem;
      }
      #upload-area {
        border: 2px dashed #0077c8;
        padding: 40px;
        margin-bottom: 1rem;
        background: #f0f8ff;
        text-align: center;
        border-radius: 10px;
        cursor: pointer;
      }
      .file-entry {
        padding: 8px;
        border-bottom: 1px solid #ddd;
      }
    </style>

    <div id="drive-header">📁 Ma base de documents</div>
    <div id="upload-area">
      📤 Glisse un fichier ici ou <label for="uploadInput" style="color: #0077c8; cursor: pointer; text-decoration: underline;">clique pour choisir</label>
      <input type="file" id="uploadInput" />
    </div>
    <div id="file-list">Chargement des fichiers...</div>
  `;

  document.body.appendChild(wrapper);

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
