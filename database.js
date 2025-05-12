<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma base de documents</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 2rem;
      background-color: #f8f9fb;
    }

    #file-manager {
      max-width: 900px;
      margin: auto;
    }

    #toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    #file-view {
      border: 2px dashed #0077c8;
      padding: 20px;
      border-radius: 10px;
      background: #f0f8ff;
      min-height: 300px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .item {
      width: 120px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      background: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: background 0.2s;
    }

    .item:hover {
      background: #e6f2fa;
    }

    .item-icon {
      font-size: 40px;
    }

    #breadcrumb {
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div id="file-manager">
    <h2>📁 Ma base de documents</h2>
    <div id="breadcrumb">/</div>
    <div id="toolbar">
      <button onclick="createFolder()">📂 Nouveau dossier</button>
      <label>📤 <input type="file" id="uploadInput" hidden> Ajouter un fichier</label>
    </div>
    <div id="file-view"></div>
  </div>

  <script type="module">
    const supabaseUrl = "https://TON_INSTANCE.supabase.co";
    const supabaseKey = "TON_ANON_KEY";
    const bucketName = "myfreightlab";
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    const supabase = createClient(supabaseUrl, supabaseKey);

    let currentPath = [];

    async function fetchFiles() {
      const folderPath = 'docs/' + currentPath.join('/') + (currentPath.length ? '/' : '');
      const { data, error } = await supabase.storage.from(bucketName).list(folderPath);
      const container = document.getElementById("file-view");
      const breadcrumb = document.getElementById("breadcrumb");
      let path = '/';
      breadcrumb.innerHTML = '';
      currentPath.forEach((p, i) => {
        path += p + '/';
        breadcrumb.innerHTML += `<span style="cursor:pointer;color:#0077c8" onclick="goTo(${i})">${p}/</span>`;
      });
      if (error) {
        container.innerHTML = `<p style="color:red;">Erreur chargement : ${error.message}</p>`;
        return;
      }
      container.innerHTML = '';
      data.forEach(file => {
        const el = document.createElement("div");
        el.className = "item";
        if (file.metadata) {
          el.innerHTML = `<div class="item-icon">📄</div><div>${file.name}</div>`;
        } else {
          el.innerHTML = `<div class="item-icon">📁</div><div>${file.name}</div>`;
          el.ondblclick = () => {
            currentPath.push(file.name);
            fetchFiles();
          };
        }
        container.appendChild(el);
      });
    }

    window.goTo = (i) => {
      currentPath = currentPath.slice(0, i + 1);
      fetchFiles();
    }

    window.createFolder = async () => {
      const name = prompt("Nom du dossier :");
      if (!name) return;
      const folderPath = 'docs/' + currentPath.concat(name).join('/') + '/placeholder.txt';
      const { error } = await supabase.storage.from(bucketName).upload(folderPath, new Blob([""], { type: 'text/plain' }));
      if (error) return alert("Erreur création dossier : " + error.message);
      fetchFiles();
    };

    document.getElementById("uploadInput").addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      const filePath = 'docs/' + currentPath.join('/') + (currentPath.length ? '/' : '') + file.name;
      const { error } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
      if (error) return alert("Erreur d'upload : " + error.message);
      fetchFiles();
    });

    fetchFiles();
  </script>
</body>
</html>
