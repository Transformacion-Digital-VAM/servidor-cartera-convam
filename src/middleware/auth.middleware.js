import admin from '../config/firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Falta token' });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;  // Guardamos info del usuario
    next();

  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
