import { warn } from "console";

function randomIntGen(max: number): number {
  return Math.floor(Math.random() * max);
}

export default randomIntGen;
