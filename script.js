document.addEventListener('DOMContentLoaded', async () => {
    // 1. CONTROLLO ACCESSO
    const currentUser = localStorage.getItem('loggedUser');
    
    // Se non c'è nessun utente salvato, riportalo al login
    if (!currentUser) {
        window.location.href = 'index.html';
        return; // Ferma l'esecuzione dello script
    }

    // Elementi UI per l'utente
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const jsonOutput = document.getElementById('jsonOutput');

    // 2. CARICAMENTO DATI DAL TINYDB
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/user/${currentUser}`);
        if (response.ok) {
            const data = await response.json();
            welcomeMessage.textContent = `Ciao, ${data.dati.username}!`;
            
            // Per farti vedere che funziona, stampiamo i dati dell'utente dal TinyDB nel box JSON
            jsonOutput.textContent = "Dati account caricati dal TinyDB:\n\n" + JSON.stringify(data.dati, null, 4);
        } else {
            // Se c'è un errore (es. utente cancellato dal db), forza il logout
            logoutBtn.click();
        }
    } catch (error) {
        welcomeMessage.textContent = `Errore di connessione`;
    }

    // 3. LOGICA DI LOGOUT
    logoutBtn.addEventListener('click', () => {
        // Strappa il tesserino
        localStorage.removeItem('loggedUser');
        // Torna alla pagina iniziale
        window.location.href = 'index.html';
    });

    // 4. VECCHIA LOGICA DEL TESTER API (rimane invariata)
    const fetchBtn = document.getElementById('fetchBtn');
    const apiUrlInput = document.getElementById('apiUrl');

    fetchBtn.addEventListener('click', async () => {
        const url = apiUrlInput.value.trim();
        if (!url) {
            jsonOutput.textContent = "Errore: Inserisci un URL valido.";
            return;
        }
        jsonOutput.textContent = "Chiamata in corso...";
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Errore HTTP: status ${response.status}`);
            const data = await response.json();
            jsonOutput.textContent = JSON.stringify(data, null, 4);
        } catch (error) {
            jsonOutput.textContent = `Errore: ${error.message}`;
        }
    });
});