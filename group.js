document.addEventListener('DOMContentLoaded', async () => {
    // 1. Controlli base e Tema
    const currentUser = localStorage.getItem('loggedUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Applica il tema salvato con i colori completi
    const themePalettes = {
        default: { '--theme-bg': '#fff5ef', '--theme-surface': '#f0e4db', '--theme-border': '#e0d5ce', '--theme-primary': '#f6b36b', '--theme-primary-glow': 'rgba(246, 179, 107, 0.6)', '--theme-placeholder': '#8c9fa8', '--theme-card-text': '#132933', '--theme-text': '#132933', '--theme-header-bg': '#132933' },
        dark: { '--theme-bg': '#1a1a2e', '--theme-surface': '#16213e', '--theme-border': '#0f3460', '--theme-primary': '#e94560', '--theme-primary-glow': 'rgba(233, 69, 96, 0.6)', '--theme-placeholder': '#536a82', '--theme-card-text': '#ffffff', '--theme-text': '#e0e0e0', '--theme-header-bg': '#0f3460' },
        ocean: { '--theme-bg': '#e3f2fd', '--theme-surface': '#bbdefb', '--theme-border': '#90caf9', '--theme-primary': '#2196f3', '--theme-primary-glow': 'rgba(33, 150, 243, 0.6)', '--theme-placeholder': '#64b5f6', '--theme-card-text': '#ffffff', '--theme-text': '#0d47a1', '--theme-header-bg': '#0d47a1' },
        forest: { '--theme-bg': '#f1f8e9', '--theme-surface': '#dcedc8', '--theme-border': '#c5e1a5', '--theme-primary': '#8bc34a', '--theme-primary-glow': 'rgba(139, 195, 74, 0.6)', '--theme-placeholder': '#9ccc65', '--theme-card-text': '#ffffff', '--theme-text': '#33691e', '--theme-header-bg': '#33691e' },
        minimal: { '--theme-bg': '#ffffff', '--theme-surface': '#f5f5f5', '--theme-border': '#e0e0e0', '--theme-primary': '#9e9e9e', '--theme-primary-glow': 'rgba(158, 158, 158, 0.6)', '--theme-placeholder': '#bdbdbd', '--theme-card-text': '#ffffff', '--theme-text': '#212121', '--theme-header-bg': '#212121' }
    };

    const savedTheme = localStorage.getItem('notesgo_theme') || 'default';
    for (const [variable, color] of Object.entries(themePalettes[savedTheme])) {
        document.documentElement.style.setProperty(variable, color);
    }

    // Logo torna alla dashboard
    document.getElementById('logo-link').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // 2. Prendi l'ID del gruppo dall'URL (es. ?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');

    if (!groupId) {
        alert("Nessun gruppo specificato!");
        window.location.href = 'dashboard.html';
        return;
    }

    // Elementi UI
    const groupNameBody = document.getElementById('body-group-name');
    const settingsBtn = document.getElementById('group-settings-btn');
    const groupIdDisplay = document.getElementById('group-id-display');
    const backendUrl = 'https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev'; // Sostituisci se serve

    // 3. Carica i dati del gruppo
    try {
        const response = await fetch(`${backendUrl}/api/group/${groupId}`);
        const data = await response.json();

        if (response.ok) {
            const group = data.gruppo;

            // Popola l'interfaccia
            groupNameBody.textContent = group.name;
            document.getElementById('exp-group-name').textContent = group.name;
            document.getElementById('exp-group-desc').textContent = group.description || "Nessuna descrizione.";
            document.getElementById('exp-members-count').textContent = group.membri_dettagliati.length;
            groupIdDisplay.textContent = group.id;

            // Mostra bottone impostazioni solo se sei l'owner (o se i permessi lo consentono)
            if (group.owner === currentUser) {
                settingsBtn.classList.remove('hidden');
            }

            // Popola la lista membri
            const membersContainer = document.getElementById('members-container');
            group.membri_dettagliati.forEach(member => {
                const isOnline = member.online;
                membersContainer.innerHTML += `
                    <div class="member-item">
                        <span class="online-dot" style="background-color: ${isOnline ? '#4CAF50' : '#888'};"></span>
                        <span style="margin-left: 10px; color: var(--theme-text); font-weight: bold;">
                            ${member.username} ${member.username === group.owner ? '👑' : ''}
                        </span>
                    </div>
                `;
            });

        } else {
            alert("Errore: " + data.detail);
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error("Errore caricamento:", error);
    }

    // 4. Animazione Header Espanso
    const expandTrigger = document.getElementById('header-expand-trigger');
    const expandedInfo = document.getElementById('expanded-info');
    const hintText = document.getElementById('header-hint-text'); // Ora peschiamo l'elemento esatto
    let isExpanded = false;

    expandTrigger.addEventListener('click', () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
            expandedInfo.classList.add('active');
            hintText.textContent = '(Clicca per chiudere) ▲';
            hintText.style.opacity = '1';
        } else {
            expandedInfo.classList.remove('active');
            hintText.textContent = '(Clicca qui per info gruppo) ▼';
            hintText.style.opacity = '0.6';
        }
    });

    // 5. Logica Copia ID
    const showIdBtn = document.getElementById('show-id-btn');
    const idModal = document.getElementById('id-modal');
    
    showIdBtn.addEventListener('click', () => idModal.classList.remove('hidden'));
    document.getElementById('close-id-modal').addEventListener('click', () => idModal.classList.add('hidden'));
    
    // Copia negli appunti cliccando l'ID
    groupIdDisplay.addEventListener('click', () => {
        navigator.clipboard.writeText(groupId).then(() => {
            const msg = document.getElementById('copy-success-msg');
            msg.style.opacity = '1';
            setTimeout(() => msg.style.opacity = '0', 2000); // Scompare dopo 2 sec
        });
    });

    // 6. Logica Abbandona Gruppo
    const leaveBtn = document.getElementById('leave-group-btn');
    const leaveModal = document.getElementById('leave-modal');
    
    leaveBtn.addEventListener('click', () => leaveModal.classList.remove('hidden'));
    document.getElementById('close-leave-modal').addEventListener('click', () => leaveModal.classList.add('hidden'));

    document.getElementById('confirm-leave-btn').addEventListener('click', async () => {
        try {
            const res = await fetch(`${backendUrl}/api/groups/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, group_id: groupId })
            });
            if (res.ok) {
                window.location.href = 'dashboard.html'; // Torna alla home dopo l'uscita
            } else {
                alert("Errore durante l'uscita dal gruppo.");
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Mantieni vivo l'heartbeat anche in questa pagina!
    setInterval(async () => {
        if (!currentUser) return;
        try {
            await fetch(`${backendUrl}/api/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
        } catch (e) {}
    }, 60000);
});