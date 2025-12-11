import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, getUserPasswordFromEmail, createUser, getUserInfoFromEmail } from "../databases/userDatabase.js";

// password check function
function isStrongPassword(password) {
	const hasUpper = /[A-Z]/.test(password);
	const hasLower = /[a-z]/.test(password);
	const hasDigit = /[0-9]/.test(password);
	const length = password.length;

	console.log("Password:", password);
	console.log("Has upper?", /[A-Z]/.test(password));
	console.log("Has lower?", /[a-z]/.test(password));
	console.log("Has digit?", /[0-9]/.test(password));
	console.log("Length:", password.length);


	if (length < 8) return false;

	return hasUpper && hasLower && hasDigit;
}

// signup
export async function signupService(name, email, entered_password, role, timeZone) {

	const password = entered_password.trim();
	if (!isStrongPassword(password))
		throw new Error("Password must contain at least 1 uppercase, 1 lowercase letter, 1 digit with minimum length of 8 characters.");

	const exists = await findUserByEmail(email);
	if (exists) throw new Error("Email already registered");

	const hashed_password = await bcrypt.hash(password, 10);

	const isCreated = await createUser(name, email, hashed_password, role, timeZone);
	if (!isCreated) throw new Error("Could not add user to database");
	
	const userInfo = await getUserInfoFromEmail(email);
	
	// Create JWT token
	const token = jwt.sign(
		{
			id: userInfo.id,
			name: userInfo.name,
			email: userInfo.email,
			role: userInfo.role,
			time_zone: userInfo.time_zone // 🟥 add this
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	console.log("Token info :");
	console.log(jwt.decode(token));
	
	//returns userinfo, message and token
	return {
		message: "Signup successful",
		token,
		user: {
			id: userInfo.id,
			name: userInfo.name,
			email: userInfo.email,
			role: userInfo.role,
			time_zone: userInfo.time_zone
		}
	};
}

// login
export async function loginService(email, password) {
	// 1️⃣ Check if user exists
	const exists = await findUserByEmail(email);
	if (!exists) throw new Error("User not found");
	
	// 2️⃣ Get hashed password
	const hashedPassword = await getUserPasswordFromEmail(email);
	
	// 3️⃣ Compare password
	const match = await bcrypt.compare(password, hashedPassword);
	if (!match) throw new Error("Invalid credentials");
	
	// 4️⃣ Get full user info
	const userInfo = await getUserInfoFromEmail(email);
	
	// 5️⃣ Allow login for pending instructors
	// They will see the pending upload form on frontend
	if (userInfo.role === "instructor" && userInfo.status === "rejected") {
		throw new Error("Your instructor account has been rejected.");
	}
	
	// 6️⃣ Create JWT token
	const token = jwt.sign(
		{
			id: userInfo.id,
			email: userInfo.email,
			role: userInfo.role,
			status: userInfo.status, // include status for frontend decision
			time_zone: userInfo.time_zone 
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);
	
	console.log("Token info :");
	console.log(jwt.decode(token));
	
	// 7️⃣ Return user info + token
	return {
		message: "Login successful",
		token,
		id: userInfo.id,
		name: userInfo.name,
		email: userInfo.email,
		role: userInfo.role,
		status: userInfo.status,
		time_zone: userInfo.time_zone
	};
}
