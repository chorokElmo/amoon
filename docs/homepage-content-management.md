# Gestion du contenu de l’accueil

Page locale : [Contenu de l’accueil](http://localhost:9001/app/appearance/homepage), dans **Apparence du site**. Utilisez votre compte administrateur existant.

## Fonctionnement

- Collections : sélection du catalogue existant, titre et description propres à la carte, couverture facultative, activation, retrait confirmé, ordre par glisser-déposer ou flèches accessibles au clavier et sur mobile. Les liens utilisent le handle réel et `?univers=collection` pour éviter les collisions avec les catégories. Sans couverture, la carte utilise un fond de la palette. Les trois cartes historiques restent affichées tant qu’aucune sélection personnalisée n’est publiée ; le bouton « Cartes d’origine » les restaure dans le brouillon.
- Promotions : jusqu’à 12 bannières, images ordinateur et mobile, titre, sous-titre, bouton et destination, activation, ordre et suppression confirmée. Une bannière active nécessite une image ordinateur ; l’image mobile est facultative et utilise l’image ordinateur par défaut.
- Annonce : texte, visibilité et lien facultatif. Les couleurs suivent le thème publié par défaut ; une paire HEX personnalisée est possible avec un contraste minimum de 4,5:1. La barre est partagée par l’en-tête existant du site.
- Sections : les collections, nouveautés, campagne de saison, histoire Amoon, Instagram, newsletter et promotions peuvent être ordonnées, activées et personnalisées. Les engagements Amoon sont obligatoires et leur contenu de service reste conservé. Le slider reste en première position et conserve son écran de gestion existant. Navigation, pied de page, produits, prix et formulaires ne sont pas édités ici.
- Aperçu : texte, ordre, cartes et images de promotion en ordinateur/mobile avec le logo, le thème et le slider actuels. Les produits et formulaires sont représentés sans créer de données ni effectuer d’achat. C’est un aperçu du contenu, pas une session interactive de la boutique.
- Brouillon/publication : « Enregistrer le brouillon » ne modifie pas le site. « Publier le contenu » remplace atomiquement le contenu public et enregistre aussi le brouillon. Les révisions empêchent un second onglet d’écraser une modification plus récente. « Reprendre le contenu publié » remplace le brouillon affiché après confirmation. Avertissement en quittant un brouillon non enregistré.

## Architecture et sécurité

Le module de paramètres `branding` existant est étendu avec un seul modèle. Aucune dépendance ajoutée. Le contrat de contenu est partagé par le backend, l’admin et le storefront. La lecture publique expose uniquement `published` et n’est pas mise en cache ; React partage la lecture entre l’en-tête et la page dans une seule requête de rendu. Les erreurs de lecture et l’absence de configuration conservent le contenu historique.

Les routes `/admin/homepage-content*` réutilisent l’authentification administrateur session/bearer. Les liens sont limités aux chemins de la boutique ou HTTPS sans identifiants ni caractères de contrôle. Les IDs de collection doivent exister. Les URL d’image sont résolues depuis les enregistrements de stockage, jamais depuis une URL fournie librement.

Les images réutilisent intégralement le validateur, le module fichier et la table d’images du slider : JPEG, PNG, WebP non animés, 10 Mo, 6000 × 6000 pixels / 25 mégapixels, décodage et réencodage sans métadonnées. Le storefront réutilise le proxy média existant. Aucun endpoint de suppression de fichier n’est ajouté : retirer/remplacer une image ou supprimer un brouillon ne supprime pas les images encore utilisées par le contenu publié. Les imports abandonnés sont également conservés ; aucune collecte destructive automatique.

Une collection supprimée ultérieurement du catalogue est omise du site et signalée comme indisponible dans l’éditeur. L’administrateur peut alors la retirer ou la remplacer.

## Migration

`apps/medusa/src/modules/branding/migrations/Migration20261011193917.ts` ajoute uniquement `amoon_homepage_content_settings`, son index `deleted_at`, les JSON `draft` et `published` et leurs révisions. Pas de seed ni de remplacement du contenu existant. Le snapshot du module est mis à jour par `db:generate branding`.

La migration est appliquée à la base locale existante après une sauvegarde privée. Les paramètres du slider, de l’identité et du thème ainsi que les nombres de produits, commandes et comptes sont vérifiés avant/après. Le magasin local conserve son contenu d’origine jusqu’à votre première publication. Aucun déploiement sur amoon.ma.

Pour un autre environnement existant :

```powershell
npm run db:migrate
npm run build --workspace @amoon/medusa
```

Redémarrer ensuite le backend selon son environnement. Pour les services locaux déjà configurés, ouvrir deux terminaux :

```powershell
npm run dev:native
```

```powershell
npm run dev:storefront
```

## Tests

```powershell
npm run test:homepage
npm run test:theme
npm run test:slider
npm run test:branding
node --test apps/storefront/scripts/catalog-tests.mjs
npm run typecheck
npm run lint
```

Le test d’intégration `npm run test:homepage:integration` exige `HOMEPAGE_TEST_DATABASE_URL`, `HOMEPAGE_TEST_BACKEND_URL`, `HOMEPAGE_TEST_ADMIN_EMAIL`, `HOMEPAGE_TEST_ADMIN_PASSWORD`. Il refuse une base normale, un serveur distant, les ports du magasin principal, ou une table de contenu déjà renseignée. Utiliser un backend local isolé et une base dont le nom contient `_homepage_test`, `_theme_test`, `_branding_test` ou `_slider_test`. Il crée uniquement des fixtures sur cette base : images, collection et clé publiable de test.

Résultats : neuf tests unitaires de contenu, 81 tests existants et un test d’intégration complet passent. L’intégration vérifie authentification, imports valides/invalides, collections inexistantes, liens dangereux, URL d’image falsifiée, isolation du brouillon, publication, conflit de révision, sauvegardes simultanées, persistance SQL, rétention des images et absence de modifications aux paramètres existants/catalogue/commandes.

Lint, TypeScript et compilation du backend/admin réussissent. Le navigateur vérifie les formulaires français, les deux imports d’image, l’aperçu immédiat, l’avertissement de sortie, l’annulation du retrait de collection, l’enregistrement du brouillon et la publication. L’aperçu mobile mesure 408 px sans débordement horizontal. Le HTML public vérifie les titres, liens de collection réels, ordre des sections, absence de la section désactivée et source d’image mobile. La page de collection et les pages panier/commande répondent normalement ; le proxy média retourne bien l’image. Un redémarrage réel du backend conserve brouillon, publication et révisions.

La première lint a signalé une directive ESLint inutile ; elle a été supprimée. Le premier lancement du storefront isolé a précédé la disponibilité du serveur ; relancé après contrôle de disponibilité. Le premier contrôle des cartes de collection a trouvé un catalogue de test sans région ni canal de vente ; configuration corrigée uniquement dans la base de test.

Un contrôle média effectué pendant le redémarrage a reçu une réponse 502 ; le contrôle complet passe une fois les services disponibles. Un ancien snapshot de contrôle est devenu obsolète après la publication manuelle de test ; les révisions attendues et le snapshot ont été actualisés. Le média d’un ancien slider de test a été restauré dans le stockage isolé pour compléter l’aperçu. Ces problèmes concernaient les fixtures/l’ordre d’exécution des contrôles ; aucune erreur fonctionnelle connue ne reste ouverte.

## Checklist manuelle

1. Se connecter sur le port 9001 avec le compte administrateur habituel, ouvrir Apparence du site → Contenu de l’accueil. Vérifier que la boutique sur le port 8000 garde son contenu d’origine.
2. Ajouter une ou deux collections existantes ; changer le titre, importer une couverture, déplacer les cartes avec la poignée et les flèches, désactiver une carte. Vérifier l’aperçu et le lien automatique. Si aucune collection n’existe, en créer une via le catalogue habituel.
3. Ajouter une promotion, importer les deux images, renseigner le bouton et son lien, activer la bannière. Comparer l’aperçu Ordinateur/Mobile. Tenter un faux fichier image ou un lien `javascript:` : erreur, aucune publication.
4. Modifier l’annonce et son lien ; essayer une paire de couleurs illisible puis une paire contrastée. Changer un titre de section, désactiver Instagram et modifier l’ordre. Les engagements restent actifs et le slider reste séparé.
5. Enregistrer le brouillon, recharger le site : le contenu publié reste inchangé. Recharger l’éditeur : le brouillon est conservé. Publier, recharger la boutique : vérifier texte, images, ordre et collection réelle ; vérifier aussi panier et commande.
6. Supprimer une bannière : annuler puis confirmer. Avant publication, vérifier que la bannière publique et ses images restent accessibles. Vérifier aussi « Reprendre le contenu publié » et « Cartes d’origine » avec annulation/confirmation.
7. Modifier sans enregistrer puis quitter : vérifier l’avertissement. Ouvrir deux onglets, enregistrer depuis chacun avec la même révision : le second doit demander de recharger. Redémarrer le backend : brouillon et publication restent conservés.

## Fichiers modifiés / ajoutés pour cette tâche

Les modifications préexistantes de la tâche Couleurs & Thème sont conservées. Liste des 24 fichiers concernés par cette tâche :

| Fichier | Rôle |
|---|---|
| `apps/medusa/src/admin/routes/appearance/page.tsx` | Entrée dans Apparence du site |
| `apps/medusa/src/admin/routes/appearance/homepage/page.tsx` | Éditeur français, aperçu, ordre, imports et confirmations |
| `apps/medusa/src/api/admin/homepage-content/route.ts` | Lecture/sauvegarde/publication administrateur |
| `apps/medusa/src/api/admin/homepage-content/collections/route.ts` | Collections existantes, liste paginée complète |
| `apps/medusa/src/api/admin/homepage-content/images/route.ts` | Réutilisation des imports du slider |
| `apps/medusa/src/api/store/homepage-content/route.ts` | Contenu publié uniquement |
| `apps/medusa/src/api/middlewares.ts` | Authentification et validation des nouvelles routes |
| `apps/medusa/src/lib/homepage-content.ts` | Contrat partagé et valeurs d’origine |
| `apps/medusa/src/lib/homepage-content-validation.ts` | Validation des contenus, liens et couleurs |
| `apps/medusa/src/modules/branding/service.ts` | Sauvegarde atomique et contrôle des révisions |
| `apps/medusa/src/modules/branding/models/homepage-content-settings.ts` | Modèle de données |
| `apps/medusa/src/modules/branding/migrations/Migration20261011193917.ts` | Migration additive |
| `apps/medusa/src/modules/branding/migrations/.snapshot-branding.json` | Snapshot généré |
| `apps/storefront/src/app/layout.tsx` | Annonce publiée dans l’en-tête |
| `apps/storefront/src/app/page.tsx` | Sections et contenu publiés sur l’accueil |
| `apps/storefront/src/app/homepage-content.css` | Styles des nouveaux blocs uniquement |
| `apps/storefront/src/components/storefront/header.tsx` | Annonce configurable |
| `apps/storefront/src/components/storefront/homepage-content-blocks.tsx` | Cartes de collection et promotions adaptatives |
| `apps/storefront/src/lib/homepage-content.ts` | Lecture et validation publique avec repli |
| `apps/storefront/src/lib/store-homepage-content.ts` | Lecture serveur et résolution du média existant |
| `scripts/test-homepage-content.mjs` | Tests unitaires |
| `scripts/test-homepage-content-integration.mjs` | Test API/base isolé |
| `package.json` | Commandes de test |
| `docs/homepage-content-management.md` | Documentation et checklist |

Aucun commit ni push automatique.
