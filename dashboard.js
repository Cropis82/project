document.addEventListener('DOMContentLoaded', () => {
    // 1. Controllo di sicurezza: se non sei loggato, fuori!
    const currentUser = localStorage.getItem('loggedUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Elementi UI
    const greeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-btn');
    const groupsContainer = document.getElementById('groups-container');

    // Mostra il nome in alto a destra
    greeting.textContent = currentUser;

    // 3. Logica di Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('loggedUser');
        window.location.href = 'index.html';
    });

    // 4. Variabile globale per i gruppi reali (inizialmente vuota)
    let userGroups = [];

    // 5. Generatore delle Carte HTML
    function renderGroups(groups) {
        groupsContainer.innerHTML = ''; // Pulisce il contenitore prima di disegnare

        if (groups.length === 0) {
            groupsContainer.innerHTML = '<p style="text-align: center; color: var(--theme-placeholder); padding: 20px;">Nessun gruppo trovato. Creane uno per iniziare!</p>';
            return;
        }

        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'group-card';

            // Calcoliamo i membri totali leggendo la lunghezza dell'array dal database
            const membriTotali = group.members ? group.members.length : 1;

            card.innerHTML = `
                <h3 class="group-name">${group.name}</h3>
                <div class="group-stats">
                    <div class="stat-item" title="Membri totali">
                        <span>👥 ${membriTotali}</span>
                    </div>
                    <div class="stat-item" title="Membri online">
                        <span class="online-dot"></span>
                        <span>${group.online_count || 1}</span> 
                    </div>
                </div>
            `;

            // Quando clicchi su un gruppo, ti porta alla sua pagina!
            card.addEventListener('click', () => {
                window.location.href = `group.html?id=${group.id}`;
            });

            groupsContainer.appendChild(card);
        });
    }

    // --- NUOVA LOGICA: Carica i gruppi dal Backend ---
    async function loadGroups() {
        try {
            const response = await fetch(`https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/groups/${currentUser}`);
            const data = await response.json();

            if (response.ok) {
                userGroups = data.gruppi; // Salviamo i dati reali dal DB
                renderGroups(userGroups); // Disegniamo le carte
            } else {
                console.error("Errore nel caricamento gruppi:", data.detail);
            }
        } catch (error) {
            console.error("Errore di connessione al server:", error);
            groupsContainer.innerHTML = '<p style="color: red; text-align: center;">Errore di connessione al server.</p>';
        }
    }

    // Chiamiamo la funzione per scaricare i gruppi appena la pagina si apre
    loadGroups();

    // --- NUOVA LOGICA: Filtro di ricerca locale ---
    const localSearchInput = document.getElementById('local-search-input');

    localSearchInput.addEventListener('input', (event) => {
        // Prende quello che scrivi e lo trasforma in minuscolo
        const termineRicerca = event.target.value.toLowerCase();

        // Filtra l'array dei gruppi
        const gruppiFiltrati = userGroups.filter(gruppo =>
            gruppo.name.toLowerCase().includes(termineRicerca)
        );

        // Ridisegna la lista usando solo i gruppi che corrispondono alla ricerca!
        renderGroups(gruppiFiltrati);
    });

    // --- LOGICA MODALE IMPOSTAZIONI ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const colorCubes = document.querySelectorAll('.color-cube');

    // Apri il popup
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    // Chiudi il popup dalla "X"
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Chiudi il popup cliccando fuori dalla finestra bianca
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // --- LOGICA MODALE CREAZIONE GRUPPO ---
    const createGroupBtn = document.getElementById('create-group-btn');
    const createGroupModal = document.getElementById('create-group-modal');
    const closeCreateGroupBtn = document.getElementById('close-create-group');
    const submitGroupBtn = document.getElementById('submit-create-group');

    // Apri modale
    createGroupBtn.addEventListener('click', () => {
        createGroupModal.classList.remove('hidden');
    });

    // Chiudi modale (con la X o cliccando fuori)
    closeCreateGroupBtn.addEventListener('click', () => createGroupModal.classList.add('hidden'));
    createGroupModal.addEventListener('click', (event) => {
        if (event.target === createGroupModal) {
            createGroupModal.classList.add('hidden');
        }
    });

    // Invio Dati al Backend
    submitGroupBtn.addEventListener('click', async () => {
        const name = document.getElementById('group-name').value.trim();
        const description = document.getElementById('group-desc').value.trim();
        const access = document.getElementById('group-access').value;
        const permissions = document.getElementById('group-permissions').value;

        if (!name) {
            alert("Il nome del gruppo è obbligatorio!");
            return;
        }

        try {
            // Sostituisci l'URL con il tuo link GitHub Codespaces se necessario
            const response = await fetch('https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/groups/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    access: access,
                    permissions: permissions,
                    owner: currentUser // Questa variabile esiste già all'inizio del tuo file!
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("🎉 " + data.messaggio);
                createGroupModal.classList.add('hidden');

                document.getElementById('group-name').value = '';
                document.getElementById('group-desc').value = '';

                // --- NUOVA RIGA: Ricarica i gruppi per mostrare subito quello nuovo! ---
                loadGroups();

            } else {
                alert("Errore: " + data.detail);
            }
        } catch (error) {
            console.error("Errore di connessione:", error);
            alert("Errore di comunicazione col server.");
        }
    });

    // --- IL MOTORE DEI TEMI ---

    // 1. Definiamo le palette di colori per ogni tema
    const themePalettes = {
        default: {
            '--theme-bg': '#fff5ef',
            '--theme-surface': '#f0e4db',
            '--theme-border': '#e0d5ce',
            '--theme-primary': '#f6b36b',
            '--theme-primary-glow': 'rgba(246, 179, 107, 0.6)',
            '--theme-placeholder': '#8c9fa8',
            '--theme-card-text': '#132933',
            '--theme-text': '#132933',        // Testo scuro
            '--theme-header-bg': '#132933'    // Header scuro
        },
        dark: {
            '--theme-bg': '#1a1a2e',
            '--theme-surface': '#16213e',
            '--theme-border': '#0f3460',
            '--theme-primary': '#e94560',     // Rosso corallo
            '--theme-primary-glow': 'rgba(233, 69, 96, 0.6)',
            '--theme-placeholder': '#536a82',
            '--theme-card-text': '#ffffff',   // Testo bianco nelle carte
            '--theme-text': '#e0e0e0',        // Testo chiaro per il body
            '--theme-header-bg': '#0f3460'    // Header blu notte
        },
        ocean: {
            '--theme-bg': '#e3f2fd',
            '--theme-surface': '#bbdefb',
            '--theme-border': '#90caf9',
            '--theme-primary': '#2196f3',
            '--theme-primary-glow': 'rgba(33, 150, 243, 0.6)',
            '--theme-placeholder': '#64b5f6',
            '--theme-card-text': '#ffffff',
            '--theme-text': '#0d47a1',
            '--theme-header-bg': '#0d47a1'
        },
        forest: {
            '--theme-bg': '#f1f8e9',
            '--theme-surface': '#dcedc8',
            '--theme-border': '#c5e1a5',
            '--theme-primary': '#8bc34a',
            '--theme-primary-glow': 'rgba(139, 195, 74, 0.6)',
            '--theme-placeholder': '#9ccc65',
            '--theme-card-text': '#ffffff',
            '--theme-text': '#33691e',
            '--theme-header-bg': '#33691e'
        },
        minimal: {
            '--theme-bg': '#ffffff',
            '--theme-surface': '#f5f5f5',
            '--theme-border': '#e0e0e0',
            '--theme-primary': '#9e9e9e',
            '--theme-primary-glow': 'rgba(158, 158, 158, 0.6)',
            '--theme-placeholder': '#bdbdbd',
            '--theme-card-text': '#ffffff',
            '--theme-text': '#212121',
            '--theme-header-bg': '#212121'
        }
    };

    // 2. Funzione per applicare i colori al CSS
    function applyTheme(themeName) {
        const palette = themePalettes[themeName];
        if (!palette) return;

        for (const [variable, color] of Object.entries(palette)) {
            document.documentElement.style.setProperty(variable, color);
        }
    }

    // 3. Gestione Selezione e Salvataggio (Aggiornata)
    const themeOptions = document.querySelectorAll('.theme-option');
    const savedTheme = localStorage.getItem('notesgo_theme') || 'default';

    // Applica subito il tema salvato quando apri la pagina
    applyTheme(savedTheme);

    themeOptions.forEach(option => {
        const themeName = option.getAttribute('data-theme');
        const cube = option.querySelector('.color-cube');

        // Evidenzia il cubo giusto all'avvio
        if (themeName === savedTheme) {
            cube.classList.add('selected');
        } else {
            cube.classList.remove('selected');
        }

        // Quando clicchi su un nuovo cubo...
        // Quando clicchi su un nuovo cubo...
        cube.addEventListener('click', async () => {
            // Spegni tutti i cubi
            document.querySelectorAll('.color-cube').forEach(c => c.classList.remove('selected'));
            // Accendi solo quello cliccato
            cube.classList.add('selected');

            // Salva la scelta in locale
            localStorage.setItem('notesgo_theme', themeName);

            // APPLICA I COLORI ALL'ISTANTE!
            applyTheme(themeName);

            // --- NUOVA PARTE: Inviamo il salvataggio a FastAPI ---
            try {
                const response = await fetch('https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/update_theme', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: currentUser,
                        theme: themeName
                    })
                });
                const data = await response.json();
                console.log(data.messaggio); // Mostra nella console se ha salvato con successo
            } catch (error) {
                console.error("Errore durante il salvataggio del tema nel database:", error);
            }
        });
    });

    // --- SISTEMA DI HEARTBEAT (Utenti Online) ---
    
    // Funzione che invia il segnale al server
    async function sendHeartbeat() {
        if (!currentUser) return;
        
        try {
            await fetch('https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            // Non serve mostrare nulla, è un processo silenzioso in background
        } catch (error) {
            console.error("Errore Heartbeat:", error);
        }
    }

    // 1. Manda subito un segnale appena apri la dashboard
    sendHeartbeat();

    // 2. Continua a mandarlo ogni 60 secondi (60000 millisecondi)
    setInterval(sendHeartbeat, 60000);

    // 3. Ricarica la lista dei gruppi ogni 60 secondi così il numero degli online
    // si aggiorna visivamente senza che tu debba ricaricare la pagina con F5!
    setInterval(loadGroups, 60000);
});