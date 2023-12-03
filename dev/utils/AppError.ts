class AppError extends Error {
	status: any;
	constructor(status: any, message: string) {
		super();
		this.message = message;
		this.status = status;
	}
}

export default AppError;
