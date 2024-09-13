import bcrypt from "bcrypt";
import { userModel } from "../postgres/postgres.js";
import vine from "@vinejs/vine";
import { userRegistrationValidate } from "../validation/userValidation.js";
export const register = async (req, res) => {
    try {
      const salt = bcrypt.genSaltSync(10);
  
      const body = req.body;
      console.log(body)
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
  