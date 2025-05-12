if (location.pathname.includes("base-de-donnees")) {
  const container = document.querySelector("#chat-container") || document.body;

  const dbWrapper = document.createElement("div");
  dbWrapper.innerHTML = `
    <style>
      .doc-entry { margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
      #uploadBtn { margin-top: 20px; }
    </style>
    <h2>📁 Mes documents vectorisés</h2>
    <div id="docList"></div>
    <input type="file" id="docUpload" />
    <button id="uploadBtn">Uploader</button>
  `;
  container.appendChild(dbWrapper);

  const supabaseUrl = 'https://<ton-instance>.supabase.co';
  const supabaseKey = '<clé-service-role-ou-client>';
  const client = supabase.createClient(supabaseUrl, supabaseKey);

  async function fetchDocs() {
    const { data, error } = await client.from("documents").select("*");
    const list = document.getElementById("docList");
    list.innerHTML = "";
    data?.forEach(doc => {
      const div = document.createElement("div");
      div.className = "doc-entry";
      div.textContent = `📄 ${doc.file_id} – ${doc.content.slice(0, 60)}...`;
      list.appendChild(div);
    });
  }

  document.getElementById("uploadBtn").addEventListener("click", async () => {
    const file = document.getElementById("docUpload").files[0];
    if (!file) return alert("Aucun fichier sélectionné.");

    // Prévois un webhook N8N pour traiter le fichier, comme pour ton chatbot
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "file");

    await fetch("https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68", {
      method: "POST",
      body: formData,
    });

    alert("✅ Fichier envoyé pour traitement !");
    setTimeout(fetchDocs, 3000); // rechargement des docs après traitement
  });

  fetchDocs();
}
