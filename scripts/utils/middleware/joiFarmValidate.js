import { joiFarmSchema, farm } from "../../models/index.js";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";
const joiFarmCreationValiation = async (req, res, next) => {
    const { id } = req.params, data = await farm.findById(id), validationObject = {
        name: data?.name,
    }, { error } = joiFarmSchema.validate(validationObject);
    if (error) {
        next(new AppError(400, _400_user));
    }
}, joiFarmEditValiation = async (req, res, next) => {
    const { id } = req.params, data = await farm.findById(id), validationObject = {
        name: data?.name,
    }, { error } = joiFarmSchema.validate(validationObject);
    if (error) {
        next(new AppError(400, _400_user));
    }
};
export { joiFarmCreationValiation, joiFarmEditValiation };
