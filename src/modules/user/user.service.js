import User from "../../DB/models/user.model.js";
import { successResponse } from "../../utils/responses/success.response.js";
import {
  conflictException,
  notFoundException,
  unauthorizedException,
  badRequestException,
} from "../../utils/responses/error.response.js";
import { hash } from "../../utils/security/hashing/hash.js";
import { compare } from "../../utils/security/hashing/compare.js";
import { encrypt, decrypt } from "../../utils/security/encryption/encrypt.js";
import {
  generateToken,
  verifyToken,
} from "../../utils/security/token/token.js";
import {OAuth2Client} from "google-auth-library"
import { providerEnum } from "../../utils/enums/user.enum.js"
import joi from "joi"

export const signUpService = async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    gender,
    role,
    phone,
  } = req.body;
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    conflictException("User Already Exists");
  }
  const userCreated = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: await hash(password),
    gender,
    role,
    phone: await encrypt(phone),
  });

  successResponse({
    res,
    message: "User Created Successfully",
    data: userCreated,
  });
};

export const loginService = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    unauthorizedException("Invalid email or password");
  }

  if(user.provider > providerEnum.System){
    badRequestException("use social login")
  }

  const matchedPassword = await compare(password, user.password);

  if (!matchedPassword) {
    unauthorizedException("Invalid email or password");
  }

  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
    },
  );

  const refreshToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    },
  );

  successResponse({
    res,
    message: "User logged in Successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const profileService = async (req, res) => {
  successResponse({
    res,
    message: "Done",
    data: req.user,
  });
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.headers.authorization;
  let token = req.headers.authorization;
  if (!token.startsWith("Bearer")) {
    badRequestException("Invalid authentication method");
  }
  token = token.split(" ")[1];
  const tokenValidation = verifyToken(token, process.env.REFRESH_TOKEN);
  const user = await User.findById(tokenValidation._id);
  if (!user) {
    notFoundException("user not found");
  }

  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
    },
  );
  
  successResponse({
    res,
    data: accessToken,
  });
};

export const socialLogin = async (req, res) => {
  const { idToken } = req.body
  const client = new OAuth2Client()
  const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload()
  const { email, given_name: firstName, family_name: lastName } = payload
  let user = await User.findOne({ email })
  if (user){
    if(user.provider == providerEnum.System){
      badRequestException("use system login")
    }
  } else {
    user = await User.create({
    firstName,
    lastName,
    email,
    username: `${firstName} ${lastName}`,
    emailConfirmed: true,
    provider: providerEnum.Google,
  })};

  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
    },
  );

  const refreshToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    },
  );

  successResponse({
    res,
    message: "User logged in Successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};
