import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {findUserByEmail, getUserPasswordFromEmail, createUser, getUserInfoFromEmail} from "../databases/userDatabase.js";

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
export async function signupService(name, email, entered_password) {

	const password = entered_password.trim();
	if (!isStrongPassword(password))
		throw new Error("Password must contain at least 1 uppercase, 1 lowercase letter, 1 digit with minimum length of 8 characters.");
	
	const exists = await findUserByEmail(email);
	if (exists) throw new Error("Email already registered");

	const hashed_password = await bcrypt.hash(password, 10);

	const isCreated = await createUser(name, email, hashed_password);
	if (!isCreated) throw new Error("Could not add user to database");

	const userInfo = await getUserInfoFromEmail(email);

		// Create JWT token
	const token = jwt.sign(
		{
		id: userInfo.id,
		email: userInfo.email,
		role: userInfo.role
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	//returns userinfo, message and token
	return {
		message: "Signup successful",
		token,
		user: {
		id: userInfo.id,
		name: userInfo.name,
		email: userInfo.email,
		role: userInfo.role,
		timeZone: userInfo.timeZone
		}
	};
}

// login
export async function loginService(email, password) {
	const exists = await findUserByEmail(email);
	if (!exists) throw new Error("User not found");

	const hashedPassword = await getUserPasswordFromEmail(email);

	const match = await bcrypt.compare(password, hashedPassword);
	
	if (!match) throw new Error("Invalid credentials");

	const userInfo = await getUserInfoFromEmail(email);

	// Create JWT token
	const token = jwt.sign(
		{
		id: userInfo.id,
		email: userInfo.email,
		role: userInfo.role
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	return {
		message: "Login successful",
		token,         // return the token to frontend
		id: userInfo.id,
		name: userInfo.name,
		email: userInfo.email,
		role: userInfo.role,
		timeZone: userInfo.timeZone
	};
}
