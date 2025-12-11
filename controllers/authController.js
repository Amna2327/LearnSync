import { loginService, signupService } from "../services/authService.js";

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        console.log("noice login");
        return res.status(200).json(result);
    } catch (err) {
        console.log("error in login");
        return res.status(400).json({ error: err.message });
    }
}

export async function signup(req, res) {
    try {
        const { name, email, password, role, timeZone } = req.body;

        const result = await signupService(name, email, password, role, timeZone);
        console.log("noice signup");
        return res.status(200).json(result);
    } catch (err) {
        console.log("error in signup");
        return res.status(400).json({ error: err.message });
    }
}

