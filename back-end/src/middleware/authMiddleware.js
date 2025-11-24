import jwt from "jsonwebtoken";

export const autenticar = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Acesso negado. Token não encontrado." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token inválido." });
  }
};
