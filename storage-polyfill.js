'use strict';

/* =========================================================
   Polyfill window.storage
   ---------------------------------------------------------
   window.storage n'est pas une API standard des navigateurs :
   elle n'est fournie que par certains environnements hôtes
   sandboxés. Sur un site statique classique (ex: GitHub Pages),
   rien ne la propose nativement.

   Ce fichier ne fait qu'une chose : si l'environnement hôte n'a
   pas déjà défini window.storage, on en fournit une implémentation
   de secours adossée à localStorage, avec la même interface
   asynchrone get/set. Le reste de l'application (app.js) continue
   d'appeler exclusivement window.storage et ignore totalement
   l'origine réelle du stockage.
   ========================================================= */

if (typeof window.storage === 'undefined') {
  window.storage = {
    async get(key) {
      return localStorage.getItem(key);
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    }
  };
}
