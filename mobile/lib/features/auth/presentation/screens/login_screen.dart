import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_environment.dart';
import '../../../../shared/widgets/loading_filled_button.dart';
import '../auth_controller.dart';
import '../widgets/auth_form_parts.dart';

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

  // Yalnızca debug build'lerde erişilir; release'te buton ve bu sabitler
  // derleme sırasında ayıklanır (bkz. `kDebugMode` kontrolü).
  static const _testEmail = 'testkullanici@subscripttrack.app';
  // Parola ASLA kaynakta tutulmaz (depo herkese açık): yalnızca geliştirici
  // `--dart-define=TEST_ACCOUNT_PASSWORD=...` verirse buton görünür.
  static const _testPassword = String.fromEnvironment('TEST_ACCOUNT_PASSWORD');
  static const _testAccountEnabled = kDebugMode && _testPassword != '';

  Future<void> _quickTestLogin() async {
    if (!_testAccountEnabled) return;
    _email.text = _testEmail;
    _password.text = _testPassword;
    var ok = await widget.controller.signIn(_testEmail, _testPassword);
    // Test hesabı bu cihaz/backend'de henüz kayıtlı değilse (ör. yerel auth
    // modunda temiz bir kurulum, ya da Supabase projesinde bu hesap yoksa),
    // sessizce oluşturup tekrar dene — kullanıcı "hatalı şifre" ile karşılaşmasın.
    if (!ok) {
      widget.controller.clearError();
      final signedUp =
          await widget.controller.signUp(_testEmail, _testPassword);
      if (!signedUp) {
        widget.controller.clearError();
        ok = await widget.controller.signIn(_testEmail, _testPassword);
      } else {
        ok = true;
      }
    }
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
    return AuthPageScaffold(
      controller: widget.controller,
      formKey: _formKey,
      childrenBuilder: (context, loading) => [
        ...authHeaderChildren(
          context,
          icon: Icons.account_balance_wallet_rounded,
          title: 'Tekrar hoş geldin',
          subtitle: 'Aboneliklerini yönetmek için giriş yap.',
        ),
        const SizedBox(height: 32),
        ..._fields(context),
        const SizedBox(height: 16),
        LoadingFilledButton(
            label: 'Giriş yap', loading: loading, onPressed: _submit),
        const SizedBox(height: 12),
        if (EnvironmentConfig.isSocialSignInAvailable) ...[
          ..._socialButtons(loading),
          _OrDivider(color: Theme.of(context).colorScheme),
          const SizedBox(height: 16),
        ],
        if (_testAccountEnabled) _testAccountButton(context, loading),
        const SizedBox(height: 12),
        TextButton(
          onPressed: widget.onRegisterTap,
          child: const Text('Hesabın yok mu? Kayıt ol'),
        ),
      ],
    );
  }

  List<Widget> _fields(BuildContext context) {
    return [
      AuthEmailField(controller: _email),
      const SizedBox(height: 16),
      AuthPasswordField(
        controller: _password,
        obscure: _obscure,
        onToggleObscure: () => setState(() => _obscure = !_obscure),
        textInputAction: TextInputAction.done,
        onSubmitted: _submit,
      ),
      const SizedBox(height: 8),
      Align(
        alignment: Alignment.centerRight,
        child: TextButton(
          onPressed: () => context.push('/forgot-password'),
          child: const Text('Şifremi unuttum'),
        ),
      ),
    ];
  }

  List<Widget> _socialButtons(bool loading) {
    return [
      OutlinedButton.icon(
        onPressed: loading ? null : () => _socialSignIn('google'),
        icon: const Icon(Icons.g_mobiledata, size: 26),
        label: const Text('Google ile devam et'),
      ),
      const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: loading ? null : () => _socialSignIn('apple'),
        icon: const Icon(Icons.apple),
        label: const Text('Apple ile devam et'),
      ),
      const SizedBox(height: 20),
    ];
  }

  Widget _testAccountButton(BuildContext context, bool loading) {
    final colors = Theme.of(context).colorScheme;
    return OutlinedButton.icon(
      onPressed: loading ? null : _quickTestLogin,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        foregroundColor: colors.primary,
        side: BorderSide(color: colors.primary.withValues(alpha: 0.4)),
      ),
      icon: const Icon(Icons.person_outline_rounded),
      label: const Text('Test hesabıyla gir'),
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

class _OrDivider extends StatelessWidget {
  const _OrDivider({required this.color});

  final ColorScheme color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Divider(color: color.outlineVariant)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('veya',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: color.onSurfaceVariant)),
        ),
        Expanded(child: Divider(color: color.outlineVariant)),
      ],
    );
  }
}
