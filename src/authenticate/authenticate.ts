import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userModel } from "../postgres/postgres";
import { User } from "../postgres/model/userModel"; // Adjust to your user model path

interface AuthenticatedRequest extends Request {
  user?: User; // Replace with your specific user type
}

// Utility function to verify the JWT token and return a promise
const verifyToken = (token: string, secret: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded as JwtPayload);
    });
  });
};

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader === 'null') {
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }

  try {
    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    if (typeof decoded === 'object' && 'email' in decoded) {
      const user = await userModel.findOne({
        where: { email: (decoded as JwtPayload).email },
      });

      if (!user) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }
};

export default authMiddleware;
