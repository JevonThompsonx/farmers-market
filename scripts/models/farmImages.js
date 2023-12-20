import { Schema, model } from "mongoose";
import Joi from "joi";
const farmImageSchema = new Schema({
    link: {
        type: [String, "Cannot create an image link w/ no image"],
    },
}), joiFarmImageSchema = Joi.object({
    link: Joi.string().required(),
}), farmImage = model("farmImage", farmImageSchema);
export { farmImageSchema, joiFarmImageSchema, farmImage };
