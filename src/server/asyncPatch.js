// asyncPatch.js
// Express 4 non intercetta le promise rifiutate nelle route async: se il database dà errore
// il processo crasha (o la richiesta resta appesa) e dal browser vedi solo un errore generico.
// Questa patch inoltra l'errore all'error handler di index.js, che risponde con un 500 leggibile.

const Layer = require('express/lib/router/layer');

Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) return next(); // middleware di errore: si comporta come l'originale
  try {
    const out = fn(req, res, next);
    if (out && typeof out.catch === 'function') out.catch(next);
  } catch (err) {
    next(err);
  }
};
