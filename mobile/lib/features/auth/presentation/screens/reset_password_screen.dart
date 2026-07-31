import 'package:flutter/material.dart';

import '../auth_controller.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({required this.controller, super.key});

  final AuthController controller;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await widget.controller.updatePassword(_password.text);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Şifren başarıyla güncellendi!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Yeni şifre oluştur')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: ListenableBuilder(
          listenable: widget.controller,
          builder: (context, _) => Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                Icon(Icons.lock_reset_outlined, size: 64, color: colors.primary),
                const SizedBox(height: 24),
                Text(
                  'Yeni şifreni belirle',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'En az 6 karakter uzunluğunda güçlü bir şifre seç.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure1,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Yeni şifre',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure1
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure1 = !_obscure1),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Şifre gerekli.';
                    if (v.length < 6) return 'Şifre en az 6 karakter olmalı.';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscure2,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: 'Şifreyi onayla',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure2
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure2 = !_obscure2),
                    ),
                  ),
                  validator: (v) {
                    if (v != _password.text) return 'Şifreler eşleşmiyor.';
                    return null;
                  },
                ),
                if (widget.controller.error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    widget.controller.error!,
                    style: TextStyle(color: colors.error),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: widget.controller.loading ? null : _submit,
                  style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(52)),
                  child: widget.controller.loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Şifremi güncelle'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
