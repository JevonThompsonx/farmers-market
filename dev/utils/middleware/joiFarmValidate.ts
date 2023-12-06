import { joiFarmSchema, farm, farmSchema } from "../../models/index.js";
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";
const joiFarmCreationValiation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params,
			data = await farm.findById(id),
			validationObject = {
				name: data?.name,
			},
			{ error } = joiFarmSchema.validate(validationObject);
		if (error) {
			next(new AppError(400, _400_user));
		}
	},
	joiFarmEditValiation = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params,
			data = await farm.findById(id),
			validationObject = {
				name: data?.name,
			},
			{ error } = joiFarmSchema.validate(validationObject);
		if (error) {
			next(new AppError(400, _400_user));
		}
	};

export { joiFarmCreationValiation, joiFarmEditValiation}