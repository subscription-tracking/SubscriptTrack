import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/widgets/loading_filled_button.dart';
import '../../domain/password_policy.dart';
import '../auth_controller.dart';
import '../widgets/auth_form_parts.dart';

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
    return AuthPageScaffold(
      controller: widget.controller,
      formKey: _formKey,
      childrenBuilder: (context, loading) => [
        ...authHeaderChildren(
          context,
          icon: Icons.person_add_alt_1_rounded,
          title: 'Hesap oluştur',
          subtitle: 'Aboneliklerini takip etmeye başla.',
        ),
        const SizedBox(height: 32),
        ..._fields(),
        const SizedBox(height: 12),
        _termsCheckbox(context),
        const SizedBox(height: 16),
        LoadingFilledButton(
          label: 'Kayıt ol',
          loading: loading,
          onPressed: _agreedToTerms ? _submit : null,
          tall: false,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: widget.onLoginTap,
          child: const Text('Zaten hesabın var mı? Giriş yap'),
        ),
      ],
    );
  }

  List<Widget> _fields() {
    return [
      AuthEmailField(controller: _email),
      const SizedBox(height: 16),
      AuthPasswordField(
        controller: _password,
        obscure: _obscure,
        onToggleObscure: () => setState(() => _obscure = !_obscure),
        validator: PasswordPolicy.validateNew,
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
