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
      <label>📤 <input type="file" onchange="uploadFile(event)" hidden> Ajouter un fichier</label>
    </div>
    <div id="file-view"></div>
  </div>

  <script>
    let currentPath = [];
    let mockFS = {
      name: '/',
      folders: {},
      files: []
    };

    function render() {
      const container = document.getElementById("file-view");
      const breadcrumb = document.getElementById("breadcrumb");

      let node = mockFS;
      breadcrumb.textContent = '/';
      currentPath.forEach(p => {
        breadcrumb.textContent += p + '/';
        node = node.folders[p];
      });

      container.innerHTML = '';

      Object.keys(node.folders).forEach(folder => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `<div class="item-icon">📁</div><div>${folder}</div>`;
        el.ondblclick = () => {
          currentPath.push(folder);
          render();
        };
        container.appendChild(el);
      });

      node.files.forEach(file => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `<div class="item-icon">📄</div><div>${file}</div>`;
        container.appendChild(el);
      });
    }

    function createFolder() {
      const name = prompt("Nom du dossier :");
      if (!name) return;

      let node = mockFS;
      currentPath.forEach(p => node = node.folders[p]);
      if (node.folders[name]) {
        alert("Ce dossier existe déjà.");
        return;
      }
      node.folders[name] = { folders: {}, files: [] };
      render();
    }

    function uploadFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      let node = mockFS;
      currentPath.forEach(p => node = node.folders[p]);
      node.files.push(file.name);
      render();
    }

    render();
  </script>
</body>
</html>
