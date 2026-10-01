import 'dart:async';

import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/services/pin_hasher.dart';

/// Tüm testlerde PIN özetleyici senkron ve düşük turlu olur (üretimde
/// PBKDF2 isolate'te çalışır); böylece testler hızlı ve fake-async dostudur.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  AppLockService.defaultHasher = const InlinePinHasher(iterations: 1000);
  await testMain();
}
