import  jwt  from "jsonwebtoken";
import ENV from "../config.js";

export default async function Auth(req,res,next){
    try {
        const token = req.headers.authorization.split(" ")[1];
        
        const decodeToken = await jwt.verify(token,ENV.JWT_secret);

        // req.user = decodeToken;
        res.json(decodeToken);
        // console.log(token);
    } catch (error) {
        res.status(401).send({error:"Authentication Failed...!"});
    }
} 

export function localVariables(req,res,next){
    req.app.locals = {
        OTP : null,
        resetSession : false
    }
    next();
}




