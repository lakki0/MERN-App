import UserModel from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ENV from "../config.js";
import otpGenerator from "otp-generator";

export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method == "GET" ? req.query : req.body;

    let exist = await UserModel.findOne({ username });
    if (!exist) return res.status(404).send({ error: "Can't find User!" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

//----------- Register ---------
export async function register(req, res) {
  try {
    const { username, password, profile, email } = req.body;

    const existUsername = new Promise(async (resolve, reject) => {
      const user = await UserModel.findOne({ username });
      if (user) {
        reject({ error: "Please use unique username" });
      }
      resolve();
    });

    const existEmail = new Promise(async (resolve, reject) => {
      const isExistingEmail = await UserModel.findOne({ email });
      if (isExistingEmail) {
        reject({ error: "Please use unique email" });
      }
      resolve();
    });

    Promise.all([existUsername, existEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const user = new UserModel({
                username,
                password: hashedPassword,
                profile: profile || "",
                email,
              });

              user
                .save()
                .then(() =>
                  res.status(201).send({ msg: "User Register Successfully" })
                )
                .catch((err) => res.status(500).send({ err }));
            })
            .catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed Password",
              });
            });
        }
      })
      .catch((e) => {
        console.log(e);
        return res.status(500).send(e);
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
}

//----------- Login -------------
export async function login(req, res) {
  const { username, password } = req.body;
  //   const user = await UserModel.findOne({username:username});
  //     console.log(user);
  try {
    await UserModel.findOne({ username: username })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck) {
              return res.status(400).send({ err: "Don't have Password" });
            }
            const token = jwt.sign(
              {
                userId: user._id,
                username: user.username,
              },
              ENV.JWT_secret,
              { expiresIn: "12h" }
            );
            return res.status(200).send({
              msg: "Login Successful...!",
              username: user.username,
              token,
            });
          })
          .catch((err) => {
            return res.status(400).send({ err: "Password does not Match" });
          });
      })
      .catch((error) => {
        return res.status(400).send({ error: "Username not found" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
}

//----------- Get user ------------
export async function getUser(req, res) {
  const { username } = req.params;
  //   console.log(req.params);
  try {
    if (!username) return res.status(501).send({ error: "Invalid Username" });
    const user = await UserModel.findOne({ username: username });
    if (!user) return res.status(500).send({ error: "Couldn't find the User" });
    // console.log(user);
    const { password, ...rest } = Object.assign({}, user.toJSON());
    return res.status(200).send(rest);
  } catch (error) {
    return res.status(404).send({ error: "Cannot Find User Data" });
  }
}

//------------ Update user ------------
export async function updateUser(req, res) {
  try {
    const id = req.query.id;
    if (id) {
      const body = req.body;

      await UserModel.updateOne({ _id: id }, body)
        .then(() => {
          return res
            .status(201)
            .send({ msg: "User Data Updated Successfully...!" });
        })
        .catch((error) => {
          return res.status(400).send({ error: "User Data not updated" });
        });
    } else {
      return res.status(401).send({ err: "User not found...!" });
    }
  } catch (error) {
    return res.status(404).send({ error });
  }
}

//-------- generate OTP --------------
export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
}

//------------- verify OTP -------------
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null;
    req.app.locals.resetSession = true;
    return res.status(201).send({ msg: "Verify Successful...!" });
  }
  return res.status(400).send({ error: "Invalid OTP" });
}

//------------- reset password -----------
export async function resetPassword(req, res) {
  try {
    if(!req.app.locals.resetSession) return res.status(440).send({error:"Session expired!"});
    const { username, password } = req.body;
    try {
      UserModel.findOne({ username: username })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const passUpdate = UserModel.updateOne(
                { username: user.username },
                { password: hashedPassword }
              );
              if (!passUpdate) throw Error;
              return res.status(201).send({ msg: "Record Updated...!" });
            })
            .catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not Found" });
        });
    } catch (error) {
      return res.status(500).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    req.app.locals.resetSession = false;
    return res.status(201).send({ msg: "access granted!" });
  }
  return res.status(404).send({ error: "Session expired!" });
}
