import mongoose, { connect } from "mongoose";
import "dotenv/config";
import { configDotenv } from "dotenv";
configDotenv({ path: "../../.env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error("MONGODB_URI environment variable is not set");
}

export default async () => {
	return await connect(MONGODB_URI, { dbName: "expressConnect" })
		.then(() => {
			console.log("Connection successful");
		})
		.catch((err) => {
			console.log(`Connection error: ${err}`);
		});
};
