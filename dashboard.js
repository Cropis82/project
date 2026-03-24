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
});