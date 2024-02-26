const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Role = require("../models/Role");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment/moment");
const RoleEnum = require("../../enum/RoleEnum");

//@desc Register New user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const {
      fullName,
      gender,
      dob,
      address,
      phone_number,
      email,
      password,
      roleName,
    } = req.body;
    if (
      fullName === undefined ||
      gender === undefined ||
      dob === undefined ||
      address === undefined ||
      phone_number === undefined ||
      email === undefined ||
      password === undefined ||
      roleName === undefined
    ) {
      res.status(400);
      throw new Error("All field not be empty!");
    }
    if (roleName === RoleEnum.ADMIN) {
      res.status(400);
      throw new Error("Không thể tạo tài khoản với vai trò admin");
    }
    const userEmailAvailable = await User.findOne({ email });
    if (userEmailAvailable) {
      res.status(400);
      throw new Error("User has already registered with Email!");
    }

    if (phone_number !== "") {
      const pattern = /^0\d{9}$/;
      if (!pattern.test(phone_number)) {
        res.status(400);
        throw new Error(
          "phone_number must have 10 numbers and start with 0 number!"
        );
      }
      const userPhoneNumberAvailable = await User.findOne({ phone_number });
      if (userPhoneNumberAvailable) {
        res.status(400);
        throw new Error(
          "User has already registered with phone_number Number!"
        );
      }
    }

    const date = new Date(dob);

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await Role.findOne({ roleName });
    const user = await User.create({
      fullName,
      gender,
      dob: dob === "" ? dob : date,
      address,
      phone_number,
      email,
      password: hashedPassword,
      role_id: role._id.toString(),
    });
    if (!user) {
      res.status(400);
      throw new Error("User data is not Valid!");
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
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Register New user
//@route POST /api/users/register
//@access public
const registerStaff = asyncHandler(async (req, res, next) => {
  try {
    const {
      fullName,
      gender,
      dob,
      address,
      phone_number,
      email,
      password,
      roleName,
    } = req.body;
    if (
      fullName === undefined ||
      gender === undefined ||
      dob === undefined ||
      address === undefined ||
      phone_number === undefined ||
      email === undefined ||
      password === undefined ||
      roleName === undefined
    ) {
      res.status(400);
      throw new Error("All field not be empty!");
    }
    if (req.user.roleName !== RoleEnum.ADMIN) {
      res.status(403);
      throw new Error("Chỉ có admin có thể tạo tài khoản cho staff");
    }
    if (roleName !== RoleEnum.STAFF) {
      res.status(400);
      throw new Error("Admin chỉ có thể tạo tài khoản cho staff");
    }
    const userEmailAvailable = await User.findOne({ email });
    if (userEmailAvailable) {
      res.status(400);
      throw new Error("User has already registered with Email!");
    }

    if (phone_number !== "") {
      const pattern = /^0\d{9}$/;
      if (!pattern.test(phone_number)) {
        res.status(400);
        throw new Error(
          "phone_number must have 10 numbers and start with 0 number!"
        );
      }
      const userPhoneNumberAvailable = await User.findOne({ phone_number });
      if (userPhoneNumberAvailable) {
        res.status(400);
        throw new Error(
          "User has already registered with phone_number Number!"
        );
      }
    }

    const date = new Date(dob);

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await Role.findOne({ roleName });
    const user = await User.create({
      fullName,
      gender,
      dob: dob === "" ? dob : date,
      address,
      phone_number,
      email,
      password: hashedPassword,
      role_id: role._id.toString(),
    });
    if (!user) {
      res.status(400);
      throw new Error("User data is not Valid!");
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
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Register New user
//@route POST /api/users/otpRegister
//@access public
const sendOTPWhenRegister = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(404);
      throw new Error("Invalid email address");
    }
    const userEmailAvailable = await User.findOne({ email });
    if (userEmailAvailable) {
      res.status(400);
      throw new Error("User has already been registered");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Verify OTP when registering",
      html: `<body style="background-color:#ffffff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
      <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%"
          style="max-width:37.5em;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:360px;margin:0 auto;padding:68px 0 130px">
          <div>
              <tr style="width:100%">
                  <td>
                      <img alt="Khoduan" src="https://live.staticflickr.com/65535/53485140987_994e2c61a7_t.jpg"
                          width="200" height="auto"
                          style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto" />
                      <p
                          style="font-size:11px;line-height:16px;margin:16px 8px 8px 8px;color:#0a85ea;font-weight:700;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;height:16px;letter-spacing:0;text-transform:uppercase;text-align:center">
                          Xác thực Email</p>
                      <h1
                          style="color:#000;display:inline-block;font-family:HelveticaNeue-Medium,Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;line-height:24px;margin-bottom:0;margin-top:0;text-align:center">
                          Đây là mã OTP để hoàn thành việc tạo tài khoản của bạn
                      </h1>
                      <table
                          style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:280px"
                          align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                          <tbody>
                              <tr>
                                  <td>
                                      <p
                                          style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">
                                          ${otp}</p>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  
                      <p
                          style="font-size:15px;line-height:23px;margin:0;color:#444;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;letter-spacing:0;padding:0 40px;text-align:center">
                          Liên hệ <a target="_blank" style="color:#444;text-decoration:underline"
                              href="mailto:khoduan_working@gmail.com">timeshare@gmail.com</a> nếu bạn không yêu cầu tạo tài khoản
                      </p>
                  </td>
              </tr>
          </div>
      </table>
  </body>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.status(200).json({ otp, otpExpires });
      }
    });
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Register New user
//@route POST /api/users/verifyOtpRegister
//@access public
const verifyOTPWhenRegister = asyncHandler(async (req, res, next) => {
  try {
    const { otp, otpExpired, otpStored } = req.body;
    if (otpStored !== otp) {
      res.status(400);
      throw new Error("Wrong OTP! Please try again");
    }
    const currentTime = moment(new Date());
    const otpExpires = moment(otpExpired);
    const isExpired = currentTime.diff(otpExpires, "minutes");
    if (isExpired > 10) {
      res.status(400);
      throw new Error("OTP is expired! Please try again");
    }

    res.status(200).send("Successfully registered");
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Get all users
//@route GET /api/users
//@access private
const getUsers = asyncHandler(async (req, res, next) => {
  try {
    if (req.user.roleName !== "Admin") {
      res.status(403);
      throw new Error(
        "Chỉ có Admin có quyền truy xuất thông tin tất cả tài khoản"
      );
    }
    let users = await User.find().populate("role_id").exec();
    if (!users) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi Admin truy xuất thông tin tất cả tài khoản"
      );
    }
    users = users.filter((user) => user.role_id.roleName !== RoleEnum.ADMIN);
    res.status(200).json(users);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Get all users
//@route GET /api/users/investors
//@access private
const getInvestors = asyncHandler(async (req, res, next) => {
  try {
    const investorRole = await Role.findOne({ roleName: "Investor" });
    const users = await User.find({ role_id: investorRole._id })
      .populate("role_id")
      .exec();
    if (!users) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi Admin truy xuất thông tin tất cả tài khoản"
      );
    }
    res.status(200).json(users);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Get all users
//@route GET /api/users
//@access private
const getStaffs = asyncHandler(async (req, res, next) => {
  try {
    const investorRole = await Role.findOne({ roleName: "Staff" });
    const users = await User.find({ role_id: investorRole._id })
      .populate("role_id")
      .exec();
    if (!users) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi Admin truy xuất thông tin tất cả tài khoản"
      );
    }
    res.status(200).json(users);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Get all users
//@route GET /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Get user
//@route GET /api/users/:id
//@access private
const getUserById = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("role_id").exec();
    if (!user) {
      res.status(404);
      throw new Error("User Not Found!");
    }
    const userEmail = user.email;
    if (!(req.user.email === userEmail || req.user.roleName === "Admin")) {
      res.status(403);
      throw new Error("You don't have permission to get user's profile");
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(res.statusCode).send(error.message || "Internal Server Error");
  }
});

//@desc Update user
//@route PUT /api/users/:id
//@access private
const updateUsers = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User Not Found!");
    }
    const { fullName, gender, dob, address, phone_number } = req.body;
    if (
      fullName === undefined ||
      gender === undefined ||
      dob === undefined ||
      address === undefined ||
      phone_number === undefined
    ) {
      res.status(400);
      throw new Error("All field not be empty!");
    }
    if (req.user.email !== user.email) {
      res.status(403);
      throw new Error("You don't have permission to update user's profile");
    }
    const isChangePhoneNumber = user.phone_number !== phone_number;
    if (isChangePhoneNumber) {
      if (phone_number !== "") {
        const userPhoneNumberAvailable = await User.findOne({ phone_number });
        if (userPhoneNumberAvailable) {
          res.status(400);
          throw new Error(
            "User has already registered with phone_number Number!"
          );
        }
      }
    }
    const updateUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updateUser);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Delete user
//@route DELETE /api/users/:id
//@access private
const deleteUsers = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User Not Found!");
    }
    if (req.user.roleName !== "Admin") {
      res.status(403);
      throw new Error("You don't have permission to update user's profile");
    }
    await User.deleteOne({ _id: req.params.id });
    res.status(200).json(user);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc User change password
//@route GET /api/users/checkOldPassword/:id
//@access private
const checkOldPassword = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const { password } = req.body;
    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      res.status(401);
      throw new Error("Old password is incorrect");
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc User change password
//@route GET /api/users/changePassword/:id
//@access private
const changePassword = asyncHandler(async (req, res, next) => {
  try {
    const investor_id = req.params.id;
    const user = await User.findById(investor_id);
    if (!user) {
      res.status(404);
      throw new Error("User not Found!");
    }
    if (req.user.id !== investor_id) {
      res.status(403);
      throw new Error("You don't have permission to change other password!");
    }
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      res.status(400);
      throw new Error("All field not be empty!");
    }
    if (password !== confirmPassword) {
      res.status(400);
      throw new Error("Password and confirm password are different!");
    }
    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      res.status(500);
      throw new Error(
        "Something when wrong in hashPassword of changePassword function!"
      );
    }
    const updatePassword = await User.findByIdAndUpdate(
      investor_id,
      {
        password: hashedPassword,
      },
      { new: true }
    );
    if (!updatePassword) {
      res.status(500);
      throw new Error("Something when wrong in changePassword");
    }
    res.status(200).json(updatePassword);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(404);
      throw new Error("Email invalid");
    }
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpires = new Date();
    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password OTP",
      html: `<body style="background-color:#ffffff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
      <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%"
          style="max-width:37.5em;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;width:360px;margin:0 auto;padding:68px 0 130px">
          <div>
              <tr style="width:100%">
                  <td>
                      <img alt="Khoduan" src="https://live.staticflickr.com/65535/53485140987_994e2c61a7_t.jpg"
                          width="200" height="auto"
                          style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto" />
                      <p
                          style="font-size:11px;line-height:16px;margin:16px 8px 8px 8px;color:#0a85ea;font-weight:700;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;height:16px;letter-spacing:0;text-transform:uppercase;text-align:center">
                          Xác thực Email</p>
                      <h1
                          style="color:#000;display:inline-block;font-family:HelveticaNeue-Medium,Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;line-height:24px;margin-bottom:0;margin-top:0;text-align:center">
                          Đây là mã OTP để hoàn thành việc cấp lại mật khẩu cho bạn
                      </h1>
                      <table
                          style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:280px"
                          align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%">
                          <tbody>
                              <tr>
                                  <td>
                                      <p
                                          style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">
                                          ${otp}</p>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  
                      <p
                          style="font-size:15px;line-height:23px;margin:0;color:#444;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;letter-spacing:0;padding:0 40px;text-align:center">
                          Liên hệ <a target="_blank" style="color:#444;text-decoration:underline"
                              href="mailto:khoduan_working@gmail.com">timeshare@gmail.com</a> nếu bạn không yêu cầu tạo tài khoản
                      </p>
                  </td>
              </tr>
          </div>
      </table>
  </body>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });

    res.status(200).json("OTP sent to email");
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(404);
      throw new Error("Invalid email or otp");
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    if (user.otp.toString() !== otp) {
      res.status(400);
      throw new Error("Wrong OTP! Please try again");
    }
    const currentTime = moment(new Date());
    const otpExpires = moment(user.otpExpires);
    const isExpired = currentTime.diff(otpExpires, "minutes");
    if (isExpired > 10) {
      res.status(400);
      throw new Error("OTP is expired! Please try again");
    }
    const newPassword = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(newPassword.toString(), 10);
    const updateUser = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
      },
      { new: true }
    );
    if (!updateUser) {
      res.status(500);
      throw new Error(
        "Something went wrong when updating new password in reset password!"
      );
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password OTP",
      html: `<body style="background-color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe
      UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif">
      <div style="width:50vw; margin: 0 auto">
          <div style="display: flex;justify-content: center;">
              <img src="https://live.staticflickr.com/65535/53485140987_994e2c61a7_t.jpg"
                  style="width: auto;height:20px;object-fit: cover">
          </div>
          <table style="padding:0 40px" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation"
              width="100%">
              <tbody>
                  <tr>
                      <td>
                          <hr
                              style="width:100%;border:none;border-top:1px solid black;border-color:black;margin:20px 0" />
                          <p style="font-size:14px;line-height:22px;margin:16px 0;color:#3c4043;margin-bottom: 25px;">
                              Xin chào
                              <a style="font-size:16px;line-height:22px;margin:16px 0;font-weight: bold;">${user.fullName},</a>
                          </p>
                          <p style="font-size:14px;line-height:22px;margin:16px 0;color:#3c4043;text-align: justify">
                              Để bảo vệ thông tin cũng như quyền lợi của bạn, vui lòng không chia sẽ thông tin này đến với
                              bất kì ai.
                          </p>
  
                          <p style="font-size:14px;line-height:22px;margin:16px 0;margin-bottom:10px;color:#3c4043">
                              Mật khẩu mới để đăng nhập vào hệ thống của bạn là:
                          <div style="margin-left: 25px;">
                              <p style="font-size:14px;line-height:22px;margin:10px 0;color:#3c4043">EMAIL:
                                  <a style="text-decoration:none;font-size:14px;line-height:22px">
                                      ${user.email}
                                  </a>
                              </p>
                              <p style="font-size:14px;line-height:22px;margin:10px 0px 0px 0px;color:#3c4043">MẬT KHẨU:
                                  <a style="text-decoration:none;font-size:14px;line-height:22px">
                                      ${newPassword}
                                  </a>
                              </p>
                          </div>
                          </p>
                      </td>
                  </tr>
              </tbody>
          </table>
  
          <table style="padding:0 40px" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation"
              width="100%">
              <tbody>
                  <tr>
                      <td>
                          <p style="font-size:14px;line-height:22px;margin:16px 0;color:#3c4043;text-align: justify">
                              Hãy liên lạc với chúng tôi nếu bạn có thắc mắc nào thêm.
                          </p>
                          <p style="font-size:14px;line-height:22px;margin:16px 0;color:#3c4043">Trân trọng,</p>
                          <p style="font-size:16px;line-height:22px;margin:16px 0px 0px 0px;color:#3c4043">TIMESHARE</p>
                      </td>
                  </tr>
              </tbody>
          </table>
  
          <table style="padding:0 40px" align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation"
              width="100%">
              <tbody>
                  <tr>
                      <td>
                          <hr
                              style="width:100%;border:none;border-top:1px solid black;border-color:black;margin:20px 0" />
  
                          <div style="display: flex; justify-content: center; align-items: center; margin: 20px; gap: 6px;">
                              <a href="" aria-label="Find us on LinkedIn" target="_blank" rel="noopener">
                                  <svg style="height: 20px; width: 20px; color: black" viewBox="0 0 48 48" fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                          d="M44.45 0H3.55A3.5 3.5 0 0 0 0 3.46v41.07A3.5 3.5 0 0 0 3.54 48h40.9A3.51 3.51 0 0 0 48 44.54V3.46A3.5 3.5 0 0 0 44.45 0Zm-30.2 40.9H7.11V18h7.12v22.9Zm-3.57-26.03a4.13 4.13 0 1 1-.02-8.26 4.13 4.13 0 0 1 .02 8.26ZM40.9 40.9H33.8V29.77c0-2.66-.05-6.08-3.7-6.08-3.7 0-4.27 2.9-4.27 5.89V40.9h-7.1V18h6.82v3.12h.1c.94-1.8 3.26-3.7 6.72-3.7 7.21 0 8.54 4.74 8.54 10.91V40.9Z"
                                          fill="currentColor"></path>
                                  </svg>
                              </a>
                              <a href="" aria-label="Find us on Twitter" target="_blank" rel="noopener">
                                  <svg style="height: 20px; width: 20px; color: black" viewBox="0 0 48 40" fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                          d="M15.1 39.5c18.1 0 28.02-15 28.02-28.02 0-.42-.01-.85-.03-1.27A20 20 0 0 0 48 5.1c-1.8.8-3.7 1.32-5.65 1.55a9.9 9.9 0 0 0 4.33-5.45 19.8 19.8 0 0 1-6.25 2.4 9.86 9.86 0 0 0-16.8 8.97A27.97 27.97 0 0 1 3.36 2.3a9.86 9.86 0 0 0 3.04 13.14 9.86 9.86 0 0 1-4.46-1.23v.12A9.84 9.84 0 0 0 9.83 24c-1.45.4-2.97.45-4.44.17a9.87 9.87 0 0 0 9.2 6.84A19.75 19.75 0 0 1 0 35.08c4.5 2.89 9.75 4.42 15.1 4.42Z"
                                          fill="currentColor"></path>
                                  </svg>
                              </a>
                              <a href="" aria-label="Find us on Facebook" target="_blank" rel="noopener">
                                  <svg style="height: 20px; width: 20px; color: black" viewBox="0 0 48 48" fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                          d="M48 24a24 24 0 1 0-27.75 23.7V30.95h-6.1V24h6.1v-5.29c0-6.01 3.58-9.34 9.07-9.34 2.62 0 5.37.47 5.37.47v5.91h-3.03c-2.98 0-3.91 1.85-3.91 3.75V24h6.66l-1.07 6.94h-5.59V47.7A24 24 0 0 0 48 24Z"
                                          fill="currentColor"></path>
                                  </svg>
                              </a>
                              <a href="" aria-label="Find us on Instagram" target="_blank" rel="noopener">
                                  <svg style="height: 20px; width: 20px; color: black" viewBox="0 0 48 48" fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                          d="M24 4.32c6.41 0 7.17.03 9.7.14 2.34.1 3.6.5 4.45.83 1.11.43 1.92.95 2.75 1.79a7.38 7.38 0 0 1 1.8 2.75c.32.85.72 2.12.82 4.46.11 2.53.14 3.29.14 9.7 0 6.4-.03 7.16-.14 9.68-.1 2.35-.5 3.61-.83 4.46a7.42 7.42 0 0 1-1.79 2.75 7.38 7.38 0 0 1-2.75 1.8c-.85.32-2.12.72-4.46.82-2.53.11-3.29.14-9.69.14-6.41 0-7.17-.03-9.7-.14-2.34-.1-3.6-.5-4.45-.83a7.42 7.42 0 0 1-2.75-1.79 7.38 7.38 0 0 1-1.8-2.75 13.2 13.2 0 0 1-.82-4.46c-.11-2.53-.14-3.29-.14-9.69 0-6.41.03-7.17.14-9.7.1-2.34.5-3.6.83-4.45A7.42 7.42 0 0 1 7.1 7.08a7.38 7.38 0 0 1 2.75-1.8 13.2 13.2 0 0 1 4.46-.82c2.52-.11 3.28-.14 9.69-.14ZM24 0c-6.52 0-7.33.03-9.9.14-2.54.11-4.3.53-5.81 1.12a11.71 11.71 0 0 0-4.26 2.77 11.76 11.76 0 0 0-2.77 4.25C.66 9.8.26 11.55.14 14.1A176.6 176.6 0 0 0 0 24c0 6.52.03 7.33.14 9.9.11 2.54.53 4.3 1.12 5.81a11.71 11.71 0 0 0 2.77 4.26 11.73 11.73 0 0 0 4.25 2.76c1.53.6 3.27 1 5.82 1.12 2.56.11 3.38.14 9.9.14 6.5 0 7.32-.03 9.88-.14 2.55-.11 4.3-.52 5.82-1.12 1.58-.6 2.92-1.43 4.25-2.76a11.73 11.73 0 0 0 2.77-4.25c.59-1.53 1-3.27 1.11-5.82.11-2.56.14-3.38.14-9.9 0-6.5-.03-7.32-.14-9.88-.11-2.55-.52-4.3-1.11-5.82-.6-1.6-1.41-2.94-2.75-4.27a11.73 11.73 0 0 0-4.25-2.76C38.2.67 36.45.27 33.9.15 31.33.03 30.52 0 24 0Z"
                                          fill="currentColor"></path>
                                      <path
                                          d="M24 11.67a12.33 12.33 0 1 0 0 24.66 12.33 12.33 0 0 0 0-24.66ZM24 32a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM39.7 11.18a2.88 2.88 0 1 1-5.76 0 2.88 2.88 0 0 1 5.75 0Z"
                                          fill="currentColor"></path>
                                  </svg>
                              </a>
                          </div>
  
                          <div class="business-card">
                              <div class="card-body">
                                  <div class="contact-info">
                                      <p style="margin: 0px; font-size: 12px;"><i>Địa chỉ:</i> Lô E2a-7, Đường D1, Khu
                                          Công nghệ cao, P.Long Thạnh Mỹ, Tp. Thủ Đức, TP.HCM.</p>
                                      <p style="margin: 0px; font-size: 12px;"><i>Website:</i>
                                          <a href="https://timeshare-client.vercel.app/"
                                              target="_blank">https://timeshare-client.vercel.app/</a>
                                      </p>
                                      <p style="margin: 0px; font-size: 12px;"><i>Số điện thoại:</i> 0123456789</p>
                                  </div>
                              </div>
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </body>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });

    res.status(200).json("Reset password successfully");
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const sortAccountByCreatedAt = asyncHandler(async (req, res) => {
  try {
    await User.find()
      .sort({ createdAt: -1 })
      .exec((err, users) => {
        if (err) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi truy xuất tất cả tài khoản theo ngày tạo"
          );
        }

        res.status(200).json(users);
      });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const statisticsAccountByStatus = asyncHandler(async (req, res) => {
  try {
    let accounts = await User.find().populate("role_id");
    if (!accounts || accounts.length === 0) {
      return null;
    }
    accounts = accounts.filter(
      (account) => account.role_id.roleName !== RoleEnum.ADMIN
    );
    const tmpCountData = {
      Active: 0,
      InActive: 0,
    };

    accounts.forEach((account) => {
      if (account.status) {
        tmpCountData["Active"] = tmpCountData["Active"] + 1;
      } else {
        tmpCountData["InActive"] = tmpCountData["InActive"] + 1;
      }
    });

    const result = Object.keys(tmpCountData).map((key) => ({
      key,
      value: tmpCountData[key],
    }));
    res.status(200).json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const searchAccountByEmail = asyncHandler(async (req, res, next) => {
  try {
    const searchEmail = req.query.searchEmail;
    if (!searchEmail || searchEmail === undefined) {
      res.status(400);
      throw new Error("Không được để trống thông tin yêu cầu");
    }
    let users = await User.find({
      email: { $regex: searchEmail, $options: "i" },
    }).populate("role_id");
    if (!users) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tìm kiếm tài khoản theo email");
    }
    users = users.filter((user) => user.role_id.roleName !== RoleEnum.ADMIN);
    // Send the results as a JSON response to the client
    res.json(users);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const banAccountByAdmin = asyncHandler(async (req, res, next) => {
  try {
    const { account_id } = req.params;
    const user = await User.findById(account_id).populate("role_id").exec();
    if (!user) {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản!");
    }
    if (user.role_id.roleName === RoleEnum.ADMIN) {
      res.status(400);
      throw new Error("Không thể khóa tài khoản admin");
    }
    user.status = false;
    const result = await user.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi khóa tài khoản");
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(res.statusCode).send(error.message || "Internal Server Error");
  }
});

module.exports = {
  registerUser,
  registerStaff,
  getUsers,
  getInvestors,
  getStaffs,
  getUserById,
  updateUsers,
  deleteUsers,
  currentUser,
  checkOldPassword,
  changePassword,
  forgotPassword,
  resetPassword,
  sendOTPWhenRegister,
  verifyOTPWhenRegister,
  sortAccountByCreatedAt,
  statisticsAccountByStatus,
  searchAccountByEmail,
  banAccountByAdmin,
};
