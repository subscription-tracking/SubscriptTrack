import 'dart:async';

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
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      widget.service.handleBackground();
    } else if (state == AppLifecycleState.resumed) {
      widget.service.handleResume();
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
        builder: (context, _) {
          if (!widget.service.loaded) {
            return const Material(
                child: Center(child: CircularProgressIndicator()));
          }
          return Stack(
            children: [
              widget.child,
              if (widget.service.locked)
                Positioned.fill(child: _LockOverlay(service: widget.service)),
            ],
          );
        },
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
  Timer? _ticker;

  @override
  void dispose() {
    _ticker?.cancel();
    _pin.dispose();
    super.dispose();
  }

  Future<void> _unlock() async {
    final service = widget.service;
    if (service.isLockedOut) return;
    final ok = await service.verifyPin(_pin.text);
    if (!mounted) return;
    setState(() => _error = ok ? null : 'PIN hatalı');
    if (ok) {
      _pin.clear();
    } else {
      _pin.clear();
      _startTicker();
    }
  }

  /// Bekleme süresince kalan süreyi saniyede bir yeniler.
  void _startTicker() {
    _ticker?.cancel();
    if (!widget.service.isLockedOut) return;
    _ticker = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || !widget.service.isLockedOut) {
        t.cancel();
      }
      if (mounted) setState(() {});
    });
  }

  String _hint() {
    final service = widget.service;
    if (service.isLockedOut) {
      final left = service.lockoutRemaining;
      final m = left.inMinutes;
      final sec = left.inSeconds % 60;
      final text = m > 0 ? '$m dk $sec sn' : '${left.inSeconds} sn';
      return 'Çok fazla hatalı deneme. $text sonra tekrar dene.';
    }
    if (service.failedAttempts > 0) {
      return 'PIN hatalı. Bekleme başlamadan ${service.attemptsLeft} deneme hakkın kaldı.';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.service.isLockedOut && (_ticker?.isActive ?? false) == false) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _startTicker();
      });
    }
    final lockedOut = widget.service.isLockedOut;
    final hint = _hint();
    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 340),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.lock_outline, size: 56),
              const SizedBox(height: 16),
              Text('Uygulama kilitli',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 20),
              TextField(
                controller: _pin,
                autofocus: true,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 8,
                onSubmitted: (_) => _unlock(),
                enabled: !lockedOut,
                decoration: InputDecoration(
                    labelText: 'PIN',
                    errorText: hint.isNotEmpty ? hint : _error),
              ),
              FilledButton(
                  onPressed: lockedOut ? null : _unlock,
                  child: const Text('Kilidi aç')),
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
}
