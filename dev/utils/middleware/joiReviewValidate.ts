import { joiReviewSchema} from "../../models/index.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";
const joiReviewValidate = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		let {reviewBody,reviewRating} =
				req.body,
			validationObject = {
		body : reviewBody.trim(), 
        rating : reviewRating
            },
        { error } = joiReviewSchema.validate(validationObject);

		if (error) {
			const msg = error.details
				.map((element) => element.message)
				.join(",");
			next(new AppError(400, msg));
        } else {
			next();
		}
	}
export { joiReviewValidate}