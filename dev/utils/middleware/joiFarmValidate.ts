import { joiFarmSchema, farm, farmSchema } from "../../models/index.js";
import { Request, Response, NextFunction } from "express";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";
const joiFarmCreationValiation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { name, description, city, state, email } = req.body,
			validationObject = {
				name: name,
				description: description,
				location: {
					city: city,
					state: state,
				},
				email: email,
			},
			{ error } = joiFarmSchema.validate(validationObject);

		if (error) {
			next(new AppError(400, _400_user));
		} else {
			next();
		}
	},
	joiFarmEditValiation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params,
			{ newDescription } = req.body,
			validationObject = {
				description: newDescription,
			},
			{ error } = joiFarmSchema.validate(validationObject);
		if (error) {
			next(new AppError(400, _400_user));
		} else {
			next();
		}
	};

export { joiFarmCreationValiation, joiFarmEditValiation };
