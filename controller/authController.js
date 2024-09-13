import bcrypt from "bcrypt";
import { userModel } from "../postgres/postgres.js";
import vine from "@vinejs/vine";
import { userLoginValidate, userRegistrationValidate } from "../validation/userValidation.js";
import jwt from "jsonwebtoken";
export const register = async (req, res) => {
    try {
      const salt = bcrypt.genSaltSync(10);
  
      const body = req.body;
    //   console.log(body)
      const validator = vine.compile(userRegistrationValidate);
      const payload = await validator.validate(body);
  
      // Check if the user already exists
      const findUser = await userModel.findOne({
        where: {
          email: payload.email,
        },
      });
  
      if (findUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
  
      // Hash the password and create the user
      payload.password = bcrypt.hashSync(payload.password, salt);
      const user = await userModel.create(payload);
  
      // Respond with success
      return res.status(201).json({ status: 201, message: "User successfully created", user });
    } catch (error) {
      // Handle validation errors and other issues
      return res.status(400).json({ status: 400, error: error.message });
    }
  };
  
  export const login = async (req, res) => {
    try {
      const body = req.body;
      
      // Validate the request body using Vine
      const validator = vine.compile(userLoginValidate);
      const payload = await validator.validate(body);
  
      // Find the user in the database by email
      const findUser = await userModel.findOne({
        where: { email: payload.email },
      });
  
      if (!findUser) {
        // If no user is found, return 404 Not Found
        return res.status(404).json({ status: 404, message: "No user found" });
      }
  
      // Check if the password matches
      const passwordMatch = bcrypt.compareSync(payload.password, findUser.password);
      if (!passwordMatch) {
        // If password does not match, return 401 Unauthorized
        return res.status(401).json({ status: 401, message: "Invalid password" });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { email: findUser.email }, // Include relevant payload data
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
  
      // Return 200 OK with the access token and user info
      return res.status(200).json({
        status: 200,
        message: "Login successful",
        access_token: `Bearer ${token}`,
        user: {
          email: findUser.email,
          name: findUser.firstName, // Adjust based on your database schema
        },
      });
    } catch (error) {
      // Handle any unexpected errors and return 500 Internal Server Error
      return res.status(500).json({ status: 500, message: error.message });
    }
  };
  