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

    // --- GESTIONE SELEZIONE TEMA (Con salvataggio in localStorage) ---
    const themeOptions = document.querySelectorAll('.theme-option');

    // 1. Controlla se c'è un tema salvato, altrimenti usa 'default'
    const savedTheme = localStorage.getItem('notesgo_theme') || 'default';

    themeOptions.forEach(option => {
        const themeName = option.getAttribute('data-theme');
        const cube = option.querySelector('.color-cube');
        
        // 2. Al caricamento, illumina il cubo del tema salvato
        if (themeName === savedTheme) {
            cube.classList.add('selected');
        } else {
            cube.classList.remove('selected');
        }

        // 3. Quando clicchi su un nuovo cubo...
        cube.addEventListener('click', () => {
            // Spegni tutti i cubi
            document.querySelectorAll('.color-cube').forEach(c => c.classList.remove('selected'));
            
            // Accendi solo quello cliccato
            cube.classList.add('selected');
            
            // Salva la nuova scelta nella memoria del browser!
            localStorage.setItem('notesgo_theme', themeName);
        });
    });
});