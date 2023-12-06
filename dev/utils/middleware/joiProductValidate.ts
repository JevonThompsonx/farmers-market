import {
	joiProductSchema,
	groceryProduct,
	groceryProductSchema,
} from "../../models/index.js";
import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";

const joiProductCreationValidation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { name, qty, price, unit, category, imageLink, size } = req.body,
			validationObject = {
				name: name,
				unit: unit,
				category: category,
				size: size || 1,
				qty: qty,
				price: price,
			},
			{ error } = joiProductSchema.validate(validationObject);

	if (error) {
		const msg = error.details.map((element) => element.message).join(",");
		next(new AppError(400, msg));
	} else {
		next();
	}
	},
	joiProductEditValidation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params,
			{ qty, price } = req.body,
			data = await groceryProduct.findById(id),
			validationObject = {
				qty: qty || data?.qty,
				price: price || data?.price,
			},
			{ error } = joiProductSchema.validate(validationObject);

	if (error) {
		const msg = error.details.map((element) => element.message).join(",");
		next(new AppError(400, msg));
	} else {
		next();
	}
	};
export { joiProductCreationValidation, joiProductEditValidation };
