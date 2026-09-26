// requireAdmin.js
// Blocca l'accesso alle rotte admin se la sessione non è autenticata.
// A differenza della vecchia versione (sessionStorage lato client, bypassabile
// dalla console), qui il controllo è lato server sulla sessione firmata.

module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.status(401).json({ error: 'Non autenticato' });
};
