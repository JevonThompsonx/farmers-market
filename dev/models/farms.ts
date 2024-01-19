import mongoose, { Schema, model } from "mongoose";
import { unsplash } from "../utils/index.js";
import Joi from "joi";
const ObjectId = Schema.Types.ObjectId,
	farmLocationSchema = new Schema({
		city: {
			type: String,
		},
		state: {
			type: String,
		},
	}),
	farmSchema = new Schema({
		name: {
			type: String,
			required: [true, "Cannot create a nameless farm"],
		},
		location: farmLocationSchema,
		description: {
			type: String,
			default: " ",
			required: false,
		},
		email: {
			type: String,
			required: [
				true,
				"Cannot create a farm w/o an email. Please complete account set up",
			],
		},
		imageLink: {
			type: [String, "Image requires a valid image source"],
		},
		products: [
			{
				type: ObjectId,
				ref: "products",
			},
		],
		created: {
			type: Date,
			default: new Date(),
			required: false,
		},
		updated: {
			type: Date,
			required: false,
		},
	}),
	joiFarmSchema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string(),
		location: Joi.object({
			city: Joi.string(),
			state: Joi.string(),
		}),
		email: Joi.string().required(),
		farm: Joi.string().required(),
	});

farmSchema.pre("save", async function (next) {
	this.updated = new Date();
	const newImageLink = await unsplash();
	if (!this.imageLink || this.imageLink != newImageLink) {
		this.imageLink = newImageLink;
	}
	next();
});

const farm = model("farm", farmSchema);
export { farmSchema, farm, joiFarmSchema };
