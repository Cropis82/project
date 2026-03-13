# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tinydb import TinyDB, Query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inizializza il database TinyDB (creerà un file db.json nella cartella)
db = TinyDB('db.json')

@app.get("/")
def read_root():
    return {"messaggio": "Backend FastAPI funzionante!"}

@app.get("/api/test")
def test_endpoint():
    # Inseriamo un record fittizio se il db è vuoto solo per fare un test
    if len(db) == 0:
        db.insert({'id': 1, 'nome': 'Progetto Test', 'stato': 'Halo 👋', 'tecnologie': ['HTML', 'FastAPI', 'TinyDB']})
    
    # Restituisce tutto il contenuto del database
    return {"status": "successo", "dati": db.all()}