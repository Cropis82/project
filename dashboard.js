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

    // 4. DATI FITTIZI: Simuliamo i gruppi dal database per testare l'estetica
    const userGroups = [
        { id: 1, name: "Sviluppo NotesGO", totalMembers: 5, online: 3 },
        { id: 2, name: "Progetto Università - Reti", totalMembers: 12, online: 4 },
        { id: 3, name: "Gruppo di Studio Python", totalMembers: 45, online: 12 },
        { id: 4, name: "Lista della Spesa Condivisa", totalMembers: 2, online: 1 }
    ];

    // 5. Generatore delle Carte HTML
    function renderGroups(groups) {
        groupsContainer.innerHTML = ''; // Pulisce il contenitore prima di disegnare

        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'group-card';

            card.innerHTML = `
                <h3 class="group-name">${group.name}</h3>
                <div class="group-stats">
                    <div class="stat-item" title="Membri totali">
                        <span>👥 ${group.totalMembers}</span>
                    </div>
                    <div class="stat-item" title="Membri online">
                        <span class="online-dot"></span>
                        <span>${group.online}</span>
                    </div>
                </div>
            `;

            // Quando clicchi su un gruppo
            card.addEventListener('click', () => {
                alert(`Entrando nel gruppo: "${group.name}"\n\n(Qui in futuro caricheremo la Kanban Board e la Chat!)`);
            });

            groupsContainer.appendChild(card);
        });
    }

    // Disegniamo i gruppi all'avvio
    renderGroups(userGroups);

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
});