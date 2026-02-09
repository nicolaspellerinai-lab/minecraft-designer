# Minecraft Designer

Minecraft Designer est une application web qui permet de créer des designs dans le style de Minecraft en faisant glisser et déposer des éléments sur un canevas.

## Fonctionnalités

### Interface utilisateur
- **Panneau d'assets** : Barre latérale contenant des catégories d'éléments Minecraft organisés par type (Bâtiment, Naturel, Outils, etc.)
- **Canevas principal** : Zone de dessin où les éléments peuvent être placés, déplacés, redimensionnés et modifiés
- **Panneau de propriétés** : Affiche les propriétés de l'élément sélectionné
- **Barre d'outils inférieure** : Boutons pour les opérations courantes (annuler/rétablir, grille, sauvegarde, etc.)

### Fonctionnalités principales
- **Glisser-déposer** : Faites glisser des éléments depuis le panneau d'assets vers le canevas
- **Sélection et modification** : Sélectionnez des éléments sur le canevas pour les déplacer, les redimensionner ou modifier leurs propriétés
- **Historique** : Fonctionnalités d'annulation/rétablissement pour corriger les erreurs
- **Grille** : Affichage optionnel d'une grille pour un placement précis des éléments
- **Menu contextuel** : Clic droit sur les éléments pour accéder aux options (copier, coller, supprimer, dupliquer, verrouiller)
- **Sauvegarde/chargement** : 
  - Exportation en image PNG
  - Sauvegarde et chargement de projets au format JSON
  - Sauvegarde automatique dans le stockage local du navigateur
- **Recherche** : Barre de recherche pour trouver rapidement des éléments spécifiques
- **Catégories** : Organisation des éléments en catégories :
  - Bâtiment
  - Naturel
  - Outils
  - Nourriture
  - Créatures
  - Redstone
  - Décorations
  - Accessoires
  - Plantes
  - Transport
  - Favoris

### Navigation et raccourcis
- **Raccourcis clavier** :
  - Ctrl+Z : Annuler
  - Ctrl+Y : Rétablir
  - G : Activer/désactiver la grille
  - Suppr/Backspace : Supprimer l'élément sélectionné
- **Navigation** : 
  - Zoom avec la molette de la souris
  - Déplacement dans le canevas en maintenant le clic droit enfoncé

## Structure du projet

```
minecraft/
├── index.html              # Page principale de l'application
├── style.css               # Styles CSS de l'application
├── app.js                  # Classe principale de l'application
├── assets-data.js          # Données des assets Minecraft
├── canvas.js               # Gestion du canevas et des éléments
├── dragdrop.js             # Fonctionnalité de glisser-déposer
├── export.js               # Fonctionnalités d'export et de sauvegarde
├── history.js              # Gestion de l'historique d'annulation
├── selection.js            # Gestion de la sélection d'éléments
├── transform.js            # Gestion des transformations (déplacement, redimensionnement)
├── utils.js                # Fonctions utilitaires
├── extract/                # Scripts d'extraction des assets
│   └── generate-assets.js  # Script Node.js pour générer assets-data.js
├── textures_base/          # Pack de textures Minecraft source
│   ├── terrain_texture.json
│   ├── item_texture.json
│   ├── blocks/             # Textures des blocs
│   ├── items/              # Textures des items
│   └── ...
├── assets/                 # Dossier contenant les textures et assets
│   ├── textures/
│   │   ├── block/          # Textures des blocs
│   │   └── item/           # Textures des items
│   └── assets-catalog.json # Catalogue des assets disponibles
└── README.md               # Documentation du projet (ce fichier)
```

## Génération des assets (Script Node.js)

Le projet inclut un script Node.js pour extraire automatiquement les textures de Minecraft et générer le fichier de configuration des assets.

### Script `extract/generate-assets.js`

Ce script lit les fichiers de configuration de Minecraft (`terrain_texture.json` et `item_texture.json`) depuis le dossier `textures_base/`, génère le fichier `assets-data.js` et copie les textures correspondantes dans le dossier `assets/textures/`.

#### Fonctionnalités

- **Extraction automatique** : Lit les fichiers JSON de configuration des textures Minecraft
- **Organisation par catégories** : Classe les items dans 16 catégories (Bâtiment, Nature, Minerais, Redstone, Décoration, Agriculture, Nether, End, Eau, Outils, Armure, Nourriture, Matériaux, Potions, Divers, Créatures)
- **Copie des textures** : Copie automatiquement les fichiers PNG dans la structure appropriée
- **Génération du fichier de configuration** : Crée un fichier `assets-data.js` complet avec toutes les métadonnées

#### Utilisation

```bash
# Se placer dans le dossier extract
cd public_html/oc/minecraft/extract

# Exécuter le script
node generate-assets.js
```

#### Résultat

Le script génère :
- Un fichier `assets-data.js` avec plus de 2000 items organisés par catégories
- Les textures copiées dans `assets/textures/block/` et `assets/textures/item/`

#### Statistiques de génération

Exemple de sortie :
```
Génération des assets Minecraft...
  Bâtiment: 624 items
  Nature: 225 items
  Minerais: 182 items
  Redstone: 36 items
  Décoration: 143 items
  Agriculture: 67 items
  Nether: 41 items
  End: 25 items
  Eau: 103 items
  Outils: 6 items
  Armure: 28 items
  Nourriture: 173 items
  Matériaux: 57 items
  Potions: 99 items
  Divers: 167 items
  Créatures: 27 items

Total: 2003 items générés
```

#### Prérequis

- Node.js installé sur le système
- Pack de textures Minecraft dans le dossier `textures_base/` avec les fichiers :
  - `terrain_texture.json` (configuration des blocs)
  - `item_texture.json` (configuration des items)
  - Dossiers `blocks/` et `items/` contenant les textures PNG

## Technologies utilisées

- **HTML5** : Structure de l'application
- **CSS3** : Stylisation et animations
- **JavaScript (ES6)** : Logique de l'application
- **Canvas HTML5** : Rendu graphique
- **Font Awesome** : Icônes de l'interface
- **html2canvas** : Export en image PNG

## Utilisation

1. Ouvrez `index.html` dans un navigateur web moderne
2. Sélectionnez une catégorie dans le panneau d'assets
3. Faites glisser des éléments depuis le panneau d'assets vers le canevas
4. Utilisez les outils de la barre d'outils pour modifier votre design
5. Sauvegardez votre travail en utilisant les boutons d'export ou la sauvegarde automatique

## Personnalisation

Pour ajouter de nouveaux assets :
1. Ajoutez les fichiers d'image dans le dossier approprié (`assets/textures/block/` ou `assets/textures/item/`)
2. Mettez à jour le fichier `assets-data.js` avec les nouvelles références d'assets
3. L'application chargera automatiquement les nouveaux éléments

## Notes de développement

- L'application utilise une architecture modulaire avec des classes JavaScript séparées pour chaque fonctionnalité
- Le système de sauvegarde automatique enregistre le projet toutes les 30 secondes dans le localStorage du navigateur
- Les assets sont chargés de manière paresseuse (lazy loading) pour améliorer les performances
- Le code est conçu pour être facilement extensible avec de nouvelles fonctionnalités