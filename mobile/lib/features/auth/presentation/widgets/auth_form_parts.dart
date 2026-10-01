import 'package:flutter/material.dart';

import '../../../../shared/widgets/ambient_background.dart';
import '../auth_controller.dart';

/// Giriş, kayıt ve şifre ekranlarının ortak iskeleti: arka plan, güvenli alan,
/// denetleyici dinleyicisi ve form. [childrenBuilder] yükleme durumunu alır.
class AuthPageScaffold extends StatelessWidget {
  const AuthPageScaffold({
    required this.controller,
    required this.formKey,
    required this.childrenBuilder,
    super.key,
  });

  final AuthController controller;
  final GlobalKey<FormState> formKey;
  final List<Widget> Function(BuildContext context, bool loading)
      childrenBuilder;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AmbientBackground(
        child: SafeArea(
          child: ListenableBuilder(
            listenable: controller,
            builder: (context, _) => Form(
              key: formKey,
              child: ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                children: childrenBuilder(context, controller.loading),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Marka, simge ve başlık bloğu (ListView çocukları olarak yayılır).
List<Widget> authHeaderChildren(
  BuildContext context, {
  required IconData icon,
  required String title,
  required String subtitle,
}) {
  final colors = Theme.of(context).colorScheme;
  final text = Theme.of(context).textTheme;
  return [
    const BrandMark(),
    const SizedBox(height: 28),
    EntranceFade(child: GlowOrb(icon: icon, color: colors.primary)),
    const SizedBox(height: 24),
    EntranceFade(
      child: Text(title,
          style: text.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
    ),
    const SizedBox(height: 6),
    EntranceFade(
      delay: const Duration(milliseconds: 60),
      child: Text(subtitle,
          style: text.bodyLarge?.copyWith(color: colors.onSurfaceVariant)),
    ),
  ];
}

class AuthEmailField extends StatelessWidget {
  const AuthEmailField({required this.controller, super.key});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      decoration: const InputDecoration(
        labelText: 'E-posta',
        prefixIcon: Icon(Icons.email_outlined),
      ),
      validator: (v) =>
          v == null || !v.contains('@') ? 'Geçerli bir e-posta gir' : null,
    );
  }
}

/// Şifre alanı; [onToggleObscure] verilirse görünürlük düğmesi çıkar.
class AuthPasswordField extends StatelessWidget {
  const AuthPasswordField({
    required this.controller,
    required this.obscure,
    this.label = 'Şifre',
    this.onToggleObscure,
    this.textInputAction = TextInputAction.next,
    this.onSubmitted,
    this.validator,
    super.key,
  });

  final TextEditingController controller;
  final bool obscure;
  final String label;
  final VoidCallback? onToggleObscure;
  final TextInputAction textInputAction;
  final VoidCallback? onSubmitted;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      textInputAction: textInputAction,
      onFieldSubmitted: onSubmitted == null ? null : (_) => onSubmitted!(),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: onToggleObscure == null
            ? null
            : IconButton(
                icon: Icon(obscure
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined),
                onPressed: onToggleObscure,
              ),
      ),
      validator:
          validator ?? (v) => v == null || v.isEmpty ? 'Şifre gerekli.' : null,
    );
  }
}
