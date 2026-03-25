from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tinydb import TinyDB, Query
import uuid
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
groups_table = db.table('groups') # Creiamo una tabella separata per i gruppi
UserQuery = Query()

class UserAuth(BaseModel):
    username: str
    password: str

class ThemeUpdate(BaseModel):
    username: str
    theme: str

class GroupCreate(BaseModel):
    name: str
    description: str
    access: str
    permissions: str
    owner: str # Il creatore del gruppo

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
    result = users_table.search(UserQuery.username == user.username)
    if not result:
        raise HTTPException(status_code=401, detail="Nome utente o password errati")
    
    stored_user = result[0]
    password_corretta = bcrypt.checkpw(
        user.password.encode('utf-8'), 
        stored_user['password'].encode('utf-8')
    )
    if not password_corretta:
        raise HTTPException(status_code=401, detail="Nome utente o password errati")
    
    # Recuperiamo il tema salvato (se non c'è, usiamo 'default')
    tema_salvato = stored_user.get('impostazioni', {}).get('tema', 'default')
    
    # Restituiamo il tema insieme al messaggio di successo!
    return {
        "status": "successo", 
        "messaggio": "Login effettuato con successo!",
        "tema": tema_salvato
    }

@app.post("/api/update_theme")
def update_theme(data: ThemeUpdate):
    result = users_table.search(UserQuery.username == data.username)
    if not result:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    user_data = result[0]
    
    # Assicuriamoci che esista la chiave impostazioni, poi cambiamo il tema
    if 'impostazioni' not in user_data:
        user_data['impostazioni'] = {}
        
    user_data['impostazioni']['tema'] = data.theme
    
    # Aggiorniamo il TinyDB
    users_table.update({'impostazioni': user_data['impostazioni']}, UserQuery.username == data.username)
    
    return {"status": "successo", "messaggio": "Tema aggiornato nel database!"}

@app.get("/api/user/{username}")
def get_user_profile(username: str):
    # Cerca l'utente nel TinyDB
    result = users_table.search(UserQuery.username == username)
    
    if not result:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # --- LA SOLUZIONE È QUI ---
    # Creiamo una COPIA del dizionario, così non tocchiamo la memoria di TinyDB!
    user_data = dict(result[0]) 
    
    # Ora possiamo rimuovere la password dalla copia in tutta sicurezza
    if 'password' in user_data:
        del user_data['password']
        
    return {"status": "successo", "dati": user_data}

@app.post("/api/groups/create")
def create_group(group: GroupCreate):
    if not group.name.strip():
        raise HTTPException(status_code=400, detail="Il nome del gruppo è obbligatorio")

    # Generiamo un ID univoco globale
    group_id = str(uuid.uuid4())
    
    # Creiamo l'oggetto da salvare nel database
    new_group = {
        "id": group_id,
        "name": group.name,
        "description": group.description,
        "access": group.access,
        "permissions": group.permissions,
        "owner": group.owner,
        # L'array members conterrà gli username. Il creatore è il primo membro!
        "members": [group.owner] 
    }
    
    # Salviamo nel TinyDB
    groups_table.insert(new_group)
    
    return {"status": "successo", "messaggio": f"Gruppo '{group.name}' creato!", "group_id": group_id}