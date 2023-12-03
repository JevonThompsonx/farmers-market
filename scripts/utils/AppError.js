class AppError extends Error {
    status;
    constructor(status, message) {
        super();
        this.message = message;
        this.status = status;
    }
}
export default AppError;
