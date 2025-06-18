# AIS Cron

Script che salva ogni 5 minuti la posizione delle navi nel database Supabase usando l'API di AISStream.

## Setup

1. Clona la repo
2. Crea un file `.env` con le variabili:
   - AIS_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE
3. Installa le dipendenze:
```bash
npm install
