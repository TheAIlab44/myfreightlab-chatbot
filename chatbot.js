// ✅ Chatbot.js complet avec prompts repliables, fermeture auto, injection drag&drop et icône ampoule

document.addEventListener("DOMContentLoaded", () => {
  const webhookURL = "https://myfreightlab.app.n8n.cloud/webhook/0503eb30-8f11-4294-b879-f3823c3faa68";

  const promptCategories = [
    {
      title: "Opérations logistiques",
      prompts: [
        "Tu peux m’optimiser un itinéraire express entre Shanghai et Anvers ?",
        "Quel est le plus rapide entre bateau, train ou avion pour l’Asie–Europe ?",
        "Un hub à Rotterdam, c’est une bonne idée pour livrer l’Allemagne ?",
        "Comment je peux gagner du temps sur mes transits intercontinentaux ?",
        "Quels sont les pièges à éviter avec une chaîne logistique multi-clients ?"
      ]
    },
    {
      title: "Commerce international",
      prompts: [
        "J’exporte au Canada, tu me dis les formalités à prévoir ?",
        "J’ai une import du Vietnam à simuler, tu peux me faire la déclaration douanière ?",
        "FOB, CIF… tu me recommandes quoi comme Incoterm avec un fournisseur indien ?",
        "J’ai besoin d’une instruction claire pour mon transitaire, tu peux me rédiger ça ?",
        "C’est quoi les docs obligatoires pour un contrat CIF vers l’Afrique de l’Ouest ?"
      ]
    },
    {
      title: "Veille & analyses",
      prompts: [
        "Le conflit en mer Rouge, ça change quoi pour le fret ?",
        "Tu peux me résumer les nouvelles règles UE sur la décarbonation du transport ?",
        "Quels indicateurs je dois suivre pour anticiper une hausse de coûts logistiques ?",
        "Tu peux me faire une analyse SWOT sur l’axe Europe–Asie centrale ?",
        "Comment je lis les chiffres d’empreinte carbone d’un trajet multimodal ?"
      ]
    },
    {
      title: "Marché & tendances",
      prompts: [
        "C’est quoi les grandes tendances logistiques à suivre en 2025 ?",
        "Y’a des innovations logistiques cools dans l’agroalimentaire ?",
        "Tu m’expliques comment l’IA aide à mieux gérer les stocks ?",
        "Comment les prix du transport maritime ont évolué depuis le COVID ?",
        "Quels sont les marchés du fret à surveiller en ce moment ?"
      ]
    },
    {
      title: "Stratégie & gestion",
      prompts: [
        "T’as des idées pour faire baisser les coûts logistiques d’une PME ?",
        "Tu peux me faire un tableau de bord avec les KPIs logistiques essentiels ?",
        "Quels investissements je priorise dans ma supply chain sous pression ?",
        "Tu m’aides à bâtir un plan B logistique en cas de crise géopolitique ?",
        "Comment mieux bosser ensemble entre achats, logistique et commerce ?"
      ]
    },
    {
      title: "Cas pratiques & simulations",
      prompts: [
        "Je te balance une liasse documentaire, tu me fais le résumé ?",
        "À partir de ces docs, tu peux me créer une fiche de transport ?",
        "Et si mon conteneur est bloqué en douane, on fait quoi ?",
        "Tu vérifies si mon dossier import-export est conforme aux règles UE ?",
        "Tu peux me faire une synthèse des documents logistiques à traiter ?"
      ]
    }
  ];

  const wrapper = document.createElement("div");
  wrapper.id = "chat-wrapper";
  wrapper.innerHTML = `
    <style>
      .dynamic-sidebar.open { right: 0; }
      .prompt-list { padding-left: 10px; }
      .category-title { margin-top: 10px; font-weight: bold; cursor: pointer; }
      .prompt { background: #f4f4f4; margin: 5px 0; padding: 8px; border-radius: 6px; cursor: grab; }
      .prompt:hover { background: #e6f0ff; }
      .floating-toggle { position: fixed; top: 50%; right: 0; transform: translateY(-50%); background-color: #0073e6; color: white; padding: 10px; border-radius: 8px 0 0 8px; cursor: pointer; z-index: 10000; font-weight: bold; }
      .dynamic-sidebar { position: fixed; top: 0; right: -300px; width: 300px; height: 100vh; background: #fff; border-left: 2px solid #ccc; box-shadow: -4px 0 10px rgba(0,0,0,0.1); z-index: 9999; overflow-y: auto; padding: 15px; }
    </style>
    <div class="floating-toggle" id="togglePrompt">💡</div>
    <div class="dynamic-sidebar" id="promptPanel">
      <div style="font-weight:bold;font-size:16px;margin-bottom:10px;">💡 Idées de prompts</div>
      <div id="promptContent"></div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const userInput = document.querySelector('#userInput') || document.querySelector('textarea, input[type="text"]');
  const sendBtn = document.querySelector('#sendBtn');
  const sidebar = document.getElementById('promptPanel');
  const toggleBtn = document.getElementById('togglePrompt');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  const promptContainer = document.getElementById('promptContent');

  promptCategories.forEach(category => {
    const catBlock = document.createElement('div');
    const title = document.createElement('div');
    title.classList.add('category-title');
    title.innerText = `▶️ ${category.title}`;

    const list = document.createElement('div');
    list.classList.add('prompt-list');
    list.style.display = 'none';

    category.prompts.forEach(text => {
      const promptEl = document.createElement('div');
      promptEl.className = 'prompt';
      promptEl.draggable = true;
      promptEl.innerText = text;

      promptEl.addEventListener('click', () => {
        userInput.value = text;
        userInput.focus();
      });

      promptEl.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', text);
        sidebar.classList.remove('open');
      });

      list.appendChild(promptEl);
    });

    title.addEventListener('click', () => {
      const isOpen = list.style.display === 'block';
      document.querySelectorAll('.prompt-list').forEach(l => l.style.display = 'none');
      document.querySelectorAll('.category-title').forEach(t => {
        if (t.innerText.startsWith('▼')) t.innerText = t.innerText.replace('▼', '▶️');
      });
      list.style.display = isOpen ? 'none' : 'block';
      title.innerText = isOpen ? `▶️ ${category.title}` : `▼ ${category.title}`;
    });

    catBlock.appendChild(title);
    catBlock.appendChild(list);
    promptContainer.appendChild(catBlock);
  });
});
