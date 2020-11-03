export default class ErrorResult<T> {
    public readonly error: T;

    constructor(error: T) {
        this.error = error;
    }
}