import '../network/api_client.dart';

/// Stable backend contract for a future device-registration provider.
/// The product currently does not register device tokens.
abstract class DeviceTokenService {
  Future<void> registerToken(String userId, ApiClient client);
  Future<void> revokeToken(String userId, ApiClient client);
}

class PlaceholderDeviceTokenService implements DeviceTokenService {
  const PlaceholderDeviceTokenService();

  @override
  Future<void> registerToken(String userId, ApiClient client) async {}

  @override
  Future<void> revokeToken(String userId, ApiClient client) async {}
}
