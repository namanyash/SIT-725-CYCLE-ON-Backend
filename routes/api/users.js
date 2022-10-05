const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");
// MongoDB Password Reset Model
const PasswordReset = require("../../models/PasswordReset");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config();

// create a Gmail transporter to allow app to send emails
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});
transporter.verify((err, succ) => {
  if (err) {
    console.log(err);
  } else {
    console.log("EMAIL READY!");
  }
});

// @route       POST /api/users/register
// @desc        Register new users with the app
// @access      Public
// @parameters  firstName(String), lastName(String), email(String), password(String), username(String), phoneNumber(Number)
router.post(
  "/register",
  [
    // validations
    check("firstName", "Frist name is required").not().isEmpty(),
    check("lastName", "Frist name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
    check(
      "username",
      "Please enter a username with 4 or more characters"
    ).isLength({ min: 4 }),
    check("phoneNumber", "Please enter a phone number with 10 digits").isLength(
      10
    ),
    check("phoneNumber", "Please enter a phone number with 10 digits").isLength(
      { max: 10 }
    ),
    check("phoneNumber", "Phone Number can only be digits").isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { firstName, lastName, email, password, username, phoneNumber } =
      req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email already registered" }] });
      }

      user = await User.findOne({ phoneNumber });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Phone Number already registered" }] });
      }

      user = await User.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Username already exists" }] });
      }

      user = new User({
        firstName,
        lastName,
        email,
        password,
        username,
        phoneNumber,
        balance: 0,
        activeRide: {},
        rideHistory: [],
      });

      // encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // create payload for jwt token
      const payload = {
        user: {
          id: user.id,
        },
      };

      // create and return a jwt token
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      // catch and log errors in console. Send 500 response
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       POST /api/users/loginUP
// @desc        Login users to the app using username and password
// @access      Public
// @parameters  username(String), password(String)
router.post(
  "/loginUP",
  [
    // validations
    check(
      "password",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
    check(
      "username",
      "Please enter a username with 4 or more characters"
    ).isLength({ min: 4 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { password, username } = req.body;

    try {
      let user = await User.findOne({ username });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // create payload for jwt token
      const payload = {
        user: {
          id: user.id,
        },
      };

      // create and return a jwt token
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      // catch and log errors in console. Send 500 response
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       DELETE /api/users/deleteUser
// @desc        Login users to the app using username and password
// @access      Private
// @parameters  username(String), password(String)
router.delete(
  "/deleteUser",
  [
    // validations
    check(
      "password",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
    check(
      "username",
      "Please enter a username with 4 or more characters"
    ).isLength({ min: 4 }),
    auth,
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { password, username } = req.body;

    try {
      let user = await User.findOne({ username });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      await User.deleteMany({ username: username });
      return res.status(500).send({ msg: `User ${username} deleted` });
    } catch (err) {
      // catch and log errors in console. Send 500 response
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       GET /api/users/getUser
// @desc        Get information of a user
// @access      Private
// @parameters
router.get("/getUser", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.send(user);
});

// @route       PUT /api/users/addBalance
// @desc        add Balance to user
// @access      Private
// @parameters  valueToAdd(Number)
router.put(
  "/addBalance",
  [
    // validations
    check("valueToAdd", "No Value Provided").not().isEmpty(),
    check("valueToAdd", "Value can only be a positive integer").isInt({
      min: 0,
    }),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { valueToAdd } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $inc: { balance: valueToAdd } },
      { new: true }
    ).select("-password -rideHistory -activeRide");
    res.send(user);
  }
);

// @route       PUT /api/users/withdrawBalance
// @desc        withdraw Balance to user
// @access      Private
// @parameters  valueToAdd(Number)
router.put(
  "/withdrawBalance",
  [
    // validations
    check("valueToSubtract", "No Value Provided").not().isEmpty(),
    check("valueToSubtract", "Value can only be a positive integer").isInt({
      min: 0,
    }),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { valueToSubtract } = req.body;
    let user = await User.findById(req.user.id).select("balance");
    if (user.balance < valueToSubtract) {
      return res
        .status(400)
        .json({ errors: [{ msg: `Insufficient Funds: \$${user.balance}` }] });
    }
    user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $inc: { balance: -valueToSubtract.toFixed(2) } },
      { new: true }
    ).select("-password -rideHistory -activeRide");
    res.send(user);
  }
);

// @route       POST /api/users/requestPasswordReset
// @desc        Request Password Reset
// @access      Public
// @parameters  email(String) redirectUrl(String)
router.post(
  "/requestPasswordReset",
  [
    // validations
    check("redirectUrl", "Redirect URL Empty").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { redirectUrl, email } = req.body;

    try {
      let user = await User.findOne({ email }).select("-password");
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email not registered" }] });
      }
      // create a random string for email
      const resetString = uuidv4() + user._id;
      // delete existing password request for this user, if any
      await PasswordReset.deleteMany({ userId: user._id });
      // create an email
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Cycle-on Password Reset",
        html: `<p>So what you lost your password.</p><p>Here is a link for you to reset your password. Expires in 1 hour.</p></br><p>Click <a href=${
          redirectUrl + "user/verify/" + user._id + "/" + resetString
        }>here</a> to proceed.</p>`,
      };
      // encrypt the password reset string
      const salt = await bcrypt.genSalt(10);
      const encryptedResetString = await bcrypt.hash(resetString, salt);
      // new password reset request
      const newPasswordReset = new PasswordReset({
        userId: user._id,
        username: user.username,
        resetString: encryptedResetString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      // save request
      newPasswordReset.save();
      // send email
      const mail = transporter.sendMail(mailOptions);
      return res.json({ msg: "Password Reset Email Sent" });
    } catch (err) {
      // catch and log errors in console. Send 500 response
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       POST /api/users/resetPassword
// @desc        Password Reset
// @access      Public
// @parameters  userId(String) resetString(String) newPassword(String)
router.post(
  "/resetPassword",
  [
    // validations
    check("userId", "User Id Cannot be empty").not().isEmpty(),
    check("resetString", "Reset String Cannot Be Empty").not().isEmpty(),
    check(
      "newPassword",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { userId, resetString, newPassword } = req.body;
    try {
      let passwordReset = await PasswordReset.find({ userId });
      if (passwordReset.length == 0) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Password reset not requested." }] });
      }
      if (passwordReset.expiresAt < Date.now()) {
        await PasswordReset.deleteMany({ userId: userId });
        return res.status(400).json({
          errors: [
            {
              msg: "Password reset has expired. Please create a new request.",
            },
          ],
        });
      }
      const isMatch = await bcrypt.compare(
        resetString,
        passwordReset[0].resetString
      );
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Password reset string invalid" }] });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const user = await User.updateOne(
        { _id: userId },
        { password: hashedPassword }
      ).select("-password");
      await PasswordReset.deleteMany({ userId: userId });
      res.send({ msg: "Password Updated Successfully" });
    } catch (err) {
      // catch and log errors in console. Send 500 response
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
