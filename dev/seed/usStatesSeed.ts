import AllUsStatesData from "./seedData/allUsStatesData.js";
import mongoose from "mongoose";
import { usLocationSchema, usLocation } from "../models/index.js";

import seedConnectionString from "./utils/seedConnectionString.js";

for (const singleUsState of AllUsStatesData) {
	const newState = new usLocation({
		name: singleUsState,
	});
	await newState.save();
}

console.log("Done");
