import Joi, { required } from "joi";
import mongoose, { Schema } from "mongoose";
const ObjectId = Schema.Types.ObjectId,
	reviewSchema = new Schema({
		body: {
			type: String,
			required: true
		},
		rating: {
			type: Number,min:1,max:5,
			required: true
		}, ratingInStars: {
			type: String
		}
		
		
	})
,joiReviewSchema = Joi.object({

	body: Joi.string().required().min(1),
	rating: Joi.number().required().min(1).max(5),
})
, review = mongoose.model('review', reviewSchema)

//

export { reviewSchema, joiReviewSchema,review };
