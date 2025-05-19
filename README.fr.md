[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.md)
[![zh](https://img.shields.io/badge/lang-zh-green.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.zh.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.es.md)


# Agent de Recherche d'Entreprise 🔍

![web ui](<static/ui-1.png>)

Un outil multi-agents qui génère des rapports de recherche d'entreprise complets. La plateforme utilise un pipeline d'agents IA pour collecter, organiser et synthétiser des informations sur n'importe quelle entreprise.

✨Essayez-le en ligne ! https://companyresearcher.tavily.com ✨

https://github.com/user-attachments/assets/0e373146-26a7-4391-b973-224ded3182a9

## Fonctionnalités

- **Recherche Multi-Sources** : Récupère des données de diverses sources, y compris les sites web d'entreprise, articles de presse, rapports financiers et analyses sectorielles
- **Filtrage de contenu par IA** : Utilise le score de pertinence de Tavily pour la curation du contenu
- **Streaming en temps réel** : Utilise les WebSockets pour diffuser l'avancement et les résultats de la recherche en temps réel
- **Architecture à double modèle** :
  - Gemini 2.0 Flash pour la synthèse de recherche à large contexte
  - GPT-4.1 pour la mise en forme et l'édition précises du rapport
- **Frontend React moderne** : Interface réactive avec mises à jour en temps réel, suivi de progression et options de téléchargement
- **Architecture modulaire** : Construite autour d'un pipeline de nœuds spécialisés de recherche et de traitement

## Cadre Agentique

### Pipeline de Recherche

La plateforme suit un cadre agentique avec des nœuds spécialisés qui traitent les données de manière séquentielle :

1. **Nœuds de Recherche** :
   - `CompanyAnalyzer` : Recherche les informations principales sur l'entreprise
   - `IndustryAnalyzer` : Analyse la position sur le marché et les tendances
   - `FinancialAnalyst` : Récupère les indicateurs financiers et les données de performance
   - `NewsScanner` : Collecte les actualités et développements récents

2. **Nœuds de Traitement** :
   - `Collector` : Agrège les données de recherche de tous les analyseurs
   - `Curator` : Met en œuvre le filtrage de contenu et le scoring de pertinence
   - `Briefing` : Génère des synthèses par catégorie à l'aide de Gemini 2.0 Flash
   - `Editor` : Compile et met en forme les synthèses dans un rapport final avec GPT-4.1-mini

   ![web ui](<static/agent-flow.png>)

### Architecture de Génération de Contenu

La plateforme exploite des modèles distincts pour des performances optimales :

1. **Gemini 2.0 Flash** (`briefing.py`) :
   - Gère la synthèse de recherche à large contexte
   - Excelle dans le traitement et le résumé de grands volumes de données
   - Utilisé pour générer les synthèses initiales par catégorie
   - Efficace pour maintenir le contexte sur plusieurs documents

2. **GPT-4.1 mini** (`editor.py`) :
   - Spécialisé dans la mise en forme et l'édition précises
   - Gère la structure markdown et la cohérence
   - Supérieur pour suivre des instructions de formatage exactes
   - Utilisé pour :
     - Compilation du rapport final
     - Déduplication du contenu
     - Mise en forme markdown
     - Streaming du rapport en temps réel

Cette approche combine la capacité de Gemini à gérer de larges fenêtres de contexte avec la précision de GPT-4.1-mini pour le respect des consignes de formatage.

### Système de Curation de Contenu

La plateforme utilise un système de filtrage de contenu dans `curator.py` :

1. **Scoring de Pertinence** :
   - Les documents sont scorés par la recherche IA de Tavily
   - Un seuil minimum (par défaut 0,4) est requis pour continuer
   - Les scores reflètent la pertinence par rapport à la requête de recherche
   - Un score élevé indique une meilleure correspondance avec l'intention de recherche

2. **Traitement des Documents** :
   - Le contenu est normalisé et nettoyé
   - Les URLs sont dédupliquées et standardisées
   - Les documents sont triés par score de pertinence
   - Les mises à jour de progression sont envoyées en temps réel via WebSocket

### Système de Communication en Temps Réel

La plateforme implémente un système de communication en temps réel basé sur WebSocket :

![web ui](<static/ui-2.png>)

1. **Implémentation Backend** :
   - Utilise le support WebSocket de FastAPI
   - Maintient des connexions persistantes par tâche de recherche
   - Envoie des mises à jour structurées pour divers événements :
     ```python
     await websocket_manager.send_status_update(
         job_id=job_id,
         status="processing",
         message=f"Génération du briefing {category}",
         result={
             "step": "Briefing",
             "category": category,
             "total_docs": len(docs)
         }
     )
     ```

2. **Intégration Frontend** :
   - Les composants React s'abonnent aux mises à jour WebSocket
   - Les mises à jour sont traitées et affichées en temps réel
   - Différents composants UI gèrent des types d'updates spécifiques :
     - Progression de la génération de requête
     - Statistiques de curation de documents
     - Statut de complétion des briefings
     - Progression de la génération du rapport

3. **Types de Statut** :
   - `query_generating` : Mises à jour de création de requête en temps réel
   - `document_kept` : Progression de la curation de documents
   - `briefing_start/complete` : Statut de génération des briefings
   - `report_chunk` : Streaming de la génération du rapport
   - `curation_complete` : Statistiques finales des documents

## Configuration

### Configuration Rapide (Recommandée)

La façon la plus simple de commencer est d'utiliser le script de configuration (il utilise `uv` automatiquement s'il est disponible) :

1. Clonez le dépôt :
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Rendez le script de configuration exécutable et lancez-le :
```bash
chmod +x setup.sh
./setup.sh
```

Le script de configuration va :
- Vérifier les versions requises de Python et Node.js
- Créer éventuellement un environnement virtuel Python (recommandé)
- Installer toutes les dépendances (Python et Node.js)
- Vous guider dans la configuration de vos variables d'environnement
- Démarrer éventuellement les serveurs backend et frontend

Vous aurez besoin des clés API suivantes :
- Clé API Tavily
- Clé API Google Gemini
- Clé API OpenAI
- URI MongoDB (optionnel)

### Configuration Manuelle

Si vous préférez configurer manuellement, suivez ces étapes :

1. Clonez le dépôt :
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Installez les dépendances backend :
```bash
# Optionnel : installez le gestionnaire de paquets `uv`
curl -Ls https://astral.sh/uv/install.sh | sh

# Créez et activez un environnement virtuel avec uv
uv venv .venv
source .venv/bin/activate

# Installez les dépendances Python
uv pip install -r requirements.txt

# Vous pouvez également utiliser les outils Python standards :
# python -m venv .venv
# pip install -r requirements.txt
```

3. Installez les dépendances frontend :
```bash
cd ui
npm install
```

4. Créez un fichier `.env` avec vos clés API :
```env
TAVILY_API_KEY=votre_clé_tavily
GEMINI_API_KEY=votre_clé_gemini
OPENAI_API_KEY=votre_clé_openai

# Optionnel : Activez la persistance MongoDB
# MONGODB_URI=votre_chaîne_de_connexion_mongodb
```

### Configuration Docker

L'application peut être exécutée à l'aide de Docker et Docker Compose :

1. Clonez le dépôt :
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Créez un fichier `.env` avec vos clés API :
```env
TAVILY_API_KEY=votre_clé_tavily
GEMINI_API_KEY=votre_clé_gemini
OPENAI_API_KEY=votre_clé_openai

# Optionnel : Activez la persistance MongoDB
# MONGODB_URI=votre_chaîne_de_connexion_mongodb
```

3. Construisez et démarrez les conteneurs :
```bash
docker compose up --build
```

Cela démarrera les services backend et frontend :
- L'API backend sera disponible sur `http://localhost:8000`
- Le frontend sera disponible sur `http://localhost:5174`

Pour arrêter les services :
```bash
docker compose down
```

Remarque : Lors de la mise à jour des variables d'environnement dans `.env`, vous devrez redémarrer les conteneurs :
```bash
docker compose down && docker compose up
```

### Exécution de l'Application

1. Démarrez le serveur backend (choisissez une option) :
```bash
# Option 1 : Module Python Direct (avec uv)
uv run python -m application.py

# Option 2 : FastAPI avec Uvicorn
uv run uvicorn application:app --reload --port 8000
```

2. Dans un nouveau terminal, démarrez le frontend :
```bash
cd ui
npm run dev
```

3. Accédez à l'application sur `http://localhost:5173`

## Utilisation

### Développement Local

1. Démarrez le serveur backend (choisissez une option) :

   **Option 1 : Module Python Direct (avec uv)**
   ```bash
   uv run python -m application.py
   ```

   **Option 2 : FastAPI avec Uvicorn**
   ```bash
   # Installez uvicorn si ce n'est pas déjà fait
   uv pip install uvicorn

   # Exécutez l'application FastAPI avec rechargement à chaud
   uv run uvicorn application:app --reload --port 8000
   ```

   Le backend sera disponible sur :
   - Point d'accès API : `http://localhost:8000`
   - Point d'accès WebSocket : `ws://localhost:8000/research/ws/{job_id}`

2. Démarrez le serveur de développement frontend :
   ```bash
   cd ui
   npm run dev
   ```

3. Accédez à l'application sur `http://localhost:5173`

### Options de Déploiement

L'application peut être déployée sur diverses plateformes cloud. Voici quelques options courantes :

#### AWS Elastic Beanstalk

1. Installez l'EB CLI :
   ```bash
   uv pip install awsebcli
   ```

2. Initialisez l'application EB :
   ```bash
   eb init -p python-3.11 tavily-research
   ```

3. Créez et déployez :
   ```bash
   eb create tavily-research-prod
   ```

#### Autres Options de Déploiement

- **Docker** : L'application inclut un Dockerfile pour le déploiement conteneurisé
- **Heroku** : Déployez directement depuis GitHub avec le buildpack Python
- **Google Cloud Run** : Adapté au déploiement conteneurisé avec mise à l'échelle automatique

Choisissez la plateforme qui convient le mieux à vos besoins. L'application est indépendante de la plateforme et peut être hébergée partout où les applications web Python sont prises en charge.

## Contribution

1. Forkez le dépôt
2. Créez une branche de fonctionnalité (`git checkout -b fonctionnalite/superbe-fonction`)
3. Validez vos modifications (`git commit -m 'Ajout d'une superbe fonction'`)
4. Poussez vers la branche (`git push origin fonctionnalite/superbe-fonction`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Remerciements

- [Tavily](https://tavily.com/) pour l'API de recherche
- Toutes les autres bibliothèques open-source et leurs contributeurs
