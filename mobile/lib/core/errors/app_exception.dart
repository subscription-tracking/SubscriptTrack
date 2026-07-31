sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuthException extends AppException {
  const AuthException(super.message);
}

class StorageException extends AppException {
  const StorageException(super.message);
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class NotFoundException extends AppException {
  const NotFoundException(super.message);
}

class ValidationException extends AppException {
  const ValidationException(super.message);
}
