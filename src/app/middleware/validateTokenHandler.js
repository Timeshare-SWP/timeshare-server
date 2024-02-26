const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {
  try {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          res.status(401);
          throw new Error("Sai email hoặc mật khẩu!");
        }
        req.user = decoded.user;
        next();
      });
      if (!token) {
        res.status(401);
        throw new Error("User is not Authorized or token is missing");
      }
    } else {
      res.status(401);
      throw new Error("Missing Access Token!");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const validateTokenAdmin = asyncHandler(async (req, res, next) => {
  try {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          res.status(401);
          throw new Error("Sai email hoặc mật khẩu!");
        }
        if (decoded.user.roleName !== "Admin") {
          res.status(403);
          throw new Error("Chi có Admin có quyền thực hiện chức năng này");
        }
        req.user = decoded.user;
        next();
      });
      if (!token) {
        res.status(401);
        throw new Error("User is not Authorized or token is missing");
      }
    } else {
      res.status(401);
      throw new Error("Missing Access Token!");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const validateTokenInvestor = asyncHandler(async (req, res, next) => {
  try {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          res.status(401);
          throw new Error("Sai email hoặc mật khẩu!");
        }
        if (decoded.user.roleName !== "Investor") {
          res.status(403);
          throw new Error("Chỉ có chủ đầu tư có quyền thực hiện chức năng này");
        }
        req.user = decoded.user;
        next();
      });
      if (!token) {
        res.status(401);
        throw new Error("User is not Authorized or token is missing");
      }
    } else {
      res.status(401);
      throw new Error("Missing Access Token!");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  validateToken,
  validateTokenAdmin,
  validateTokenInvestor,
};
