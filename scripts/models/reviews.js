import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import stars from "./modelData/stars.js";
const reviewSchema = new Schema({
    body: {
        type: String,
        required: true,
    },
    ratingInNumbers: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    ratingInStars: {
        type: String,
        required: true,
        enum: [...stars],
    },
}), ratingSchema = new Schema({
    ratingInNumbers: {
        type: Number,
        required: true,
    },
    ratingInStars: {
        type: String,
        required: true,
        enum: [...stars],
    },
}), joiReviewSchema = Joi.object({
    body: Joi.string().required().min(1),
    rating: Joi.number().required().min(1).max(5),
}), review = mongoose.model("review", reviewSchema), rating = mongoose.model("rating", reviewSchema);
export { reviewSchema, joiReviewSchema, review, rating, ratingSchema };
