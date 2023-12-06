import mongoose, { Schema, model } from "mongoose";
import getBing from "../seed/getBing.js";
import Joi from "joi";

const farmSchema = new Schema({
		name: {
			type: String,
			required: true,
			lowercase: true,
		},
	}),
	joiFarmSchema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string()
	});
const farm = model("farm", farmSchema);
export { farmSchema, farm, joiFarmSchema };
