import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express, {response} from "express";
import cors from "cors";
import bodyParser from "body-parser";

import bcrypt from 'bcrypt';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(bodyParser.json());

// email validation function
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// password length function
function checkPasswordLength(password) {
	const minLen = 8;
	return password.length >= minLen;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, 'data.json');

async function checkDuplicacy({ username, userEmail }) {
	try {
		const data = await readFile(dataFile, 'utf-8');
		const users = JSON.parse(data);

		const userExists = users.some(user =>
			user.username === username || user.userEmail === userEmail
		);

		return !userExists;
	} catch (err) {
		console.error('error reding users file:', err);
		return false;
	}
}

async function writeData({ username, userEmail, hashedPassword }) {
	try {
		const data = await readFile(dataFile, 'utf-8');
		const users = JSON.parse(data);

		users.push({ username, userEmail, password: hashedPassword });

		await writeFile(dataFile, JSON.stringify(users, null, 2), 'utf-8');
	} catch (err) {
		console.error('Error writing to users file:', err);
	}
}

app.post('/signup', async (request, response) => {
	console.log(" i was called")
	// For password hashing
	const saltRounds = 10;

	// extracting  the fields 
	const { username, userEmail, password } = request.body; 

	// verify the email
	if (!validateEmail(userEmail)) {
		return response.send({
			message: "Enter a valid email"
		})
	}

	// check the password length
	if (!checkPasswordLength(password))	 {
		return response.send({
			message: "Password is too short"
		})
	}

	// check for duplicacy
	if (! await checkDuplicacy({username, userEmail})) {
		return response.send({
			message: "Record already exist"
		})
	}

	// Hashing the password 
	bcrypt.hash(password, saltRounds).then((hashedPassword) => {
		// write/adding record on json file
		writeData({username, userEmail, hashedPassword});
		response.status(201).send({
			message: "Record added successsfully"
		})
	})	

});


app.listen(5000, () => {
	console.log('server started on port', 5000);
});
