import { joiFarmImageSchema, farmImage, } from "../../models/index.js";
import AppError from "../AppError.js";
import { _400_user } from "../../errorCodes/_400_user.js";
const joiFarmImageValiation = async (req, res, next) => {
    const { link } = req.body, newFarmImage = new farmImage({
        link: link,
    }), { error } = joiFarmImageSchema.validate(newFarmImage);
    if (error) {
        next(new AppError(400, _400_user));
    }
    else {
        return newFarmImage;
    }
};
