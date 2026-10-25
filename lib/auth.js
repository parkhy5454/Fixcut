
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const SECRET=process.env.JWT_SECRET||'fixcut-secret-key-change';
export async function hashPassword(pw){return await bcrypt.hash(pw,10);}
export async function verifyPassword(pw,hash){return await bcrypt.compare(pw,hash);}
export function signToken(payload){return jwt.sign(payload,SECRET,{expiresIn:'30d'});}
export function verifyToken(token){try{return jwt.verify(token,SECRET);}catch(e){return null;}}
