import { warn } from "console";

function randomIntGen(max: number): number {
  const minCeiled = Math.ceil(1);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
  // The maximum is inclusive and the minimum is inclusive
}

export default randomIntGen;
