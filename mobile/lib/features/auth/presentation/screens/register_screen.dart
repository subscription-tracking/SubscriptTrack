import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/widgets/ambient_background.dart';
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
          backgroundColor: widget.controller.emailVerificationRequired
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.error,
        ),
      );
      if (widget.controller.emailVerificationRequired) {
        widget.controller.clearError();
        widget.onLoginTap?.call();
        return;
      }
      widget.controller.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
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
                    ..._header(context),
                    const SizedBox(height: 32),
                    ..._fields(),
                    const SizedBox(height: 12),
                    _termsCheckbox(context),
                    const SizedBox(height: 16),
                    _submitButton(),
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

  List<Widget> _header(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return [
      const BrandMark(),
      const SizedBox(height: 28),
      EntranceFade(
        child: GlowOrb(
            icon: Icons.person_add_alt_1_rounded, color: colors.primary),
      ),
      const SizedBox(height: 24),
      EntranceFade(
        child: Text('Hesap oluştur',
            style: text.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
      ),
      const SizedBox(height: 6),
      EntranceFade(
        delay: const Duration(milliseconds: 60),
        child: Text('Aboneliklerini takip etmeye başla.',
            style: text.bodyLarge?.copyWith(color: colors.onSurfaceVariant)),
      ),
    ];
  }

  List<Widget> _fields() {
    return [
      TextFormField(
        controller: _email,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        decoration: const InputDecoration(
          labelText: 'E-posta',
          prefixIcon: Icon(Icons.email_outlined),
        ),
        validator: (v) =>
            v == null || !v.contains('@') ? 'Geçerli bir e-posta gir' : null,
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
        validator: (v) =>
            v == null || v.length < 6 ? 'En az 6 karakter gir' : null,
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
        validator: (v) => v != _password.text ? 'Şifreler eşleşmiyor' : null,
      ),
    ];
  }

  Widget _termsCheckbox(BuildContext context) {
    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      controlAffinity: ListTileControlAffinity.leading,
      value: _agreedToTerms,
      onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
      title: Wrap(
        children: [
          _LegalLink(
            label: 'kullanım şartlarını',
            onTap: () => context.push(AppRoutes.termsOfService),
          ),
          const Text(' ve '),
          _LegalLink(
            label: 'gizlilik politikasını',
            onTap: () => context.push(AppRoutes.privacyPolicy),
          ),
          const Text(' okudum, kabul ediyorum.'),
        ],
      ),
    );
  }

  Widget _submitButton() {
    final loading = widget.controller.loading;
    return FilledButton(
      onPressed: (loading || !_agreedToTerms) ? null : _submit,
      child: loading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            )
          : const Text('Kayıt ol'),
    );
  }
}

class _LegalLink extends StatelessWidget {
  const _LegalLink({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        label,
        style: TextStyle(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.w700,
          decoration: TextDecoration.underline,
        ),
      ),
    );
  }
}
