from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tinydb import TinyDB, Query
import bcrypt # Nuova importazione per la criptazione

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = TinyDB('db.json')
users_table = db.table('users')
UserQuery = Query()

class UserAuth(BaseModel):
    username: str
    password: str

@app.get("/api/test")
def test_endpoint():
    return {"status": "successo", "messaggio": "Backend connesso correttamente!"}

@app.post("/api/register")
def register(user: UserAuth):
    if users_table.search(UserQuery.username == user.username):
        raise HTTPException(status_code=400, detail="Nome utente già in uso")
    
    # 1. Criptazione della password
    # Codifichiamo la password in byte, la "saliamo" e la criptiamo
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    users_table.insert({
        'username': user.username,
        # 2. Salviamo la password criptata decodificandola in stringa per il JSON
        'password': hashed_password.decode('utf-8'),
        'impostazioni': {
            'tema': 'dark',
            'notifiche': True
        }
    })
    return {"status": "successo", "messaggio": "Account creato con successo!"}

@app.post("/api/login")
def login(user: UserAuth):
    # 1. Cerchiamo SOLO per username (non possiamo cercare per password perché è criptata)
    result = users_table.search(UserQuery.username == user.username)
    
    # Se l'utente non esiste
    if not result:
        raise HTTPException(status_code=401, detail="Nome utente o password errati")
    
    stored_user = result[0]
    
    # 2. Verifichiamo che la password inserita corrisponda all'hash salvato
    password_corretta = bcrypt.checkpw(
        user.password.encode('utf-8'), 
        stored_user['password'].encode('utf-8')
    )
    
    if not password_corretta:
        raise HTTPException(status_code=401, detail="Nome utente o password errati")
    
    return {"status": "successo", "messaggio": "Login effettuato con successo!"}

@app.get("/api/user/{username}")
def get_user_profile(username: str):
    # Cerca l'utente nel TinyDB
    result = users_table.search(UserQuery.username == username)
    
    if not result:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    user_data = result[0]
    
    # Rimuoviamo la password dai dati prima di inviarli al frontend!
    if 'password' in user_data:
        del user_data['password']
        
    return {"status": "successo", "dati": user_data}