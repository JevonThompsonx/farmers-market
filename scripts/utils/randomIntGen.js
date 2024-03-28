function randomIntGen(max) {
    const minCeiled = Math.ceil(1);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}
export default randomIntGen;
