import { review } from "../../models/index.js";
import { randomIntGen } from "../../utils/index.js";
import { Schema } from "mongoose";
import { stars } from "../../models/modelData/index.js";
import seedUtilsConnectionString from "./seedUtilsConnectionString.js";
const randReview = async () => {
  const randRatingFunc = () => randomIntGen(5),
    randRating = randRatingFunc(),
    randReview = new review({
      body: "Testing review",
      ratingInNumbers: randRating,
      ratingInStars: stars[Math.round(randRating) - 1],
    });
  console.log(randReview);
  await randReview.save();
  return randReview._id;
};

export { randReview };
