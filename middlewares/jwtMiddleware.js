import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {

    // CHANGE: read token from HTTP-only cookie
    const token = req.cookies?.token; // name must match cookie name

    if (!token)
        return res.status(401).json({ error: "Not authenticated (no token)" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // attach user payload

        console.log("[DEBUG] Token verified from cookie");
        console.log("[DEBUG] User:", decoded);

        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}