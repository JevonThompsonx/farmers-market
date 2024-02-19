import { joiReviewSchema } from "../../models/index.js";
import AppError from "../AppError.js";
const joiReviewValidate = async (req, res, next) => {
    let { reviewBody, reviewRating } = req.body, validationObject = {
        body: reviewBody.trim(),
        rating: reviewRating
    }, { error } = joiReviewSchema.validate(validationObject);
    if (error) {
        const msg = error.details
            .map((element) => element.message)
            .join(",");
        next(new AppError(400, msg));
    }
    else {
        next();
    }
};
export { joiReviewValidate };
