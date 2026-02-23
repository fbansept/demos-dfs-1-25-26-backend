const jwtUtils = require("jsonwebtoken");

const jwtInterceptor = (req, res, next) => {
  const token = req.headers["authorization"];
  console.log(token);

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const jwt = token.split(" ")[1];

  try {
    const payload = jwtUtils.verify(jwt, "azerty");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = jwtInterceptor;
