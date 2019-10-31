
module.exports = (cd) => {
	try {
		return cd();
	} catch (e) {
		// nothing
	}
};
