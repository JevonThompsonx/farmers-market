import AllUsStatesData from "./seedData/allUsStatesData.js";
import { usLocation } from "../models/index.js";
for (const singleUsState of AllUsStatesData) {
    const newState = new usLocation({
        name: singleUsState,
    });
    await newState.save();
}
console.log("Done");
