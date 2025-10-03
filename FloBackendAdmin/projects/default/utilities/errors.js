/* eslint-disable max-classes-per-file */
class DomailError extends Error {
    toJSON() {
        let json = {};
        if (super.toJSON) {
            // Chromium `Error`s have a `toJSON`, but Node `Error`s do NOT!
            json = super.toJSON();
        }
        Object.getOwnPropertyNames(this).forEach((key) => {
            json[key] = this[key];
        });
        return json;
    }
}

class APIError extends DomailError {
    constructor(message, statusCode, data) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}

/**
 * An abstract base class that can be used to indicate Errors that may fix
 * themselves when retried
 */
class RetryableError extends DomailError { }

module.exports = {
    DomailError,
    APIError,
    RetryableError
};

