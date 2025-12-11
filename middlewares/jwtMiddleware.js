import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        return res.status(401).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("[DEBUG] Signed-in user info:", decoded); // 🔴 check if time_zone exists
        
        // Debug: which role?
        console.log("[DEBUG] Signed-in user role:", decoded.role);

        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
}