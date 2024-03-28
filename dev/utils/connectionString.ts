import mongoose, { connect } from "mongoose";
import "dotenv/config";
import { configDotenv } from "dotenv";
configDotenv({ path: "../../.env" });
const API_KEY = process.env.API_KEY;

export default async () =>
  await connect(
    `mongodb+srv://Jevonx:${API_KEY}@cluster0.q4o1wzp.mongodb.net/?retryWrites=true&w=majority`,
    { dbName: "expressConnect" },
  )
    .then(() => {
      console.log("Connection succesful");
    })
    .catch((err) => {
      console.log(`Connection errrorrrr`);
    });
