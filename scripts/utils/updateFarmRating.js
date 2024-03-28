import connectionString from "./connectionString.js";
import { farm } from "../models/index.js";
import { review, rating } from "../models/index.js";
import { stars } from "../models/modelData/index.js";
await connectionString();
const updateFarmRating = async (singleFarm) => {
    const thisFarm = await farm.findById(singleFarm).populate("reviews");
    let index = 0, sum = 0, lengthOfReviews = thisFarm?.reviews?.length ?? 0;
    for (let index = 0; index < lengthOfReviews; index++) {
        const element = await review.findById(thisFarm?.reviews[index]);
        sum += element?.ratingInNumbers ?? 0;
        if (index + 1 === lengthOfReviews) {
            const rawAverage = sum / lengthOfReviews, averageInStars = stars[Math.round(rawAverage) - 1];
            const updatedFarm = await farm.updateOne({ _id: singleFarm ?? thisFarm?._id }, {
                rating: {
                    ratingInNumbers: rawAverage,
                    ratingInStars: averageInStars,
                },
            });
        }
        else {
        }
    }
};
const updateAllFarmRatings = async () => {
    try {
        const allFarms = await farm.find();
        allFarms.forEach(async (singleFarm) => {
            const currentRatingOnFarm = await singleFarm?.rating?._id;
            try {
                await review.deleteOne({ _id: currentRatingOnFarm });
            }
            catch {
                try {
                    await rating.deleteOne({ _id: currentRatingOnFarm });
                }
                catch { }
            }
            const thisFarm = await farm.findById(singleFarm?._id);
            await updateFarmRating(thisFarm?._id);
        });
    }
    catch { }
};
export { updateFarmRating, updateAllFarmRatings };
