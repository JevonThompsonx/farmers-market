import { joiProductSchema, groceryProduct, } from "../../models/index.js";
import AppError from "../AppError.js";
const joiProductCreationValidation = async (req, res, next) => {
    const { name, qty, price, unit, category, imageLink, size } = req.body, validationObject = {
        name: name,
        unit: unit,
        category: category,
        size: size || 1,
        qty: qty,
        price: price,
    }, { error } = joiProductSchema.validate(validationObject);
    if (error) {
        const msg = error.details.map((element) => element.message).join(",");
        next(new AppError(400, msg));
    }
    else {
        next();
    }
}, joiProductEditValidation = async (req, res, next) => {
    const { id } = req.params, { qty, price } = req.body, data = await groceryProduct.findById(id), validationObject = {
        qty: qty || data?.qty,
        price: price || data?.price,
    }, { error } = joiProductSchema.validate(validationObject);
    if (error) {
        const msg = error.details.map((element) => element.message).join(",");
        next(new AppError(400, msg));
    }
    else {
        next();
    }
};
export { joiProductCreationValidation, joiProductEditValidation };
