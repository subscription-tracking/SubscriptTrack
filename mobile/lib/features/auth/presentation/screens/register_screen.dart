import 'package:flutter/material.dart';

import '../../../../shared/widgets/ambient_background.dart';
import '../../../settings/presentation/screens/privacy_policy_screen.dart';
import '../../../settings/presentation/screens/terms_of_service_screen.dart';
import '../auth_controller.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({required this.controller, this.onLoginTap, super.key});

  final AuthController controller;
  final VoidCallback? onLoginTap;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _agreedToTerms = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreedToTerms) return;
    final ok = await widget.controller.signUp(
      _email.text.trim(),
      _password.text,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.controller.error ?? 'Kayıt başarısız.'),
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
                          icon: Icons.person_add_alt_1_rounded,
                          color: colors.primary),
                    ),
                    const SizedBox(height: 24),
                    EntranceFade(
                      child: Text('Hesap oluştur',
                          style: text.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 6),
                    EntranceFade(
                      delay: const Duration(milliseconds: 60),
                      child: Text('Aboneliklerini takip etmeye başla.',
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
                      textInputAction: TextInputAction.next,
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
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _confirm,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: const InputDecoration(
                        labelText: 'Şifre tekrar',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      validator: (v) =>
                          v != _password.text ? 'Şifreler eşleşmiyor' : null,
                    ),
                    const SizedBox(height: 12),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      value: _agreedToTerms,
                      onChanged: (v) =>
                          setState(() => _agreedToTerms = v ?? false),
                      title: Wrap(
                        children: [
                          GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute<void>(
                                builder: (_) => const TermsOfServiceScreen(),
                              ),
                            ),
                            child: Text(
                              'kullanım şartlarını',
                              style: TextStyle(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                          const Text(' ve '),
                          GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute<void>(
                                builder: (_) => const PrivacyPolicyScreen(),
                              ),
                            ),
                            child: Text(
                              'gizlilik politikasını',
                              style: TextStyle(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                          const Text(' okudum, kabul ediyorum.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: (widget.controller.loading || !_agreedToTerms)
                          ? null
                          : _submit,
                      child: widget.controller.loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Kayıt ol'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: widget.onLoginTap,
                      child: const Text('Zaten hesabın var mı? Giriş yap'),
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
}
