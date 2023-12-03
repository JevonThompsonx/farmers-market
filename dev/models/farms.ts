import mongoose, { Schema,model } from "mongoose";
import getBing from "../seed/getBing.js";

const farmSchema = new Schema({
    name: {
		type: String,
		required: true,
		lowercase: true,
	}
})
const farm = model('farm',farmSchema)
export { farmSchema,farm }
//export {farmSchema, joiFarmSchema, farm}