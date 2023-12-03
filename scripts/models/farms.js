import { Schema, model } from "mongoose";
const farmSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
    }
});
const farm = model('farm', farmSchema);
export { farmSchema, farm };
