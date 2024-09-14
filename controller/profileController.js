import { messages } from "@vinejs/vine/defaults";
import { userModel } from "../postgres/postgres.js";
import { generateRandom, imageValidator } from "../utils/helper.js";


export const index=async(req,res)=>{
let user=req.user;

user= await userModel.findOne({
    where:{email:user.email}
})

return res.json({status:200,user:user});
}


export const update=async(req,res)=>{

    const {id}=req.params;
    const user=req.user;
    if(!req.files || Object.keys(req.files).length===0){
        return res.status(400).json({messages:"Profile image required"})
    }

    const profile=req.files.profile;

    const messages= await imageValidator(profile?.size,profile.mimetype);
    if(messages!==null){
        return res.status(400).json({messages:messages})

    }
    const imgExt= await profile.name.split(".")[1];
    const imageName=generateRandom()+"."+imgExt;
    const uploadPath=process.cwd()+"/public/images"+imageName;

    profile.mv(uploadPath,(err)=>{
        if(err) throw err;
    })
    await userModel.update(
        { profile: imageName },
        { where: { id: id } } 
      );
    return res.json({
        name:profile.name,
        size:profile.size,
        mime:profile.mime
    })
}