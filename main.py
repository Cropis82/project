from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tinydb import TinyDB, Query
import uuid
import bcrypt # Nuova importazione per la criptazione
import time

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

class Heartbeat(BaseModel):
    username: str

# Modello per abbandonare un gruppo
class LeaveGroup(BaseModel):
    username: str
    group_id: str

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

# 3. MODIFICHIAMO LA ROTTA DEI GRUPPI
@app.get("/api/groups/{username}")
def get_user_groups(username: str):
    GroupQuery = Query()
    user_groups = groups_table.search(GroupQuery.members.test(lambda members: username in members))
    
    # --- NUOVA PARTE: Calcoliamo gli online ---
    current_time = time.time()
    SOGLIA_ONLINE = 120 # Se l'ultimo ping è stato entro 120 secondi (2 minuti), è online

    for group in user_groups:
        online_count = 0
        
        # Scorriamo i membri di quel gruppo
        for member in group.get('members', []):
            # Cerchiamo l'utente nel db per vedere il suo 'ultimo_accesso'
            user_data = users_table.search(UserQuery.username == member)
            if user_data:
                ultimo_accesso = user_data[0].get('ultimo_accesso', 0)
                
                # Se la differenza tra l'ora attuale e l'ultimo accesso è minore della soglia
                if current_time - ultimo_accesso <= SOGLIA_ONLINE:
                    online_count += 1
                    
        # Aggiungiamo il conteggio calcolato direttamente all'oggetto gruppo che inviamo al frontend
        group['online_count'] = online_count
        
    return {"status": "successo", "gruppi": user_groups}

@app.post("/api/heartbeat")
def heartbeat(data: Heartbeat):
    # Salviamo l'orario attuale in secondi (Unix Timestamp)
    current_time = time.time()
    
    # Aggiorniamo l'utente nel db aggiungendo/modificando la voce 'ultimo_accesso'
    users_table.update({'ultimo_accesso': current_time}, UserQuery.username == data.username)
    
    return {"status": "ok"}

# 1. Rotta per caricare un singolo gruppo e i suoi membri online
@app.get("/api/group/{group_id}")
def get_single_group(group_id: str):
    GroupQuery = Query()
    result = groups_table.search(GroupQuery.id == group_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Gruppo non trovato")
        
    group = result[0]
    
    # Calcoliamo chi è online (come in dashboard)
    current_time = time.time()
    SOGLIA_ONLINE = 120
    membri_con_stato = [] # Lista di dizionari {nome: str, online: bool}
    
    for member in group.get('members', []):
        is_online = False
        user_data = users_table.search(UserQuery.username == member)
        if user_data:
            ultimo_accesso = user_data[0].get('ultimo_accesso', 0)
            if current_time - ultimo_accesso <= SOGLIA_ONLINE:
                is_online = True
                
        membri_con_stato.append({"username": member, "online": is_online})
        
    group['membri_dettagliati'] = membri_con_stato
    return {"status": "successo", "gruppo": group}

# 2. Rotta per abbandonare il gruppo
@app.post("/api/groups/leave")
def leave_group(data: LeaveGroup):
    GroupQuery = Query()
    result = groups_table.search(GroupQuery.id == data.group_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Gruppo non trovato")
        
    group = result[0]
    
    if data.username in group['members']:
        group['members'].remove(data.username)
        # Aggiorniamo il DB
        groups_table.update({'members': group['members']}, GroupQuery.id == data.group_id)
        return {"status": "successo", "messaggio": "Hai abbandonato il gruppo."}
    else:
        raise HTTPException(status_code=400, detail="Non fai parte di questo gruppo")