from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tinydb import TinyDB, Query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializza il database
db = TinyDB('db.json')
# Creiamo una tabella specifica per gli utenti
users_table = db.table('users')
UserQuery = Query()

# Modelli per ricevere i dati dal frontend
class UserAuth(BaseModel):
    username: str
    password: str

# Endpoint di test originale
@app.get("/api/test")
def test_endpoint():
    return {"status": "successo", "messaggio": "Backend connesso correttamente!"}

# Endpoint per la Registrazione
@app.post("/api/register")
def register(user: UserAuth):
    # Controlla se l'utente esiste già
    if users_table.search(UserQuery.username == user.username):
        raise HTTPException(status_code=400, detail="Nome utente già in uso")
    
    # Inserisce il nuovo utente con una sezione "impostazioni" pronta per il futuro
    users_table.insert({
        'username': user.username,
        'password': user.password,
        'impostazioni': {
            'tema': 'dark',
            'notifiche': True
        }
    })
    return {"status": "successo", "messaggio": "Account creato con successo!"}

# Endpoint per il Login
@app.post("/api/login")
def login(user: UserAuth):
    # Cerca un utente che corrisponda a username e password
    result = users_table.search((UserQuery.username == user.username) & (UserQuery.password == user.password))
    
    if not result:
        raise HTTPException(status_code=401, detail="Nome utente o password errati")
    
    return {"status": "successo", "messaggio": "Login effettuato con successo!"}