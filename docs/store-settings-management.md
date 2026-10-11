# Paramètres de la boutique

Page locale : [Paramètres de la boutique](http://localhost:9001/app/store-settings). Utilisez votre compte administrateur existant.

## Utilisation

L’écran propose cinq onglets français : **Informations**, **Réseaux sociaux**, **Livraison**, **Paiement** et **Politiques**. Enregistrer applique les changements ; Annuler les modifications restaure la version chargée après confirmation. Quitter avec des modifications non enregistrées affiche un avertissement. Les modifications de livraison/paiement nécessitent une confirmation supplémentaire indiquant leur effet sur les paniers non finalisés.

- Le nom réutilise le champ `name` du Store Medusa existant. Les autres informations sont conservées dans ses métadonnées, sans nouvelle table. Le nom générique initial « Medusa Store » reste en base tant que vous n’enregistrez pas ; l’éditeur et le site continuent d’utiliser le nom historique Amoon par défaut.
- E-mail, téléphone et adresse apparaissent sur Contact. Description et nom apparaissent dans le pied de page ; le nom actualise aussi le titre global de l’application. Les logos restent gérés par Logo & Identité visuelle.
- WhatsApp met à jour le bouton flottant, Contact, le pied de page et les liens des fiches produit. Instagram met à jour le pied de page, Contact et la section Instagram de l’accueil. Facebook et TikTok apparaissent sur Contact et dans le pied de page. Un champ social vide masque ses liens ; sans URL Instagram, la section Instagram de l’accueil est omise.
- Les politiques sont affichées comme texte simple sur Informations. Les retours à la ligne sont conservés ; HTML et scripts ne sont jamais interprétés. Les anciennes promesses de délai d’échange dans les composants de service deviennent un libellé général si vous personnalisez la politique d’échange.

## Livraison et paiement

Les options de livraison existantes sont listées. **Aucune option n’est modifiée simplement en ouvrant la page ou en enregistrant les informations de contact.** Cocher Personnaliser puis confirmer l’enregistrement active les frais, villes, seuil et visibilité de cette option.

La personnalisation réutilise les options manuelles simples existantes en MAD. Elle conserve leur ID, profil, zone géographique, règles d’exposition et fournisseur `manual_manual`. La tarification devient calculée avec le même fournisseur manuel, étendu par un service local qui conserve ses opérations de fulfillment. Ce service lit les montants dans les paramètres persistés et calcule le tarif depuis les articles du panier serveur. Il ignore les montants et autres données de tarification fournis par le navigateur.

Le tarif d’origine, le nom et les données de l’option sont conservés dans une sauvegarde privée. Décocher Personnaliser puis enregistrer restaure la tarification originale. Les options avancées/multidevises ou celles d’autres transporteurs restent gérées dans l’interface Livraison habituelle de Medusa ; elles ne sont pas réécrites par ce nouvel écran.

Les villes sont une liste facultative, une par ligne. Vide signifie toutes les villes du Maroc pour cette option. Les comparaisons ignorent casse et accents, et les adresses hors Maroc sont refusées pour les options personnalisées. Les frais et seuils sont en MAD, non négatifs, avec deux décimales maximum. Les frais sont hors taxes éventuelles ; Medusa conserve le calcul des taxes et promotions. Le seuil gratuit utilise le sous-total des articles avant réductions, sans frais de livraison.

Le fournisseur de paiement existant `pp_system_default` est conservé. Aucun nouveau fournisseur de paiement n’est ajouté. Le réglage COD masque le mode de paiement dans le checkout et bloque aussi la confirmation côté Medusa pour les paniers non finalisés. Les commandes existantes et leur récupération idempotente restent possibles après désactivation de COD.

Les hooks Medusa vérifient, au moment de la sélection et de la confirmation, ville, devise, activation et tarif attendu. La confirmation d’une commande utilise les totaux natifs Medusa et le contrôle de paiement préexistant. Si une règle change pendant un achat, un récapitulatif avec un ancien tarif personnalisé ne peut pas être confirmé : le client doit sélectionner à nouveau sa livraison. En cas d’indisponibilité des paramètres, le checkout échoue de manière sûre au lieu d’accepter une commande sans contrôle.

## Persistance, migrations et déploiement

**Aucune migration de schéma n’est nécessaire.** Les champs existants `store.name`, `store.metadata` et les options de livraison Medusa sont réutilisés. Les namespaces de métadonnées sont `amoon_store_settings` (paramètres et révision) et `amoon_delivery_backups` (restauration privée). Les autres métadonnées sont conservées. Les lectures publiques exposent uniquement les champs validés, jamais les métadonnées complètes, sauvegardes ou secrets.

Les sauvegardes contrôlent la révision et utilisent le verrou du workflow. Les modifications des options réutilisent le workflow Medusa avec compensation ; la sauvegarde du Store est atomique et prévoit sa compensation. Les paramètres survivent au redémarrage et à une nouvelle compilation/déploiement grâce à la base existante.

Le backend et l’admin existants sont compilés puis redémarrés pour charger la route et le service manuel étendu. Ne pas ajouter de second fournisseur manuel : le provider garde son identifiant actuel. Pour un autre environnement configuré :

```powershell
npm run build --workspace @amoon/medusa
```

Redémarrer ensuite le backend selon son environnement. En local, utiliser les commandes habituelles dans deux terminaux :

```powershell
npm run dev:native
```

```powershell
npm run dev:storefront
```

Une sauvegarde privée du magasin local a été réalisée avant activation. Vérification SQL après activation : nom/métadonnées du Store, options et prix de livraison, produits/commandes/comptes, slider, branding, thème et contenu d’accueil inchangés. Le magasin principal garde ses règles d’origine jusqu’à votre premier enregistrement explicite. Aucun déploiement sur amoon.ma, aucun commit ni push.

## Vérification

```powershell
npm run test:settings
node --test scripts/test-theme.mjs scripts/test-slider.mjs scripts/test-branding.mjs scripts/test-homepage-content.mjs apps/storefront/scripts/catalog-tests.mjs
npm run typecheck
npm run lint
```

Résultat : **100 tests passent** — neuf tests unitaires de paramètres, 90 tests existants et un test d’intégration complet. Lint, TypeScript, compilation backend/admin et contrôle des espaces dans les diffs passent.

Le test d’intégration exige `SETTINGS_TEST_DATABASE_URL`, `SETTINGS_TEST_BACKEND_URL`, `SETTINGS_TEST_ADMIN_EMAIL` et `SETTINGS_TEST_ADMIN_PASSWORD`. Il refuse les ports du magasin principal, les serveurs distants et les bases normales. Utiliser une base locale dont le nom contient `_settings_test`, `_homepage_test`, `_theme_test`, `_branding_test` ou `_slider_test`, sans paramètres déjà enregistrés, avec une région MAD/Maroc, un canal de vente et une option manuelle simple préparés via le setup de checkout existant.

```powershell
npm run test:settings:integration
```

Ce test crée ses produits, paniers, clé publique, option supplémentaire et commande uniquement dans la base isolée. Il vérifie : auth, validation, absence de secrets publics, conservation des règles lors d’un enregistrement de contact, conflit de révision, frais serveur de 30 MAD malgré des données client falsifiées, montant total de 130 MAD, refus d’une ville non éligible, gratuité au seuil avec commande de 200 MAD, désactivation COD, récupération d’une commande déjà finalisée, désactivation d’option, restauration du tarif et absence de changement aux paramètres d’apparence/options avancées.

Les premiers contrôles ont trouvé des types de liens sociaux nullable, un champ manquant dans un panier de test et une variable inutilisée dans le test ; corrigés. L’intégration a révélé que la nouvelle règle COD bloquait la récupération d’une commande finalisée : le hook applique maintenant les nouvelles politiques seulement aux paniers non finalisés, puis le test complet passe. Aucun problème fonctionnel connu ne reste ouvert.

Le navigateur vérifie les onglets français, la validation d’une URL Instagram dangereuse, la confirmation d’annulation et celle de modification du paiement, ainsi qu’un enregistrement réussi depuis le formulaire. La largeur mobile mesurée est de 408 px, sans débordement horizontal. Les contrôles HTTP confirment la persistance après redémarrage, les liens publics, Contact et l’échappement des scripts dans les politiques.

## Checklist manuelle

1. Ouvrir le port 9001, se connecter avec le compte administrateur habituel, puis Paramètres de la boutique. Vérifier les cinq onglets et l’affichage sur mobile.
2. Modifier nom, e-mail, téléphone avec indicatif, adresse et description. Annuler et confirmer : les champs reviennent à la version chargée. Modifier à nouveau puis enregistrer ; recharger Contact et le pied de page.
3. Modifier WhatsApp et les URLs sociales, enregistrer et vérifier bouton flottant, Contact, pied de page, Instagram de l’accueil et une fiche produit. Essayer un numéro invalide ou `javascript:` : message français, aucune sauvegarde.
4. Dans Livraison, laisser Personnaliser décoché puis enregistrer un champ de contact : les frais actuels restent inchangés. Personnaliser ensuite une option, définir 30 MAD, Casablanca et un seuil de 200 MAD ; confirmer. Tester un panier sous le seuil, au-dessus du seuil et une adresse à Rabat. Les règles non personnalisées restent disponibles selon leur configuration Medusa.
5. Désactiver une livraison et vérifier qu’elle disparaît du choix et ne peut plus confirmer un panier ancien. Décocher Personnaliser, enregistrer et vérifier la restauration du tarif d’origine.
6. Désactiver COD après confirmation : aucune méthode de paiement COD à la commande et aucune nouvelle commande COD possible. Vérifier qu’une commande déjà enregistrée garde sa confirmation. Réactiver ensuite COD.
7. Modifier les politiques avec plusieurs lignes et éventuellement du texte `<script>…</script>` : le texte est visible sans exécution sur Informations. Vérifier le libellé d’échange dans l’en-tête et les services.
8. Recharger l’éditeur et redémarrer le backend : les paramètres persistent. Ouvrir deux onglets et enregistrer à partir de la même révision : le second demande de recharger. Vérifier aussi slider, logos, couleurs et contenu de l’accueil.

## Fichiers concernés par la tâche 5

| Fichier | Rôle |
|---|---|
| `apps/medusa/medusa-config.ts` | Service manuel étendu, même identité de provider |
| `apps/medusa/src/admin/routes/store-settings/page.tsx` | Éditeur français, onglets, sauvegarde et confirmations |
| `apps/medusa/src/api/admin/store-settings/route.ts` | Lecture et mutation protégées |
| `apps/medusa/src/api/store/store-settings/route.ts` | Informations publiques validées uniquement |
| `apps/medusa/src/api/store/shipping-options/route.ts` | Réutilisation des options natives avec disponibilité/tarifs personnalisés |
| `apps/medusa/src/api/middlewares.ts` | Authentification et validation |
| `apps/medusa/src/lib/store-settings.ts` | Contrat et calculs partagés |
| `apps/medusa/src/lib/store-settings-validation.ts` | Validation de saisie |
| `apps/medusa/src/lib/store-settings-db.ts` | Lecture des champs du Store existant |
| `apps/medusa/src/lib/store-settings-shipping.ts` | Inspection et classification des options existantes |
| `apps/medusa/src/modules/branding/service.ts` | Sauvegarde atomique/révision/compensation dans le Store |
| `apps/medusa/src/modules/amoon-manual-fulfillment/index.ts` | Enregistrement du service manuel |
| `apps/medusa/src/modules/amoon-manual-fulfillment/service.ts` | Calcul serveur des frais et seuils |
| `apps/medusa/src/workflows/save-store-settings.ts` | Verrou, conservation/restauration et compensation |
| `apps/medusa/src/workflows/checkout-validation.ts` | Contrôles finaux de livraison et COD |
| `apps/storefront/src/lib/store-settings.ts` | Lecture/validation des paramètres publics |
| `apps/storefront/src/lib/store-config.ts` | Configuration persistante et liens sociaux |
| `apps/storefront/src/lib/checkout.ts` | Lecture sûre des réglages de checkout |
| `apps/storefront/src/lib/medusa-checkout.ts` | COD et récapitulatif avec tarif courant |
| `apps/storefront/src/app/layout.tsx` | Nom global et informations de service |
| `apps/storefront/src/app/page.tsx` | Liens Instagram et libellés de service cohérents |
| `apps/storefront/src/app/contact/page.tsx` | Coordonnées et réseaux sociaux |
| `apps/storefront/src/app/informations/page.tsx` | Politiques en texte simple |
| `apps/storefront/src/app/produits/[handle]/page.tsx` | WhatsApp actualisé |
| `apps/storefront/src/components/storefront/footer.tsx` | Nom, description et liens publics |
| `apps/storefront/src/components/storefront/header.tsx` | Libellés COD/échange et nom |
| `apps/storefront/src/components/storefront/whatsapp-button.tsx` | Numéro WhatsApp enregistré |
| `apps/storefront/src/components/storefront/homepage-hero.tsx` | Réglages de service transmis au slider existant |
| `apps/storefront/src/components/storefront/hero-slider.tsx` | Libellés de service sans changer la gestion des slides |
| `apps/storefront/src/components/cart/checkout-form.tsx` | Méthodes activées seulement |
| `scripts/test-store-settings.mjs` | Tests unitaires |
| `scripts/test-store-settings-integration.mjs` | Test réel isolé du checkout |
| `package.json` | Commandes de test |
| `docs/store-settings-management.md` | Documentation et checklist |
