# IdeaMode API

Rails 8 API-only app. PostgreSQL backend for the Next.js and Expo clients.

## Run

```bash
bundle install
bin/rails db:prepare   # create DB and load schema
bin/rails s
```

Server: http://localhost:3000

- **Health check (JSON):** `GET /health` → `{ "status": "ok" }`
- **Rails health:** `GET /up`

CORS is enabled for localhost (Next.js on 3001, Expo dev). For a physical device, use your machine’s IP and add it to `config/initializers/cors.rb` if needed.
