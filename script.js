document.addEventListener('DOMContentLoaded', () => {
    const fetchBtn = document.getElementById('fetchBtn');
    const apiUrlInput = document.getElementById('apiUrl');
    const jsonOutput = document.getElementById('jsonOutput');

    fetchBtn.addEventListener('click', async () => {
        const url = apiUrlInput.value.trim();

        if (!url) {
            jsonOutput.textContent = "Errore: Inserisci un URL valido prima di chiamare l'API.";
            return;
        }

        jsonOutput.textContent = "Chiamata in corso...";

        try {
            const response = await fetch(url);
            
            // Gestione di errori HTTP (es. 404 Not Found, 500 Internal Error)
            if (!response.ok) {
                throw new Error(`Errore HTTP: status ${response.status}`);
            }

            const data = await response.json();
            
            // Formatta il JSON con indentazione a 4 spazi per renderlo leggibile
            jsonOutput.textContent = JSON.stringify(data, null, 4);
            
        } catch (error) {
            jsonOutput.textContent = `Si è verificato un errore di rete o di fetch:\n${error.message}\n\nAssicurati che il backend sia acceso e l'URL sia corretto.`;
        }
    });
});