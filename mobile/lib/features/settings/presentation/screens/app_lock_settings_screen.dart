import 'package:flutter/material.dart';

import '../../../../core/services/app_lock_service.dart';

class AppLockSettingsScreen extends StatefulWidget {
  const AppLockSettingsScreen({required this.service, super.key});
  final AppLockService service;

  @override
  State<AppLockSettingsScreen> createState() => _AppLockSettingsScreenState();
}

class _AppLockSettingsScreenState extends State<AppLockSettingsScreen> {
  final _pin = TextEditingController();

  @override
  void dispose() {
    _pin.dispose();
    super.dispose();
  }

  Future<void> _setPin() async {
    try {
      await widget.service.setPin(_pin.text);
      _pin.clear();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('PIN kaydedildi')));
      }
    } on FormatException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: widget.service,
        builder: (_, __) => Scaffold(
          appBar: AppBar(title: const Text('Uygulama kilidi')),
          body: ListView(padding: const EdgeInsets.all(20), children: [
            SwitchListTile(
              title: const Text('PIN kilidi'),
              subtitle: Text(widget.service.enabled
                  ? 'Arka plandan dönünce sorulur'
                  : 'Kapalı'),
              value: widget.service.enabled,
              onChanged: widget.service.enabled
                  ? (_) => widget.service.disable()
                  : null,
            ),
            if (!widget.service.enabled) ...[
              TextField(
                  controller: _pin,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 8,
                  decoration: const InputDecoration(labelText: 'Yeni PIN')),
              FilledButton(
                  onPressed: _setPin, child: const Text('PIN’i etkinleştir')),
            ],
            SwitchListTile(
              title: const Text('Biyometrik kilit açma'),
              value: widget.service.biometricEnabled,
              onChanged: widget.service.enabled
                  ? (value) async {
                      try {
                        await widget.service.setBiometricEnabled(value);
                      } on StateError catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text(e.message)));
                        }
                      }
                    }
                  : null,
            ),
          ]),
        ),
      );
}
