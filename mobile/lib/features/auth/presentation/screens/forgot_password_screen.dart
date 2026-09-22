import 'package:flutter/material.dart';

import '../../../../core/config/app_environment.dart';
import '../auth_controller.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({required this.controller, super.key});

  final AuthController controller;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok =
        await widget.controller.sendPasswordResetEmail(_email.text.trim());
    if (ok && mounted) setState(() => _sent = true);
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Şifremi unuttum')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: !EnvironmentConfig.isSupabaseConfigured
            ? const _UnavailableInLocalMode()
            : _sent
                ? _SuccessView(email: _email.text.trim())
                : _FormView(
                    formKey: _formKey,
                    email: _email,
                    controller: widget.controller,
                    colors: colors,
                    onSubmit: _submit,
                  ),
      ),
    );
  }
}

class _UnavailableInLocalMode extends StatelessWidget {
  const _UnavailableInLocalMode();

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.info_outline, size: 64),
            const SizedBox(height: 20),
            Text('Şifre sıfırlama kullanılamıyor',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center),
            const SizedBox(height: 12),
            const Text(
              'Bu kurulum cihaz içi test hesabı kullanıyor; e-posta gönderimi yok. '
              'Şifre sıfırlama, Supabase ile giriş yapılan sürümde kullanılabilir.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Giriş ekranına dön'),
            ),
          ],
        ),
      );
}

class _FormView extends StatelessWidget {
  const _FormView({
    required this.formKey,
    required this.email,
    required this.controller,
    required this.colors,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController email;
  final AuthController controller;
  final ColorScheme colors;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          Icon(Icons.lock_reset_outlined, size: 64, color: colors.primary),
          const SizedBox(height: 24),
          Text(
            'Şifre sıfırlama bağlantısı',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Kayıtlı e-posta adresine şifre sıfırlama bağlantısı göndereceğiz.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => onSubmit(),
            decoration: const InputDecoration(
              labelText: 'E-posta',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'E-posta gerekli.';
              if (!v.contains('@')) return 'Geçerli bir e-posta gir.';
              return null;
            },
          ),
          if (controller.error != null) ...[
            const SizedBox(height: 12),
            Text(
              controller.error!,
              style: TextStyle(color: colors.error),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: controller.loading ? null : onSubmit,
            style:
                FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: controller.loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Bağlantı gönder'),
          ),
        ],
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.email});
  final String email;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Icon(Icons.mark_email_read_outlined, size: 72, color: colors.primary),
        const SizedBox(height: 24),
        Text(
          'Mail gönderildi!',
          style: Theme.of(context).textTheme.headlineSmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          '$email adresine şifre sıfırlama bağlantısı gönderildi.\nSpam klasörünü de kontrol et.',
          style: Theme.of(context).textTheme.bodyMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        OutlinedButton(
          onPressed: () => Navigator.pop(context),
          style:
              OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: const Text('Giriş ekranına dön'),
        ),
      ],
    );
  }
}
