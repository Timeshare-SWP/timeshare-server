const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//@desc Login user
//@route POST /api/auth/login
//@access public
const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("All field not be empty!");
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error(`User with email ${email} not found`);
    }
    //compare password to hashedPassword
    const matches = await bcrypt.compare(password, user.password);
    if (user && matches) {
      if (!user.status) {
        res.status(401);
        throw new Error(
          "User has already been blocked! Please contact the administrator!"
        );
      }
      const role_id = user.role_id.toString();
      const role = await Role.findById(role_id);
      const accessToken = jwt.sign(
        {
          user: {
            fullName: user.fullName,
            email: user.email,
            roleName: role.roleName,
            role_id: user.role_id,
            avatar_url: user.avatar_url,
            id: user.id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      const refreshToken = jwt.sign(
        {
          user: {
            fullName: user.fullName,
            email: user.email,
            roleName: role.roleName,
            role_id: user.role_id,
            avatar_url: user.avatar_url,
            id: user.id,
          },
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Create secure cookie with refresh token
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      });

      res.status(200).json({ accessToken });
    } else {
      res.status(401);
      throw new Error("Email or Password is not Valid!");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const isNewGoogleAccount = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const isExist = await User.findOne({ email });
    res.status(200).send(!!isExist);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Login user
//@route POST /api/auth/login
//@access public
const loginGoogle = asyncHandler(async (req, res, next) => {
  try {
    const { fullName, email, avatar_url, roleName } = req.body;
    if (fullName === undefined || !email || !avatar_url || !roleName) {
      res.status(400);
      throw new Error("All fields are required");
    }
    const isExist = await User.findOne({ email }).populate("role_id");
    const role = await Role.findOne({ roleName: roleName });
    if (isExist) {
      const accessToken = jwt.sign(
        {
          user: {
            fullName: isExist.fullName,
            email: isExist.email,
            roleName: isExist.role_id.roleName,
            role_id: isExist.role_id._id,
            avatar_url: isExist.avatar_url,
            id: isExist.id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        {
          user: {
            fullName: isExist.fullName,
            email: isExist.email,
            roleName: isExist.role_id.roleName,
            role_id: isExist.role_id._id,
            avatar_url: isExist.avatar_url,
            id: isExist.id,
          },
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Create secure cookie with refresh token
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      });

      res.status(200).json({ accessToken });
    }

    const user = await User.create({
      fullName,
      email,
      avatar_url,
      role_id: role._id.toString(),
    });
    if (!user) {
      res.status(500);
      throw new Error("Something went wrong creating user in Login Google");
    }
    const accessToken = jwt.sign(
      {
        user: {
          fullName: user.fullName,
          email: user.email,
          roleName: role.roleName,
          role_id: user.role_id,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      {
        user: {
          fullName: user.fullName,
          email: user.email,
          roleName: role.roleName,
          role_id: user.role_id,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, //accessible only by web server
      secure: true, //https
      sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    console.log(error);
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

// @desc Refresh Token
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
      res.status(401);
      throw new Error("Cookies wrong!");
    }

    const refreshToken = cookies.jwt;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      asyncHandler(async (err, decoded) => {
        if (err) {
          res.status(403);
          throw new Error("Something wrong in refreshToken!");
        }
        const user = await User.findOne({ email: decoded.user.email });

        if (!user) {
          res.status(401);
          throw new Error("Email or Password is not Valid!");
        }

        const role_id = user.role_id.toString();
        const role = await Role.findById(role_id);
        const accessToken = jwt.sign(
          {
            user: {
              fullName: user.fullName,
              email: user.email,
              roleName: role.roleName,
              role_id: user.role_id,
              avatar_url: user.avatar_url,
              id: user.id,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        res.json({ accessToken });
      })
    );
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      res.sendStatus(204);
      throw new Error("No Content!");
    }
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.status(200).json({ message: "Cookie cleared" });
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
};

module.exports = { login, loginGoogle, refresh, logout, isNewGoogleAccount };
