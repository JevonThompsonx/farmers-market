export default (word: String) => {
	return word[0].toUpperCase() + word.slice(1).toLowerCase();
};