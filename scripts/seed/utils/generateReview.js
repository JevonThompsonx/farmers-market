import { review } from "../../models/index.js";
import { randomIntGen } from "../../utils/index.js";
const reviewArray = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"], randReview = () => {
    const randRatingFunc = () => randomIntGen(5), randRating = randRatingFunc(), randReview = new review({
        body: "Testing review",
        rating: randRating,
        ratingInStars: reviewArray[randRating],
    });
    randReview.save();
    return randReview._id;
};
export { randReview };
