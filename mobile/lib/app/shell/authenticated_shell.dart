import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import 'app_shell.dart';

class AuthenticatedShell extends StatefulWidget {
  const AuthenticatedShell({super.key});

  @override
  State<AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<AuthenticatedShell> {
  late final SubscriptionController _subs;

  @override
  void initState() {
    super.initState();
    final userId = context.read<AuthController>().user!.id;
    _subs = SubscriptionController(userId: userId);
    _subs.load();
  }

  @override
  void dispose() {
    _subs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ChangeNotifierProvider<SubscriptionController>.value(
        value: _subs,
        child: const AppShell(),
      );
}
