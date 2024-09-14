import { Request, Response } from "express";
import { z } from "zod";
import { loginSchemaValidation, userSchemaValidation } from "../validation/userdataValidation";
import bcrypt from "bcrypt";
import { userModel } from "../postgres/postgres";
import jwt from "jsonwebtoken"

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const body = req.body;

    // Zod validation
    const result = userSchemaValidation.safeParse(body);

    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }

    const payload = result.data;

    // Check if user already exists
    const findUser = await userModel.findOne({
      where: {
        email: payload.email,
      },
    });

    if (findUser) {
      return res.status(400).json({ messages: "Email already exists" });
    }

    // Hash password and create user
    payload.password = bcrypt.hashSync(payload.password, salt);
    const user = await userModel.create(payload);

    return res.status(200).json({ status: 200, messages: "Successfully created user" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};


export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;
  
      // Zod validation
      const result = loginSchemaValidation.safeParse(body);
  
      if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
      }
  
      const payload = result.data;
  
      // Find the user in the database
      const findUser = await userModel.findOne({
        where: { email: payload.email },
      });
  
      if (findUser) {
        // Compare the password
        if (bcrypt.compareSync(payload.password, findUser.password)) {
          // Generate JWT token
          const token = jwt.sign(
            { email: payload.email }, // It's safer to include minimal info in the token payload
            process.env.JWT_SECRET as string, 
            { expiresIn: '30d' }
          );
  
          return res.json({
            status: 200,
            messages: "Login successfully",
            access_token: `Bearer ${token}`,
            user: {
              email: findUser.email,
              name: findUser.firstName, // Assuming `firstName` is a field in your database
            },
          });
        } else {
          return res.status(400).json({ messages: "Invalid password" });
        }
      } else {
        return res.status(400).json({ messages: "No user found" });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
