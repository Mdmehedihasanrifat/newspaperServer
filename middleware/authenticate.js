import { messages } from '@vinejs/vine/defaults';
import jwt from 'jsonwebtoken'
import { userModel } from '../postgres/postgres.js';



const authMiddleware= (req,res,next)=>{

  const authHeader=req.headers.authorization;

  if(authHeader===undefined||authHeader==='null'){
    return res.json({status:401,messages:"UnAuthorized"})
  }

  const token=authHeader.split(" ")[1];

  jwt.verify(token,process.env.JWT_SECRET,async(err,user)=>{

    if(err){
        return res.json({status:401,messages:"UnAuthorized"})
    }
    user = await userModel.findOne({
      where: { email: user.email }
    });
    

    req.user=user;
    next();
  })

}
export default authMiddleware;