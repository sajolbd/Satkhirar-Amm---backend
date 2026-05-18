const jwt = require("jsonwebtoken");

function signToken(user) {
  const secret = process.env.JWT_SECRET || "satkhirar-amm-local-secret";

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      phone: user.phone,
    },
    secret,
    { expiresIn: "7d" }
  );
}

module.exports = signToken;
