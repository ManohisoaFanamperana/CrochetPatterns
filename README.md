# CrochetPatterns - Application PWA Offline-First 🧶

Une application web complète pour découvrir, créer et partager des patrons de crochet avec synchronisation automatique Google Drive et support offline complet.

## Caractéristiques principales

✅ **Offline-First** - Fonctionne completement sans connexion Internet  
✅ **PWA** - Installable comme application mobile  
✅ **Google Drive Sync** - Synchronisation automatique des patrons  
✅ **Service Worker** - Cache intelligent multi-stratégies  
✅ **IndexedDB** - Stockage local illimité  
✅ **Responsive Design** - Fonctionne sur desktop, tablette et mobile  
✅ **Google OAuth** - Authentification sécurisée  
✅ **Compression Image** - Optimisation automatique des images  
✅ **Netlify Ready** - Déploiement en un clic

## Stack Technologique

- **HTML5** - Structure sémantique
- **TailwindCSS (CDN)** - Design système utilities
- **JavaScript ES Modules** - Code modulaire moderne
- **Service Worker** - Offline-first et caching
- **IndexedDB** - Base de données locale
- **Google Identity Services** - OAuth 2.0
- **Google Drive REST API v3** - Synchronisation cloud
- **Canvas API** - Compression d'images

## Structure du projet

```
crochet-site/
├── index.html              # Page d'accueil
├── patrons.html            # Liste des patrons
├── details.html            # Détails d'un patron
├── admin.html              # Panneau administrateur
├── manifest.json           # Configuration PWA
├── service-worker.js       # Service Worker
├── netlify.toml           # Config Netlify
├── assets/
│   ├── styles.css         # Styles globaux
│   ├── img/              # Images
│   └── pdf/              # Fichiers PDF
└── js/
    ├── app.js            # Application principale
    ├── router.js         # Système de routage
    ├── cache.js          # Gestion du cache & IndexedDB
    ├── auth.js           # Authentification Google
    ├── driveSync.js      # Synchronisation Drive
    ├── admin.js          # Logique panneau admin
    └── data.js           # Données d'exemple

```

## Installation locale

### Prérequis

- Node.js 14+ (pour serveur local)
- Un compte Google (pour OAuth)

### Étapes d'installation

```bash
# 1. Cloner le repo
git clone <repository>
cd crochet-site

# 2. Créer des credentials Google OAuth
# Voir section "Configuration Google OAuth"

# 3. Serveur local (optionnel)
npx http-server

# Le site sera accessible à http://localhost:8080
```

## Configuration Google OAuth

### 1. Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet
3. Activer les APIs:
   - Google Identity Services
   - Google Drive API

### 2. Créer des credentials OAuth

1. Aller à **Credentials** → **Create Credentials** → **OAuth client ID**
2. Sélectionner **Web application**
3. Ajouter les URIs autorisées:
   ```
   http://localhost:8080
   http://localhost:3000
   https://votre-domaine.netlify.app
   ```
4. Copier votre **Client ID**

### 3. Configurer dans l'application

Remplacer `YOUR_GOOGLE_CLIENT_ID_HERE` dans `js/auth.js`:

```javascript
this.CLIENT_ID = 'votre-client-id-ici.apps.googleusercontent.com';
```

## Configuration Google Drive API

### Permissions requises

- `https://www.googleapis.com/auth/drive.file` - Accès aux fichiers créés par l'app
- `https://www.googleapis.com/auth/userinfo.profile` - Profil utilisateur

### Scope

L'application demande uniquement accès au dossier `CrochetPatterns/` créé dans Drive.

## Déploiement sur Netlify

### Méthode 1: Lier un repo GitHub

```bash
# 1. Pousser votre code sur GitHub
git push origin main

# 2. Sur Netlify:
# - Cliquer "New site from Git"
# - Sélectionner votre repo
# - Build command: (laisser vide)
# - Publish directory: .
```

### Méthode 2: Drag & Drop

```bash
# Zipper le dossier crochet-site et le glisser sur Netlify
```

### Configuration Netlify (déjà incluse dans netlify.toml)

- Redirections SPA
- Headers de cache optimisés
- Service Worker avec cache-control 0

## Fonctionnalités détaillées

### Page d'accueil
- Présentation du projet
- Bouton "Explorer les patrons"
- Accès au panneau admin
- Statistiques (nombre de patrons, stockage utilisé)

### Liste des patrons
- Affichage en grille
- Recherche en temps réel
- Filtres par catégorie
- Filtres par niveau de difficulté
- Chargement depuis IndexedDB ou Drive

### Détails du patron
- Images
- PDF téléchargeable
- Matériel requis
- Taille du crochet
- Quantité de fil
- Description
- Bouton suppression

### Panneau Admin
- Formulaire d'ajout de patron
- Compression automatique d'images
- Upload PDF
- Liste des patrons locaux
- Suppression de patrons
- Synchronisation Drive automatique

### Offline-First
- Tous les patrons et assets sont en cache
- Service Worker actif
- Mode hors-ligne entièrement fonctionnel
- Synchronisation automatique au retour en ligne

### Synchronisation Drive
- Création auto du dossier `/CrochetPatterns`
- Upload incrémental des patrons
- Compression avant upload
- Synchronisation bidirectionnelle

## Gestion du cache

### Stratégies

| Ressource | Stratégie | Détails |
|-----------|-----------|---------|
| Google APIs | Network First | Tente réseau, fallback cache |
| HTML pages | Network First | Contenu frais si possible |
| Assets (CSS, JS) | Cache First | Utilise cache local |
| Images | Cache First | Optimisé pour offline |

### IndexedDB

```javascript
// Schéma
{
  id: string,
  name: string,
  category: string,
  level: string,
  hookSize: string,
  yarnAmount: number,
  materials: string[],
  description: string,
  image: base64?,
  pdf: base64?,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

## Données d'exemple

L'application inclut 5 patrons d'exemple:

1. **Amigurumi Chat Mignon** - Débutant, 150m de fil
2. **Sac à Main Bohème** - Intermédiaire, 400m de fil
3. **Couverture Granny Square** - Intermédiaire, 2000m de fil
4. **Top Ajouré d'Été** - Avancé, 600m de fil
5. **Suspension Florale** - Débutant, 100m de fil

Ces données sont automatiquement chargées au premier accès dans IndexedDB.

## Optimisation des performances

### Compression d'images
- Canvas API avec qualité ajustable
- Redimensionnement automatique
- Format JPEG optimisé
- Réduction de 70% de la taille

### Chargement optimisé
- Lazy loading des images
- Minification CSS (Tailwind)
- Code splitting par page
- Modules ES pour tree-shaking

### Cache intelligent
- Service Worker avec expiration
- Stratégies multi-niveaux
- Storage API fallback
- Nettoyage automatique des anciens caches

## Dépannage

### Service Worker ne s'enregistre pas
```bash
# Vérifier HTTPS/localhost
# Vérifier les headers de cache
# Vérifier console pour erreurs
```

### IndexedDB vide
```javascript
// Forcer le rechargement des données
localStorage.removeItem('sampleDataLoaded');
location.reload();
```

### Google OAuth ne fonctionne pas
- Vérifier Client ID dans `js/auth.js`
- Vérifier URIs autorisées dans Google Cloud Console
- Vérifier les origins CORS

### Synchronisation Drive échoue
- Vérifier connexion Internet
- Vérifier permissions Drive
- Vérifier quotas Drive
- Consulter Network tab (DevTools)

## Contributeurs et license

Créé avec ❤️ pour les amateurs de crochet

---

**Prêt pour crocheter?** 🧶🧶🧶
