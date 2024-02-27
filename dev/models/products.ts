import mongoose, { Schema } from "mongoose";
import getBing from "../seed/utils/getBing.js";
import Joi from "joi";
import { review } from "./index.js";
const ObjectId = Schema.Types.ObjectId,
  ratingSchema = new Schema({
    ratingInNumbers: {
      type: Number,
      required: true,
    },
    ratingInStars: {
      type: String,
      required: true,
      enum: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
    },
  }),
  groceryProductSchema = new Schema({
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
    reviews: [
      {
        type: ObjectId,
        ref: "review",
      },
    ],
    rating: {
      type: ratingSchema,
      required: false,
    },
  }),
  joiProductSchema = Joi.object({
    name: Joi.string().required(),
    farmName: Joi.string().required(),
    price: Joi.number().min(1).required(),
    size: Joi.number().min(1).max(99).required(),
    unit: Joi.string().valid("oz", "fl oz", "lbs", "item").required(),
    category: Joi.string().valid("fruit", "vegetable", "dairy").required(),
    imageLink: Joi.string(),
    qty: Joi.number().min(1).required(),
    reviews: Joi.array(),
  }),
  joiProductEditSchema = Joi.object({
    price: Joi.number().min(1),
    size: Joi.number().min(1).max(99),
  });

groceryProductSchema.pre("save", async function(next) {
  this.updated = new Date();
  const newImageLink = await getBing(this.name);
  if (!this.imageLink || this.imageLink != newImageLink) {
    this.imageLink = newImageLink;
  }
  next();
});

// groceryProductSchema.pre('updateOne', async function(next) {
//     const urlTestVar = await getBing(this.name);
//     if (!this.imageLink || this.imageLink != urlTestVar) {this.set({imageLink:urlTestVar,updated:new Date})}
//     console.log(urlTestVar)
//     next();
// });

const groceryProduct = mongoose.model("groceryProduct", groceryProductSchema);

export {
  groceryProduct,
  groceryProductSchema,
  joiProductSchema,
  joiProductEditSchema,
};
