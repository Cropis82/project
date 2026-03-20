document.addEventListener('DOMContentLoaded', () => {
    // Elementi UI
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');

    // Cambia tra Login e Registrazione
    showRegisterBtn.addEventListener('click', () => {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });

    showLoginBtn.addEventListener('click', () => {
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });

    // --- LOGICA DI REGISTRAZIONE ---
    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        const messageEl = document.getElementById('register-message');

        if (!username || !password) {
            mostraMessaggio(messageEl, 'Compila tutti i campi', 'error');
            return;
        }

        if (password !== confirmPassword) {
            mostraMessaggio(messageEl, 'Le password non coincidono!', 'error');
            return;
        }

        try {
            const response = await fetch('https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                mostraMessaggio(messageEl, data.messaggio, 'success');
                // Torna al login dopo 1.5 secondi
                setTimeout(() => showLoginBtn.click(), 1500);
            } else {
                mostraMessaggio(messageEl, data.detail, 'error');
            }
        } catch (error) {
            mostraMessaggio(messageEl, 'Errore di connessione al server', 'error');
        }
    });

    // --- LOGICA DI LOGIN ---
    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const messageEl = document.getElementById('login-message');

        if (!username || !password) {
            mostraMessaggio(messageEl, 'Inserisci nome utente e password', 'error');
            return;
        }

        try {
            const response = await fetch('https://silver-cod-q7pp7qqj9wrvh44qw-8000.app.github.dev/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                mostraMessaggio(messageEl, 'Accesso in corso...', 'success');
                // Reindirizza alla pagina del tester
                setTimeout(() => {
                    window.location.href = 'tester.html';
                }, 1000);
            } else {
                mostraMessaggio(messageEl, data.detail, 'error');
            }
        } catch (error) {
            mostraMessaggio(messageEl, 'Errore di connessione al server', 'error');
        }
    });

    // Funzione helper per mostrare messaggi
    function mostraMessaggio(elemento, testo, tipo) {
        elemento.textContent = testo;
        elemento.className = `message ${tipo}`;
    }
});