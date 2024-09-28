import { Request, Response, NextFunction } from 'express';
import { visitorModel } from '../postgres/postgres';

export const trackVisitor = async (req: Request, res: Response, next: Function) => {
    const ip = req.ip || req.socket.remoteAddress || '';
  
    try {
      const [visitor] = await visitorModel.findOrCreate({
        where: { ip },
        defaults: { ip }
      });
  
      // Attach the visitor to the request object
      (req as any).visitor = visitor;
      next();
    } catch (error) {
      console.error('Error tracking visitor:', error);
      next(error);
    }
  };