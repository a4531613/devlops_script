class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isHttpError(err) {
  return err instanceof HttpError;
}

function badRequest(message) {
  return new HttpError(400, message);
}

function unauthorized(message = "unauthorized") {
  return new HttpError(401, message);
}

function forbidden(message = "forbidden") {
  return new HttpError(403, message);
}

function notFound(message = "not found") {
  return new HttpError(404, message);
}

module.exports = {
  HttpError,
  isHttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
};
