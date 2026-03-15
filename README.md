# 🎧 soundSHINE Bot

Bot Discord pour diffuser **soundSHINE RADIO** dans un Stage Channel, exposer des métriques via API, et automatiser des actions autour de la station (playlist, monitoring, alertes, statut speaker, etc.).

[![CI/CD Pipeline](https://github.com/n3m01726/soundshine-bot/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/n3m01726/soundshine-bot/actions/workflows/ci-cd.yml)

---

## ✨ Fonctionnalités

### Côté Discord
- Lecture du stream radio dans un **Stage Channel**.
- Commandes slash organisées par domaines : radio, station, requests, système, fun.
- Contrôle des permissions (rôles admin / rôles dédiés aux requests).
- Détection de silence + commandes de pilotage.

### Côté API
- API Express sécurisée avec middlewares de protection (helmet, validation, rate-limit, etc.).
- Endpoints de santé, logs, alertes, métriques JSON/Prometheus.
- Endpoint d’ingestion playlist (`/v1/send-playlist`) protégé par token API.

### Observabilité / qualité
- Logs structurés.
- Suite de tests (unitaires, intégration, performance, stress, sécurité).
- Outils scripts pour déploiement des commandes et diagnostic.

---

## 🧱 Architecture du projet

```text
.
├── bot/                 # Client Discord, commandes, events, handlers, tâches
├── api/                 # Serveur Express, middlewares et routes HTTP
├── core/                # Services métier (stage, silence, état applicatif, sécurité)
├── utils/               # Utilitaires (cache, DB, retry, métriques, validation)
├── tests/               # Tests Vitest (unitaires + intégration + perf + stress)
├── scripts/             # Scripts dev, bot, infra, git, outils
└── index.js             # Point d’entrée (lance bot + API)
```

---

## 📋 Prérequis

- **Node.js 18+**
- **npm**
- Un bot Discord configuré (token + intents + permissions adaptées)

---

## ⚙️ Configuration

Le projet lit `.env` et `.env.<env>` (ex: `.env.dev`, `.env.prod`).

### Variables requises

```env
DISCORD_TOKEN=...
ADMIN_ROLE_ID=...
VOICE_CHANNEL_ID=...
PLAYLIST_CHANNEL_ID=...
```

### Variables utiles (optionnelles selon les fonctionnalités)

```env
# Discord / déploiement commandes
CLIENT_ID=...
GUILD_ID=...
DEV_GUILD_ID=...
BOT_ROLE_NAME=soundSHINE

# Stream / nowplaying
STREAM_URL=...
JSON_URL=...

# API HTTP
API_PORT=3000
API_TOKEN=...
LOG_LEVEL=info

# Requests / rôles
REQ_ROLE_ID=...
REQ_CHANNEL_ID=...

# Services externes
UNSPLASH_ACCESS_KEY=...
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
```

> 💡 Astuce : en local, commence avec `NODE_ENV=dev` et un fichier `.env.dev`.

---

## 🚀 Installation & démarrage

```bash
npm install
```

### Lancer en développement

```bash
npm run dev
```

### Lancer en production

```bash
npm run prod
```

---

## 🤖 Commandes Discord

## Commandes principales

- `/help` — liste les commandes disponibles selon le rôle.
- `/ping` — affiche la latence bot/API.
- `/silence <action>` — pilote le détecteur de silence (admin).

### Groupe `/radio`
- `/radio play` — lance le stream dans un Stage Channel.
- `/radio stop` — stoppe la lecture et déconnecte le bot (admin).
- `/radio nowplaying` — affiche le titre en cours (via `JSON_URL`).

### Groupe `/station`
- `/station schedule`
- `/station stats`
- `/station speaker-status`
- `/station promote-speaker` (admin)
- `/station stream-config`

### Groupe `/request`
> Accès contrôlé par `REQ_ROLE_ID`.

- `/request ask`
- `/request edit`
- `/request delete`
- `/request list`

### Commandes fun
- `/drink @user`
- `/getwallpaper` (nécessite `UNSPLASH_ACCESS_KEY`)

---

## 🌐 API HTTP

Base locale par défaut : `http://localhost:3000`

### Endpoints principaux
- `GET /` — infos API et endpoints disponibles
- `GET /v1/health` — état de santé du service
- `GET /v1/metrics` — métriques JSON
- `GET /v1/metrics/prometheus` — métriques Prometheus
- `GET /v1/logs`
- `GET/POST /v1/alerts`
- `POST /v1/send-playlist` — mise à jour playlist/topic (header `x-api-key` requis)
- `GET/POST /v1/silence` — gestion du détecteur de silence

Exemple healthcheck :

```bash
curl http://localhost:3000/v1/health
```

---

## 🧪 Tests & qualité

### Tests
```bash
npm test
npm run test:coverage
npm run test:integration
npm run test:performance
npm run test:stress
npm run test:security
```

### Lint
```bash
npm run lint
npm run lint:fix
```

---

## 📦 Déploiement des commandes Discord

### Environnement dev (guild)
```bash
npm run deploy:dev
```

### Environnement global
```bash
npm run deploy:global
```

### Nettoyage
```bash
npm run clear:dev
npm run clear:global
```

---

## 🔐 Sécurité

- Middlewares API de protection (headers, validation, rate limit, anti-XSS/SQLi).
- Endpoint sensible playlist protégé par API key.
- Scripts de vérification sécurité disponibles via npm scripts.

Consulte aussi : [`docs/SECURITY.md`](docs/SECURITY.md)

---

## 🛠️ Outils utiles

```bash
npm run context:md
npm run context:full
npm run git-actions
```

- Plus de détails dans [`scripts/README.md`](scripts/README.md)
- Documentation des tests dans [`tests/README.md`](tests/README.md)

---

## 🤝 Contribuer

Les contributions sont les bienvenues. Ouvre une issue ou une PR avec :
- un contexte clair,
- des étapes de reproduction,
- et si possible des tests associés.

---

## 📩 Invitation du bot

👉 [Invite Bot on your server](https://discord.com/oauth2/authorize?client_id=1382149009250062458)
