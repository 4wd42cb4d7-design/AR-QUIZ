# Cas Cliniques — V1

Prototype Next.js/React d'un cas clinique interactif de choc septique urinaire.

## Contenu
- 5 questions : QCM + QROC
- chronomètre individuel : 20 à 60 secondes
- correction immédiate et explication
- évolution progressive du cas
- score final
- squelette Supabase (`supabase.sql`, clients browser/server)

## Lancer localement
```bash
npm install
cp .env.example .env.local
npm run dev
```

Pour la première V1, le cas est embarqué dans `app/page.tsx`. La migration vers Supabase consiste ensuite à déplacer les cas/questions/options dans les tables fournies et à enregistrer les tentatives.

## Déploiement
Cloudflare documente actuellement le déploiement de Next.js statique sur Pages. Pour une application Next.js full-stack, Cloudflare recommande désormais son parcours Workers/vinext. Si l'objectif reste strictement Pages, cette V1 peut être exportée statiquement ; si l'on active authentification + données Supabase côté serveur, je recommande le parcours Workers/vinext plutôt que de forcer Pages.
