import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/widgets/ambient_background.dart';
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
      body: AmbientBackground(
        child: SafeArea(
          child: ListenableBuilder(
            listenable: widget.controller,
            builder: (context, _) {
              return Form(
                key: _formKey,
                child: ListView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                  children: [
                    const BrandMark(),
                    const SizedBox(height: 28),
                    EntranceFade(
                      child: GlowOrb(
                          icon: Icons.account_balance_wallet_rounded,
                          color: colors.primary),
                    ),
                    const SizedBox(height: 24),
                    EntranceFade(
                      child: Text('Tekrar hoş geldin',
                          style: text.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 6),
                    EntranceFade(
                      delay: const Duration(milliseconds: 60),
                      child: Text('Aboneliklerini yönetmek için giriş yap.',
                          style: text.bodyLarge
                              ?.copyWith(color: colors.onSurfaceVariant)),
                    ),
                    const SizedBox(height: 32),
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
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => v == null || v.length < 6
                          ? 'En az 6 karakter gir'
                          : null,
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: const Text('Şifremi unuttum'),
                      ),
                    ),
                    const SizedBox(height: 16),
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
                          : const Text('Giriş yap'),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: widget.controller.loading
                          ? null
                          : () => _socialSignIn('google'),
                      icon: const Icon(Icons.g_mobiledata, size: 26),
                      label: const Text('Google ile devam et'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: widget.controller.loading
                          ? null
                          : () => _socialSignIn('apple'),
                      icon: const Icon(Icons.apple),
                      label: const Text('Apple ile devam et'),
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
      ),
    );
  }

  Future<void> _socialSignIn(String provider) async {
    final ok = await widget.controller.signInWithProvider(provider);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text(widget.controller.error ?? 'Sosyal giriş başlatılamadı.')),
      );
      widget.controller.clearError();
    }
  }
}
