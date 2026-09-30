import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/app_routes.dart';
import '../../features/subscriptions/domain/subscription_models.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';

GoRoute contentRoute(
  String path,
  Widget Function(BuildContext context, GoRouterState state) build,
) =>
    GoRoute(
      path: path,
      builder: (_, state) =>
          Builder(builder: (context) => build(context, state)),
    );

/// [id] ile eşleşen abonelik; yoksa `null`.
Subscription? findSubscription(SubscriptionController controller, String? id) {
  if (id == null) return null;
  for (final sub in controller.allItems) {
    if (sub.id == id) return sub;
  }
  return null;
}

class RouteNotFoundScreen extends StatelessWidget {
  const RouteNotFoundScreen({super.key});

  /// Soğuk başlangıçta derin bağlantıyla açılırsa geri dönülecek ekran
  /// yoktur (AppBar'da geri oku çıkmaz); bu yüzden açık bir çıkış sunulur.
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Abonelik bulunamadı.'),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go(AppRoutes.home),
                child: const Text('Ana sayfaya dön'),
              ),
            ],
          ),
        ),
      );
}
