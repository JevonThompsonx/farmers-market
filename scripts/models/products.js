import mongoose, { Schema } from "mongoose";
import getBing from "../seed/getBing.js";
import Joi from "joi";
const groceryProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    size: {
        type: Number,
        required: false,
        default: 1,
    },
    unit: {
        type: String,
        required: true,
        enum: ["oz", "fl oz", "lbs", "item"],
        lowercase: true,
    },
    qty: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
    },
    category: {
        type: String,
        required: true,
        enum: ["fruit", "vegetable", "dairy"],
        lowercase: true,
    },
    imageLink: {
        type: String,
        required: false,
    },
    created: {
        type: Date,
        required: false,
    },
    updated: {
        type: Date,
        required: false,
    },
}), joiProductSchema = Joi.object({
    name: Joi.string(),
    price: Joi.number(),
    size: Joi.number(),
    unit: Joi.string().valid("oz", "fl oz", "lbs", "item"),
    category: Joi.string().valid("fruit", "vegetable", "dairy"),
    imageLink: Joi.string(),
    qty: Joi.number(),
});
groceryProductSchema.pre("save", async function (next) {
    if (!this.created) {
        this.created = new Date();
    }
    const urlTestVar = await getBing(this.name);
    if (!this.imageLink || this.imageLink != urlTestVar) {
        this.imageLink = urlTestVar;
    }
    next();
});
const groceryProduct = mongoose.model("groceryProduct", groceryProductSchema);
export { groceryProduct, groceryProductSchema, joiProductSchema };
