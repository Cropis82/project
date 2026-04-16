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

    // 7. Logica Impostazioni Gruppo (Solo Admin)
    const settingsModal = document.getElementById('settings-modal');
    const editGroupName = document.getElementById('edit-group-name');
    const editGroupDesc = document.getElementById('edit-group-desc');

    // Apri modale e pre-compila i campi
    settingsBtn.addEventListener('click', () => {
        editGroupName.value = document.getElementById('exp-group-name').textContent;
        const currentDesc = document.getElementById('exp-group-desc').textContent;
        editGroupDesc.value = currentDesc === "Nessuna descrizione." ? "" : currentDesc;
        settingsModal.classList.remove('hidden');
    });

    document.getElementById('close-settings-modal').addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Salva modifiche
    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        const newName = editGroupName.value.trim();
        const newDesc = editGroupDesc.value.trim();

        if (!newName) {
            alert("Il nome del gruppo non può essere vuoto!");
            return;
        }

        try {
            const res = await fetch(`${backendUrl}/api/group/settings`, {
                method: 'PUT', // Usiamo PUT per gli aggiornamenti
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser,
                    group_id: groupId,
                    name: newName,
                    description: newDesc
                })
            });

            if (res.ok) {
                // Aggiorna l'interfaccia senza ricaricare la pagina!
                document.getElementById('body-group-name').textContent = newName;
                document.getElementById('exp-group-name').textContent = newName;
                document.getElementById('exp-group-desc').textContent = newDesc || "Nessuna descrizione.";
                settingsModal.classList.add('hidden');
            } else {
                const err = await res.json();
                alert("Errore: " + err.detail);
            }
        } catch (e) {
            console.error("Errore salvataggio:", e);
        }
    });

    // Elimina Gruppo
    document.getElementById('delete-group-btn').addEventListener('click', async () => {
        const confirmDelete = confirm("ATTENZIONE! Questa azione è irreversibile. Sei davvero sicuro di voler eliminare l'intero gruppo?");

        if (confirmDelete) {
            try {
                const res = await fetch(`${backendUrl}/api/group/delete`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser, group_id: groupId })
                });

                if (res.ok) {
                    alert("Gruppo eliminato con successo.");
                    window.location.href = 'dashboard.html';
                } else {
                    const err = await res.json();
                    alert("Errore: " + err.detail);
                }
            } catch (e) {
                console.error("Errore eliminazione:", e);
            }
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
        } catch (e) { }
    }, 60000);

    // =========================================
    // WEBSOCKET E KANBAN BOARD LOGIC
    // =========================================
    const kanbanBoard = document.getElementById('kanban-board');
    const addColContainer = document.getElementById('add-column-container');
    const columnModal = document.getElementById('column-modal');
    const colTitleInput = document.getElementById('col-title');
    const colColorInput = document.getElementById('col-color');
    const editColIdInput = document.getElementById('edit-col-id');
    const saveColBtn = document.getElementById('save-column-btn');

    // Configura WebSocket (adatta la porta se necessario)
    const wsUrl = `wss://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/ws/group/${groupId}/${currentUser}`;
    let ws = new WebSocket(wsUrl);

    // LOG DI DEBUG - Aggiungi questi per capire cosa succede
    ws.onopen = () => console.log("✅ WebSocket Connesso con successo!");
    ws.onerror = (error) => console.error("❌ Errore WebSocket. Controlla il tab 'Network'.", error);
    ws.onclose = (e) => console.warn("⚠️ WebSocket Disconnesso:", e.code, e.reason);

    let columnsData = [];
    let dragSrcEl = null;

    // Gestione messaggi in entrata
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const action = msg.action;
        const payload = msg.data;

        switch (msg.action) {
            case 'init_columns':
                columnsData = msg.data;
                renderBoard();
                break;
            case 'column_created':
                columnsData.push(msg.data);
                renderBoard();
                break;
            case 'column_updated':
                const index = columnsData.findIndex(c => c.id === msg.data.id);
                if (index > -1) {
                    columnsData[index].title = msg.data.title;
                    columnsData[index].color = msg.data.color;
                    renderBoard();
                }
                break;
            case 'column_deleted':
                columnsData = columnsData.filter(c => c.id !== msg.data);
                renderBoard();
                break;
            case 'columns_reordered':
                const newOrder = msg.data;
                // IL FIX: Ora aggiorniamo il parametro 'order' per ogni colonna
                // in modo che corrisponda alla nuova posizione scelta.
                columnsData.forEach(col => {
                    col.order = newOrder.indexOf(col.id);
                });
                // Ora possiamo ridisegnare tranquillamente!
                renderBoard();
                break;
            case "init_tasks":
                // Riceviamo tutti i task all'accesso
                tasksData = payload;
                renderBoard(); // Ridisegna la lavagna per far apparire i task
                ;
            case "task_created":
                // Qualcuno (o noi) ha creato un nuovo task
                tasksData.push(payload);
                renderBoard();
                ;
            case "task_moved":
                // Aggiorniamo la colonna del task spostato
                const taskIndex = tasksData.findIndex(t => t.id === payload.task_id);
                if (taskIndex !== -1) {
                    tasksData[taskIndex].column_id = payload.new_column_id;
                    renderBoard();
                }
                ;
            case "task_deleted":
                // Rimuoviamo il task dall'array
                tasksData = tasksData.filter(t => t.id !== payload.task_id);
                renderBoard();

                // Se stavamo guardando proprio quel task, chiudiamo il modale
                if (currentTaskInView && currentTaskInView.id === payload.task_id) {
                    document.getElementById('task-view-modal').classList.add('hidden');
                }
                ;
        }
    };

    ws.onclose = () => {
        console.warn("WebSocket disconnesso. Implementare la riconnessione automatica in futuro.");
    };

    // Renderizza le colonne nell'HTML
    function renderBoard() {
        // Rimuovi tutte le colonne esistenti ma mantieni il bottone "+"
        const existingCols = document.querySelectorAll('.kanban-column');
        existingCols.forEach(col => col.remove());

        // Ordina l'array per sicurezza (l'order definisce la posizione da sinistra a destra)
        columnsData.sort((a, b) => a.order - b.order);

        columnsData.forEach(col => {
            const colEl = document.createElement('div');
            colEl.className = 'kanban-column';
            colEl.setAttribute('data-id', col.id);
            colEl.draggable = true;

            // Nuova struttura HTML con il contenitore per il titolo
            colEl.innerHTML = `
                <div class="column-header" style="background-color: ${col.color};">
                    <div class="title-container">
                        <span class="column-title-text">${col.title}</span>
                    </div>
                    <div class="column-actions">
                        <button class="column-btn edit-col-btn" title="Modifica">✏️</button>
                        <button class="column-btn delete-col-btn" title="Elimina">🗑️</button>
                    </div>
                </div>
                <div class="column-body" style="padding: 10px; flex-grow: 1;"></div>
            `;

            renderTasksForColumn(col.id, colEl);

            // ... (I tuoi vecchi event listener per Drag&Drop e Bottoni rimangono uguali qui) ...
            colEl.addEventListener('dragstart', handleDragStart);
            colEl.addEventListener('dragover', handleDragOver);
            colEl.addEventListener('dragleave', handleDragLeave);
            colEl.addEventListener('drop', handleDrop);
            colEl.addEventListener('dragend', handleDragEnd);

            colEl.querySelector('.edit-col-btn').addEventListener('click', () => openColumnModal(col));
            colEl.querySelector('.delete-col-btn').addEventListener('click', () => {
                if (confirm("Vuoi davvero eliminare questa colonna e tutto il suo contenuto?")) {
                    ws.send(JSON.stringify({ action: "delete_column", payload: { id: col.id } }));
                }
            });

            // 1. Inseriamo la colonna nel DOM (Fondamentale farlo PRIMA di misurare)
            kanbanBoard.insertBefore(colEl, addColContainer);

            // 2. Misuriamo il testo: se sfora, attiviamo lo scrolling!
            const titleContainer = colEl.querySelector('.title-container');
            const titleText = colEl.querySelector('.column-title-text');

            // Se la larghezza reale del testo è maggiore del suo contenitore visibile...
            if (titleText.scrollWidth > titleContainer.clientWidth) {
                // Calcoliamo quanti pixel extra ci sono da far scorrere
                const scrollDistance = titleText.scrollWidth - titleContainer.clientWidth;
                // Passiamo la distanza calcolata al CSS tramite una variabile custom
                titleText.style.setProperty('--scroll-dist', `-${scrollDistance}px`);
                titleText.classList.add('scrolling-text');
            }

            // --- 4. DROPZONE SULLE COLONNE ---
            // Aggiungi questi listener all'elemento `.column-body` quando lo crei nel JS

            colEl.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));

                    // Se stiamo droppando un TASK (e non una colonna)
                    if (data.type === 'task') {
                        const targetColumnId = col.id; // L'ID della colonna di destinazione

                        // --- 1. AGGIORNAMENTO VISIVO ISTANTANEO (Addio effetto elastico!) ---
                        const draggedTaskEl = document.querySelector(`[data-task-id="${data.id}"]`);
                        if (draggedTaskEl) {
                            colEl.appendChild(draggedTaskEl); // Sposta fisicamente l'HTML nella nuova colonna
                        }

                        // --- 2. AGGIORNA L'ARRAY LOCALE ---
                        const taskIndex = tasksData.findIndex(t => t.id === data.id);
                        if (taskIndex !== -1) {
                            // Se il task era già in questa colonna, non fare nulla
                            if (tasksData[taskIndex].column_id === targetColumnId) return;

                            tasksData[taskIndex].column_id = targetColumnId;
                        }

                        // --- 3. AVVISA IL SERVER ---
                        ws.send(JSON.stringify({
                            action: "move_task",
                            payload: {
                                task_id: data.id,
                                new_column_id: targetColumnId
                            }
                        }));
                    }
                } catch (err) {
                    console.error("Errore nel drop del task:", err);
                }
            });
        });
    }

    // Modal Handlers
    document.getElementById('add-column-btn').addEventListener('click', () => openColumnModal());
    document.getElementById('close-column-modal').addEventListener('click', () => columnModal.classList.add('hidden'));

    function openColumnModal(colData = null) {
        if (colData) {
            document.getElementById('column-modal-title').textContent = "Modifica Colonna";
            colTitleInput.value = colData.title;
            colColorInput.value = colData.color;
            editColIdInput.value = colData.id;
        } else {
            document.getElementById('column-modal-title').textContent = "Nuova Colonna";
            colTitleInput.value = "";
            colColorInput.value = "#f6b36b"; // Colore default
            editColIdInput.value = "";
        }
        columnModal.classList.remove('hidden');
    }

    saveColBtn.addEventListener('click', () => {
        const title = colTitleInput.value.trim();
        const color = colColorInput.value;
        const id = editColIdInput.value;

        if (!title) return alert("Inserisci un titolo.");

        if (id) {
            // Modifica colonna esistente
            ws.send(JSON.stringify({ action: "update_column", payload: { id, title, color } }));
        } else {
            // Crea nuova colonna alla fine dell'array
            const newOrder = columnsData.length;
            ws.send(JSON.stringify({ action: "create_column", payload: { title, color, order: newOrder } }));
        }

        columnModal.classList.add('hidden');
    });

    // =========================================
    // LOGICA DRAG AND DROP COLONNE
    // =========================================
    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.style.opacity = '0.4';
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault(); // Necessario per permettere il drop
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over');
        return false;
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();

        if (dragSrcEl !== this) {
            // Scambia visivamente gli elementi per reattività immediata
            const parent = this.parentNode;
            const srcNext = dragSrcEl.nextSibling;
            const thisNext = this.nextSibling;

            if (thisNext === dragSrcEl) {
                parent.insertBefore(dragSrcEl, this);
            } else if (srcNext === this) {
                parent.insertBefore(this, dragSrcEl);
            } else {
                parent.insertBefore(dragSrcEl, this);
            }

            // Calcola il nuovo ordine leggendo il DOM
            const newOrderIds = [];
            document.querySelectorAll('.kanban-column').forEach(col => {
                newOrderIds.push(col.getAttribute('data-id'));
            });

            // Invia al server il nuovo ordine
            ws.send(JSON.stringify({ action: "reorder_columns", payload: { order: newOrderIds } }));
        }
        return false;
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    // --- 1. VARIABILI GLOBALI ---
    let tasksData = []; // Questo andrà popolato dal tuo WebSocket!
    let currentTaskInView = null; // Salva il task attualmente aperto

    // --- 2. GESTIONE MODALI ---
    const globalAddTaskBtn = document.getElementById('global-add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeTaskModal = document.getElementById('close-task-modal');
    const taskColumnSelect = document.getElementById('task-column-select');

    // Apre il modale per creare un nuovo task
    globalAddTaskBtn.addEventListener('click', () => {
        document.getElementById('task-modal-title').innerText = "Nuovo Task";
        document.getElementById('edit-task-id').value = "";
        document.getElementById('task-title').value = "";
        document.getElementById('task-desc').value = "";
        document.getElementById('task-due-date').value = "";

        // Popola la tendina con le colonne attuali
        taskColumnSelect.innerHTML = columnsData.map(col =>
            `<option value="${col.id}">${col.title}</option>`
        ).join('');

        taskModal.classList.remove('hidden');
    });

    closeTaskModal.addEventListener('click', () => taskModal.classList.add('hidden'));

    // --- 3. RENDERING DEI TASK ---
    // Chiama questa funzione dentro la tua renderBoard(), dopo aver creato l'HTML della colonna
    function renderTasksForColumn(columnId, columnBodyElement) {
        const columnTasks = tasksData.filter(t => t.column_id === columnId);

        columnTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-card';
            taskEl.draggable = true;
            taskEl.dataset.taskId = task.id;

            taskEl.innerHTML = `
            <h4 class="task-title">${task.title}</h4>
            <div class="task-desc-preview">${task.description || "Nessuna descrizione."}</div>
            <div class="task-meta">
                <span>👤 ${task.creator}</span>
                <span>${task.due_date ? '🕒 ' + task.due_date : ''}</span>
            </div>
        `;

            // DRAG & DROP DEI TASK
            taskEl.addEventListener('dragstart', (e) => {
                e.stopPropagation(); // IMPORTANTE: Blocca il drag della colonna genitore!
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'task', id: task.id }));
                setTimeout(() => taskEl.classList.add('is-dragging'), 0);
            });

            taskEl.addEventListener('dragend', (e) => {
                e.stopPropagation();
                taskEl.classList.remove('is-dragging');
            });

            // CLICK PER VISUALIZZARE I DETTAGLI
            taskEl.addEventListener('click', () => openTaskViewModal(task));

            columnBodyElement.appendChild(taskEl);
        });
    }
    document.getElementById('save-task-btn').addEventListener('click', () => {
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const dueDate = document.getElementById('task-due-date').value;
        const columnId = document.getElementById('task-column-select').value;

        if (!title.trim()) {
            alert("Il titolo del task è obbligatorio!");
            return;
        }

        // Invia al backend tramite WebSocket
        ws.send(JSON.stringify({
            action: "create_task",
            payload: {
                title: title,
                description: desc,
                due_date: dueDate,
                column_id: columnId
            }
        }));

        // Chiudi il modale
        taskModal.classList.add('hidden');
    });
    // --- FUNZIONE PER MASSIMIZZARE IL TASK ---
    function openTaskViewModal(task) {
        // 1. Salviamo il task nella variabile globale (ci servirà poi per modificarlo o eliminarlo)
        currentTaskInView = task;

        // 2. Riempiamo i campi del modale con i dati del task
        document.getElementById('view-task-title').innerText = task.title;
        document.getElementById('view-task-creator').innerText = task.creator;

        // Se c'è una data la mostriamo, altrimenti scriviamo "Nessuna"
        document.getElementById('view-task-due').innerText = task.due_date ? task.due_date : "Nessuna";

        // Inseriamo la descrizione. Usiamo innerText per mantenere la sicurezza ed evitare bug con l'HTML
        document.getElementById('view-task-desc').innerText = task.description || "Nessuna descrizione fornita per questo task.";

        // 3. Mostriamo il modale togliendo la classe 'hidden'
        document.getElementById('task-view-modal').classList.remove('hidden');
    }

    // Event Listener per chiudere il modale di visualizzazione
    document.getElementById('close-task-view-modal').addEventListener('click', () => {
        document.getElementById('task-view-modal').classList.add('hidden');
        currentTaskInView = null; // Resettiamo la variabile
    });

    document.getElementById('delete-task-btn').addEventListener('click', () => {
        if (!currentTaskInView) return;

        // Avvisiamo il server
        ws.send(JSON.stringify({
            action: "delete_task",
            payload: { task_id: currentTaskInView.id }
        }));

        // Chiudiamo il modale
        document.getElementById('task-view-modal').classList.add('hidden');

    });
});