import 'package:flutter/material.dart';

import 'app_lock_service.dart';

class AppLockGate extends StatefulWidget {
  const AppLockGate({required this.service, required this.child, super.key});
  final AppLockService service;
  final Widget child;

  @override
  State<AppLockGate> createState() => _AppLockGateState();
}

class _AppLockGateState extends State<AppLockGate> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    widget.service.load();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      widget.service.lock();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: widget.service,
        builder: (context, _) => Stack(
          children: [
            widget.child,
            if (widget.service.locked)
              Positioned.fill(child: _LockOverlay(service: widget.service)),
          ],
        ),
      );
}

class _LockOverlay extends StatefulWidget {
  const _LockOverlay({required this.service});
  final AppLockService service;

  @override
  State<_LockOverlay> createState() => _LockOverlayState();
}

class _LockOverlayState extends State<_LockOverlay> {
  final _pin = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _pin.dispose();
    super.dispose();
  }

  Future<void> _unlock() async {
    final ok = await widget.service.verifyPin(_pin.text);
    if (!mounted) return;
    setState(() => _error = ok ? null : 'PIN hatalı');
    if (ok) _pin.clear();
  }

  @override
  Widget build(BuildContext context) => Material(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 340),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.lock_outline, size: 56),
                const SizedBox(height: 16),
                Text('Uygulama kilitli', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 20),
                TextField(
                  controller: _pin,
                  autofocus: true,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 8,
                  onSubmitted: (_) => _unlock(),
                  decoration: InputDecoration(labelText: 'PIN', errorText: _error),
                ),
                FilledButton(onPressed: _unlock, child: const Text('Kilidi aç')),
                if (widget.service.biometricEnabled)
                  TextButton.icon(
                    onPressed: widget.service.unlockWithBiometric,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Biyometri ile aç'),
                  ),
              ]),
            ),
          ),
        ),
      );
}
