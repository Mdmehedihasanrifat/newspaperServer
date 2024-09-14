import { supportedImageMimes } from "../config/filesystem.js"
import { v4 } from "uuid"
import fs from "fs"
export const imageValidator=(size,mime)=>{

    if(bytesToMb(size)>2){
        return "image must be less than 2Mb"
    }
    else if(!supportedImageMimes.includes(mime)){
        return "Image type should be img,jpg,png ..."
    }

    return null;

}


export const bytesToMb=(bytes)=>{

return bytes/(1024*1024)

}

export const generateRandom=()=>{
    return v4();
}
export const getImageUrl=(imgName)=>{


    return `${process.env.APP_URL}news/${imgName}`


}

export const removeImage=(imgName)=>{

const path=process.cwd()+"public/news/"+imgName;
if(fs.existsSync(path)){
    fs.unlinkSync(path);
}

}