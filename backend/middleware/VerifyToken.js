import pkg from "jsonwebtoken";
const { verify } = pkg;

export const verifyToken = (req, res, next) => {
  //logic to verify token
  const encryptedToken = req.cookies.token;

  if (!encryptedToken) return res.json({ message: "Invalid Token" });
  else {
    try {
      const decodedToken = verify(encryptedToken, "abcdef");
      req.user = decodedToken;
      next();
    } catch (err) {
      res.json({ message: "Session Expired Try Again ❌❌" });
    }
  }
};
