# Cahier des charges — Cherry / Strawberry (nom provisoire)

App de "second brain" pour la prise de note dynamique — MVP web local

## 1. Contexte & problème

Aujourd'hui, la prise de note (texte, vocal, agenda) se fragmente entre plusieurs outils (Notes Mac, Agenda iPhone, Notion). Le processus de synthèse est manuel, chronophage (toutes les 4-8 semaines), et produit des notes figées dans le temps (ex: "Idées business — juillet"), qui ne reflètent plus l'état actuel de la réflexion et qu'on ne remet plus à jour.

Problème central : absence d'un outil pensé pour capturer des idées à la volée (texte ou vocal) tout en maintenant, par thématique, une vue à jour de l'état actuel de la pensée, sans perdre l'historique et sans effort de synthèse manuelle récurrent.

## 2. Vision produit

Une app de capture rapide, organisée par espaces thématiques définis par l'utilisateur (ex: Carrière, Startup, Santé, Perso), dans laquelle chaque note est classée par type (action / réflexion / conviction / idée / insight). Chaque espace expose :

- une synthèse "du moment", régénérée périodiquement, qui résume l'état actuel de la réflexion sur ce sujet ;
- une archive chronologique complète de toutes les entrées brutes, jamais supprimée ni perdue (zéro perte de contexte — la synthèse est une vue, pas un remplacement).

En complément, une vue transversale permet de filtrer/consulter toutes les entrées d'un même type (ex: "toutes mes actions") indépendamment de l'espace.

## 3. Ce que le produit n'est PAS (pour le MVP)

