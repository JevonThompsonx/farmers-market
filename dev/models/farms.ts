import mongoose, { Schema, model } from "mongoose";
import getBing from "../seed/utils/getBing.js";
import Joi from "joi";
const ObjectId = Schema.Types.ObjectId 
, farmSchema = new Schema({
		name: {
			type: String,
			required: [true, "Cannot create a nameless farm"],
		},
		city: {
			type: String,
		},
		description: {
			type: String,
		},
		email: {
			type: String,
			required: [true, "Cannot create a farm w/o an email"],
		},
		products: [
			{
				type: ObjectId,
				ref: "products",
			},
		],
	}),
	joiFarmSchema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string(),
		city: Joi.string(),
		email: Joi.string().required(),
	});
const farm = model("farm", farmSchema);
export { farmSchema, farm, joiFarmSchema };
