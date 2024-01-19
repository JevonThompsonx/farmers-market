import mongoose, { Schema } from "mongoose";
import getBing from "../seed/utils/getBing.js";
import Joi from "joi";
const ObjectId = Schema.Types.ObjectId, groceryProductSchema = new Schema({
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
        default: new Date(),
    },
    updated: {
        type: Date,
        required: false,
    },
    farm: {
        type: ObjectId,
        ref: "farm",
    },
}), joiProductSchema = Joi.object({
    name: Joi.string().required(),
    farmName: Joi.string(),
    price: Joi.number().min(1),
    size: Joi.number().min(1).max(99),
    unit: Joi.string().valid("oz", "fl oz", "lbs", "item"),
    category: Joi.string().valid("fruit", "vegetable", "dairy"),
    imageLink: Joi.string(),
    qty: Joi.number().min(1),
});
groceryProductSchema.pre("save", async function (next) {
    this.updated = new Date();
    const newImageLink = await getBing(this.name);
    if (!this.imageLink || this.imageLink != newImageLink) {
        this.imageLink = newImageLink;
    }
    next();
});
const groceryProduct = mongoose.model("groceryProduct", groceryProductSchema);
export { groceryProduct, groceryProductSchema, joiProductSchema };
