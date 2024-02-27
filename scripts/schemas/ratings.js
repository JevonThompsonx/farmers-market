import { Schema } from "mongoose";
const ratingSchema = new Schema({
    ratingInNumbers: {
        type: Number,
        required: true,
    },
    ratingInStars: {
        type: String,
        required: true,
        enum: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
    },
});
export { ratingSchema };