- Pas de notes atomiques liées façon Zettelkasten (testé via Obsidian, ne correspond pas à l'usage).
- Pas d'assistant conversationnel type chat pour interroger sa base (peut être reconsidéré plus tard si le besoin émerge).
- Pas de sync Notion / Calendar (prévu en V2).
- Pas de synchronisation Mac ↔ iPhone (le MVP est une web app locale sur Mac ; portage mobile après validation du concept).

## 4. Concept fonctionnel

### 4.1 Capture

- Une entrée = texte libre ou note vocale.
- Note vocale → transcription locale (Whisper on-device, via whisper.cpp ou faster-whisper — privé, offline).
- À la capture, l'utilisateur assigne : un espace (existant ou nouveau) + un type (tag fixe).

### 4.2 Tags de type (liste fermée, MVP)

- `action`
- `réflexion`
- `conviction`
- `idée`
- `insight`

### 4.3 Espaces

- Créés librement par l'utilisateur (nom + libre).
- Chaque espace contient : la liste chronologique des entrées + la synthèse courante.

### 4.4 Synthèse "du moment"

- Générée/mise à jour par l'API Claude à partir de l'historique des entrées d'un espace.
- Déclenchement : automatique hebdomadaire (cron-like) + bouton manuel "resynthétiser" à la demande.
- La synthèse n'écrase jamais les entrées brutes : elle est stockée séparément et versionnée (on garde un historique des synthèses successives, pas seulement la dernière).

### 4.5 Vue transversale

- Filtre par type de tag, tous espaces confondus (ex: voir toutes les `action` en cours).

## 5. Modèle de données (proposition)

Stockage : fichiers Markdown en source de vérité + index SQLite régénérable (pattern Obsidian/Logseq — lisible, versionnable Git, portable ; l'index sert uniquement à la recherche/filtres rapides et peut être reconstruit à tout moment à partir des `.md`).

Structure de fichiers indicative :

```
/data
  /spaces
    /{space-name}/
      entries/
        2026-07-28-1423.md      # une entrée = un fichier, front-matter (type, date, espace) + contenu
      synthesis/
        2026-W30.md             # synthèse versionnée par semaine (ou par regénération)
        current.md              # pointeur/copie de la dernière synthèse
  /index.sqlite                  # régénérable, jamais source de vérité
```

Front-matter d'une entrée (exemple) :

```yaml
---
date: 2026-07-28T14:23:00
type: idée
space: startup
source: voice   # voice | text
---
```

## 6. Architecture technique (MVP)

- App web locale tournant sur le Mac (serveur local, ex: Node/Python), accessible via navigateur, pensée dès le départ pour être portable (PWA ou wrapper mobile en V2).
- Transcription vocale : Whisper local (whisper.cpp / faster-whisper), pas d'appel réseau pour l'audio.
- Auto-tagging & synthèse : API Claude (le contenu texte transite via API, l'audio brut reste local).
- Stockage : Markdown + index SQLite régénérable (voir §5).
- Cron hebdomadaire : tâche locale planifiée (ex: node-cron / APScheduler) qui déclenche la regénération de synthèse par espace.

## 7. Roadmap (post-MVP)

- V2 : intégration Notion (push de synthèses/entrées) + Calendar (push des `action`), précisé ci-dessous.
- V2/V3 : app mobile iPhone + synchronisation Mac ↔ iPhone (mécanisme à définir : iCloud vs serveur perso).
- Réévaluation possible : liens entre entrées, mode conversationnel, si le besoin se confirme à l'usage.

### 7.1 Push Calendar par thématique (`action`)

Pour chaque espace, créer un événement (ou une liste d'événements) dans Apple Calendar ou Google Calendar reprenant les `action` réfléchies récemment dans cet espace.

- Google Calendar : API directe (OAuth), un event par thématique — la voie la plus simple.
- Apple Calendar : pas d'API cloud publique ; passerait par EventKit en local (donc lié au packaging Electron du Mac) ou par export `.ics`. À trancher au moment de l'implémentation.

### 7.2 Rapport mensuel automatisé → Notion

Cron mensuel (en plus du cron hebdomadaire de synthèse déjà en place) qui génère, par espace, un rapport archivé dans une database Notion dédiée : une entrée par mois et par thématique, contenant (a) la liste brute de toutes les entrées ajoutées dans le mois et (b) une synthèse globale complète de la période. Techniquement proche du mécanisme de synthèse d'espace existant (même prompt-building, fenêtre mensuelle plutôt qu'hebdomadaire), avec en plus un push vers l'API Notion (une database par thématique).

## 8. Direction design / branding (intention, pas encore figée)

- Nom : Cherry ou Strawberry (à trancher).
- Mascotte : logo fruit style rétro/cartoon (inspiration esthétique : app Handy, logo façon "bubble letters", sidebar de navigation simple, cartes arrondies, toggles nets).
- UI épurée, ergonomique, peu de bruit visuel.
- Mode sombre : fond anthracite, texte blanc/gris clair.
- Mode clair : fond blanc/gris très clair, texte gris foncé/noir.
- Une seule couleur d'accent pour les éléments interactifs (rouge foncé pressenti, à confirmer) — le reste de la palette reste en nuances de gris/noir/blanc dans les deux modes.
- Exécution visuelle précise (composants, valeurs exactes) à affiner via un mockup Figma une fois le MVP fonctionnel.

## 9. Parcours utilisateur détaillé (écrans MVP)

**Écran 1 — Accueil / liste des espaces**

- Liste des espaces existants (nom + date de dernière activité + aperçu court de la synthèse courante).
- Bouton "Nouvel espace" (nom libre).
- Accès à la vue transversale (filtrer par type de tag, tous espaces confondus).

**Écran 2 — Vue d'un espace**

- En haut : la synthèse du moment (lecture seule, avec date de dernière génération + bouton "Resynthétiser").
- En dessous : zone de capture rapide (champ texte + bouton micro).
- En dessous : liste chronologique des entrées (les plus récentes en premier), chacune affichant son type (badge coloré) et un extrait.
- Clic sur une entrée → vue détail (texte complet, date, type, espace).

**Écran 3 — Capture**

- Saisie texte libre, OU enregistrement vocal (bouton start/stop, indicateur d'enregistrement).
- Après transcription : aperçu du texte transcrit, éditable avant validation.
- Sélection du type (action/réflexion/conviction/idée) — obligatoire avant sauvegarde.
- Sélection de l'espace (si pas déjà dans un espace) — obligatoire.

**Écran 4 — Vue transversale**

- Filtre par type de tag (un ou plusieurs), et optionnellement par espace.
- Liste résultante, triée par date, avec lien vers l'espace d'origine.

**Écran 5 — Paramètres**

- Clé API Claude (saisie, stockée localement — voir §12 sécurité).
- Choix du modèle Whisper local (taille : tiny/base/small — arbitrage vitesse/qualité).
- Fréquence de la synthèse automatique (par défaut hebdo, modifiable).
- Thème clair/sombre.

## 10. Fonctionnalités complémentaires (CRUD & recherche)

- Éditer une entrée existante (texte, type, espace) après capture.
- Supprimer une entrée (avec confirmation ; suppression = déplacement dans un dossier `/trash` plutôt qu'effacement définitif immédiat, pour éviter la perte accidentelle — cohérent avec le principe "zéro perte de contexte").
- Renommer ou archiver un espace (un espace archivé disparaît de la liste principale mais reste consultable).
- Recherche texte libre dans toutes les entrées (recherche simple sur le contenu, via l'index SQLite).
- Historique des synthèses : pouvoir consulter les versions précédentes d'une synthèse, pas seulement la dernière.

## 11. Gestion des erreurs & cas limites

- Transcription échoue ou audio inaudible : afficher un message clair, permettre de réessayer ou de saisir le texte manuellement à la place.
- API Claude indisponible / pas d'internet : la capture et le stockage restent fonctionnels (ils ne dépendent pas du réseau) ; seules la synthèse et l'auto-tagging sont différés jusqu'au retour de la connexion, avec indicateur visuel ("synthèse en attente").
- Espace vide (aucune entrée) : pas de synthèse générée, message d'invitation à créer une première entrée.
- Conflit de nom de fichier (deux entrées à la même seconde) : horodatage jusqu'à la milliseconde ou suffixe incrémental automatique dans le nom de fichier.
- Renommage d'un espace : ne casse pas les liens vers les entrées déjà stockées (le nom du dossier peut différer d'un identifiant interne stable si nécessaire).
- Corruption / suppression accidentelle de l'index SQLite : reconstruction automatique à partir des fichiers Markdown au démarrage suivant.

## 12. Stack technique recommandée (proposition concrète)

- Backend/serveur local : Node.js + Express (ou Fastify), qui sert à la fois l'API locale et le frontend.
- Frontend : React + Vite (SPA simple), pensé pour être facilement enveloppé en PWA plus tard.
- Base d'index : SQLite via `better-sqlite3`.
- Lecture/écriture Markdown : parsing front-matter via `gray-matter`.
- Transcription locale : `whisper.cpp` (binaire local appelé en sous-processus) ou binding `nodejs-whisper` — modèle `base` ou `small` par défaut pour un bon compromis vitesse/précision sur Mac.
- Appels API Claude : SDK officiel `@anthropic-ai/sdk`, clé API stockée dans un fichier de config local non commité (`.env`, ajouté au `.gitignore` dès le départ — important pour l'open source).
- Cron local : `node-cron` pour la regénération hebdomadaire des synthèses.
- Empaquetage : lancement via `npm run dev` en MVP ; packaging en app Mac autonome (Electron ou Tauri) envisageable une fois le cœur validé, avant le portage mobile.

## 13. Open source & structure du repo

- Licence : MIT recommandée (permissive, simple, cohérente avec l'esprit "petit outil personnel partagé", comme Handy).
- `.gitignore` dès le premier commit : clé API, dossier `/data` (les notes personnelles ne doivent pas être versionnées avec le code).
- README : présentation du concept, capture d'écran, instructions d'installation locale, mention explicite que les données restent en local.
- Structure de repo suggérée :

```
/app          # code source (frontend + backend)
/data         # notes de l'utilisateur (gitignore)
/docs         # captures d'écran, ce cahier des charges
.env.example  # modèle de config sans clé réelle
README.md
LICENSE
```

## 14. Sécurité & confidentialité

- La clé API Claude est stockée localement (fichier `.env` ou config chiffrée), jamais envoyée ailleurs qu'à l'API Anthropic.
- L'audio brut ne quitte jamais la machine (transcription 100% locale).
- Seul le texte transcrit transite vers l'API Claude pour le tagging/la synthèse — à mentionner clairement dans le README pour les futurs utilisateurs open source.

## 15. Critères de succès du MVP

- Je peux capturer une note (texte ou vocal) en moins de 10 secondes, sans friction.
- La transcription vocale locale est fiable et fonctionne offline.
- Après une semaine d'usage, la synthèse d'un espace reflète correctement l'état actuel de ma réflexion, sans que j'aie eu à la rédiger moi-même.
- Aucune entrée brute n'est jamais perdue ou illisible en dehors de l'app (fichiers `.md` ouvrables partout).
- Le remplacement effectif de mon usage actuel (Notes Mac + Agenda + Notion pour ce cas d'usage) est jugé viable après quelques semaines de test réel.
