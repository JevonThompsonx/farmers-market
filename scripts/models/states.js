import { model, Schema } from "mongoose";
const stateModel = new Schema({
    name: {
        type: String,
        required: [true, "State required"],
    },
}), areaCodeModel = new Schema({
    areaCode: {
        type: Number,
        require: [true, "Area code required"],
    },
}), cityModel = new Schema({
    name: {
        type: String,
        required: [true, "State required"],
    },
}), usLocationSchema = new Schema({
    states: [stateModel],
    areaCodes: [areaCodeModel],
    city: [cityModel],
}), usLocation = model("usLocation", usLocationSchema);
export { usLocation, usLocationSchema };
