const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const Admin = require("../../models/Admin");
const jwt = require("jsonwebtoken");
const config = require("config");
const adminAuth = require("../../middleware/adminAuth");

// @route       POST /api/admins/register
// @desc        Register new admins with the app
// @access      Private - only accessible to the existing admins
// @parameters  password(String), username(String), phoneNumber(Number), email(String)
router.post(
  "/register",
  [
    // validations
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
    check("phoneNumber", "Phone Number can only be digits").isInt(),
  ],
  adminAuth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Show error if validations failed
      return res.status(400).json({ errors: errors.array() });
    }
    // get required fields from request body
    const { email, password, username, phoneNumber } = req.body;

    try {
      let admin = await Admin.findOne({ email });
      if (admin) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email already registered" }] });
      }

      admin = await Admin.findOne({ phoneNumber });
      if (admin) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Phone Number already registered" }] });
      }

      admin = await Admin.findOne({ username });
      if (admin) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Username already exists" }] });
      }

      admin = new Admin({
        email,
        password,
        username,
        phoneNumber,
      });

      const salt = await bcrypt.genSalt(10);

      admin.password = await bcrypt.hash(password, salt);

      await admin.save();

      const payload = {
        admin: {
          id: admin.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecretAdmin"),
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

// @route       POST /api/admins/login
// @desc        Login admins to the app using username and password
// @access      Public
// @parameters  username(String), password(String)
router.post(
  "/login",
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
      let admin = await Admin.findOne({ username });
      if (!admin) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const payload = {
        admin: {
          id: admin.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecretAdmin"),
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

// @route       GET /api/admins/getAdmin
// @desc        Get information of an admin
// @access      Private
// @parameters
router.get("/getAdmin", adminAuth, async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select("-password");
  res.send(admin);
});

module.exports = router;
