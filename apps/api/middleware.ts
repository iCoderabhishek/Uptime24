import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res:Response, next: NextFunction) {
    //auth logic here...
    const authHeaders = req.headers["authorization"];

    req.userId = "1"
    next();
    //jwt.verify logic here...

}