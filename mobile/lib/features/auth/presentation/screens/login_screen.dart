import 'package:flutter/material.dart';

import '../auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({required this.controller, this.onRegisterTap, super.key});

  final AuthController controller;
  final VoidCallback? onRegisterTap;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await widget.controller.signIn(
      _email.text.trim(),
      _password.text,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.controller.error ?? 'Giriş başarısız.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      widget.controller.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: widget.controller,
          builder: (context, _) {
            return Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                children: [
                  const SizedBox(height: 24),
                  Icon(Icons.account_balance_wallet_outlined,
                      size: 64, color: colors.primary),
                  const SizedBox(height: 20),
                  Text('Tekrar hoş geldin',
                      style: text.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('Aboneliklerini yönetmek için giriş yap.',
                      style: text.bodyLarge),
                  const SizedBox(height: 36),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'E-posta',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (v) => v == null || !v.contains('@')
                        ? 'Geçerli bir e-posta gir'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: 'Şifre',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                        onPressed: () =>
                            setState(() => _obscure = !_obscure),
                      ),
                    ),
                    validator: (v) => v == null || v.length < 6
                        ? 'En az 6 karakter gir'
                        : null,
                  ),
                  const SizedBox(height: 28),
                  FilledButton(
                    onPressed:
                        widget.controller.loading ? null : _submit,
                    child: widget.controller.loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Giriş yap'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: widget.onRegisterTap,
                    child: const Text('Hesabın yok mu? Kayıt ol'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
