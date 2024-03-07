//steps:
// find current farm/Farms
// create an array of Farm ratings
// add all Farm ratings together and find an average

import connectionString from "./connectionString.js";
import { Request, Response, NextFunction } from "express";
import { farm } from "../models/index.js";
import { review, rating } from "../models/index.js";
import { stars } from "../models/modelData/index.js";
import { ObjectId } from "mongoose";
await connectionString();
const updateFarmRating = async (singleFarm: ObjectId) => {
  const thisFarm = await farm.findById(singleFarm).populate("reviews");
  let index = 0,
    sum = 0,
    lengthOfReviews = thisFarm?.reviews?.length ?? 0;
  for (let index = 0; index < lengthOfReviews; index++) {
    const element = await review.findById(thisFarm?.reviews[index]);
    sum += element?.ratingInNumbers ?? 0;
    if (index + 1 === lengthOfReviews) {
      const rawAverage = sum / lengthOfReviews,
        averageFloored = Math.floor(rawAverage),
        averageInStars = stars[averageFloored - 1];
      // console.log(`The average is: ${averageFloored}`);
      // console.log(
      //   `The average rating for the post is ${stars[averageFloored - 1]} `,
      // );
      const updatedFarm = await farm.updateOne(
        { _id: singleFarm ?? thisFarm?._id },
        {
          rating: {
            ratingInNumbers: averageFloored,
            ratingInStars: averageInStars,
          },
        },
      );
      // console.log(updatedFarm);
    } else {
    }
  }
};

const updateAllFarmRatings = async () => {
  try {
    const allFarms = await farm.find();
    allFarms.forEach(async (singleFarm) => {
      //@ts-ignore
      const currentRatingOnFarm = await singleFarm?.rating?._id;
      try {
        await review.deleteOne({ _id: currentRatingOnFarm });
        //delete legacy reviews on the original review model for Farms and farms
      } catch {
        try {
          await rating.deleteOne({ _id: currentRatingOnFarm });
          //deletes new on the current 'rating' model for Farm and farm auto generated averages only
        } catch { }
      }
      const thisFarm = await farm.findById(singleFarm?._id);
      //@ts-ignore
      await updateFarmRating(thisFarm?._id);
    });
  } catch { }
};
export { updateFarmRating, updateAllFarmRatings };
