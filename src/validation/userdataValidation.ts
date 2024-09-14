import {z} from "zod";


// User registration validation schema with Zod
export const userSchemaValidation = z.object({
    firstName: z.string().min(1, "First name must have at least 1 character").max(100, "First name must not exceed 100 characters"),
    lastName: z.string().min(1, "Last name must have at least 1 character").max(100, "Last name must not exceed 100 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must have at least 8 characters").max(150, "Password must not exceed 150 characters"),
  });
  
  // User login validation schema with Zod
  export const loginSchemaValidation = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must have at least 8 characters").max(150, "Password must not exceed 150 characters"),
  });