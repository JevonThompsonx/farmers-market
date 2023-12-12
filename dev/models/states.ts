import mongoose, { model, Schema } from "mongoose";
import allUsStateData from "../seed/seedData/allUsStatesData.js";
const stateModel = new Schema({
		name: {
			type: String,
			required: [true, "State required"],
		},
	}),
	areaCodeModel = new Schema({
		areaCode: {
			type: Number,
			require: [true, "Area code required"],
		},
	}),
	cityModel = new Schema({
		name: {
			type: String,
			required: [true, "State required"],
		},
	}),
	usLocationSchema = new Schema({
		states: [stateModel],
		areaCodes: [areaCodeModel],
		city: [cityModel],
	}),
	usLocation = model("usLocation", usLocationSchema);

export { usLocation, usLocationSchema };
