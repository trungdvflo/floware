/* eslint-disable max-classes-per-file */
const errors = require('./errors');

const { DomailError } = errors;
const { RetryableError } = errors;

class SMTPRetryableError extends RetryableError {
    constructor(msg) {
        super(msg);
        this.userMessage = 'We were unable to reach your SMTP server. Please try again.';
        this.statusCode = 408;
    }
}
class SMTPConnectionTimeoutError extends SMTPRetryableError { }
class SMTPConnectionEndedError extends SMTPRetryableError { }
class SMTPConnectionTLSError extends SMTPRetryableError { }
class SMTPProtocolError extends DomailError {
    constructor(msg) {
        super(msg);
        this.userMessage = 'SMTP protocol error. Please check your SMTP settings.';
        this.statusCode = 401;
    }
}

class SMTPConnectionDNSError extends DomailError {
    constructor(msg) {
        super(msg);
        this.userMessage = 'We were unable to look up your SMTP host. Please check the SMTP server name.';
        this.statusCode = 401;
    }
}

class SMTPAuthenticationError extends DomailError {
    constructor(msg) {
        super(msg);
        this.userMessage = 'Incorrect SMTP username or password.';
        this.statusCode = 401;
    }
}

class SMTPCertificateError extends DomailError {
    constructor(msg, host) {
        super(msg);
        const hostStr = host ? ` "${host}"` : '';
        this.userMessage = `Certificate Error: We couldn't verify the identity of the SMTP server${hostStr}.`;
        this.statusCode = 495;
    }
}
function convertSmtpError(err, { connectionSettings = {} } = {}) {
    // TODO: what error is thrown if you're offline?
    // TODO: what error is thrown if the message you're sending is too large?
    if (/(?:connection timeout)|(?:connect etimedout)/i.test(err.message)) {
        return new SMTPConnectionTimeoutError(err);
    }
    if (/(?:connection|socket) closed?/i.test(err.message)) {
        const smtpErr = SMTPConnectionEndedError(err);
        if (err.code) {
            // e.g. https://github.com/nodemailer/nodemailer/blob/master/lib/smtp-transport/index.js#L184-L185
            smtpErr.code = err.code;
        }
    }

    const isCertificateError = (
        err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    || err.code === 'SELF_SIGNED_CERT_IN_CHAIN'
    || /certificate/i.test(err.message)
    );
    if (isCertificateError) {
        return new SMTPCertificateError(err, connectionSettings.host);
    }

    if (/error initiating tls/i.test(err.message)) {
        return new SMTPConnectionTLSError(err);
    }
    if (/getaddrinfo enotfound/i.test(err.message)) {
        return new SMTPConnectionDNSError(err);
    }
    if (/unknown protocol/i.test(err.message)) {
        return new SMTPProtocolError(err);
    }
    if (/(?:invalid login)|(?:username and password not accepted)|(?:incorrect username or password)|(?:authentication failed)/i.test(err.message)) {
        return new SMTPAuthenticationError(err);
    }

    return err;
}

module.exports = {
    SMTPRetryableError,
    SMTPConnectionTimeoutError,
    SMTPConnectionEndedError,
    SMTPConnectionTLSError,
    SMTPProtocolError,
    SMTPConnectionDNSError,
    SMTPAuthenticationError,
    SMTPCertificateError,
    convertSmtpError
};
