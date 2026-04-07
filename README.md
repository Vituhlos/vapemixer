# VapeMixer

DIY e-liquid kalkulačka jako PWA. Běží jako Docker kontejner, přístupná přes mobilní Safari.

![Build](https://github.com/Vituhlos/vapemixer/actions/workflows/docker.yml/badge.svg)

## Funkce

- **Mixer** — výpočet množství báze, boosteru a příchutě podle zadaných parametrů
- **Recepty** — ukládání, načítání, duplikování a export receptů
- **Sklad** — sledování zásob s ukazatelem plnosti, export/import
- **Historie** — záznamy provedených míchání
- Swipe-to-delete s možností vrátit akci
- Pull-to-refresh na všech seznamech
- Persistentní stav kalkulačky (localStorage)
- Badge na záložce Sklad při nízké zásobě
- PWA — přidání na plochu iOS Safari

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4
- **Backend:** Node.js, Express 5, better-sqlite3
- **DB:** SQLite (soubor v `/app/data/`)
- **Container:** Docker, image na `ghcr.io/vituhlos/vapemixer`

## Spuštění

### Docker

```bash
docker run -d \
  --name vapemixer \
  -p 3333:3333 \
  -v /cesta/k/datum:/app/data \
  --restart unless-stopped \
  ghcr.io/vituhlos/vapemixer:latest
```

### Docker Compose

```yaml
services:
  vapemixer:
    image: ghcr.io/vituhlos/vapemixer:latest
    container_name: vapemixer
    ports:
      - "3333:3333"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - TZ=Europe/Prague
```

### Unraid (Compose Manager Plus)

Viz `docker-compose.unraid.yml`.

## Vývoj

```bash
# Backend
cd server && npm install && node index.js

# Frontend
cd client && npm install && npm run dev
```

## CI/CD

Na každý push do `main` GitHub Actions sestaví Docker image a pushne na `ghcr.io/vituhlos/vapemixer:latest`.
