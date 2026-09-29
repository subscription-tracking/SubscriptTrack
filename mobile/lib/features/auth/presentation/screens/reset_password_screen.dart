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
                ..._header(context),
                const SizedBox(height: 32),
                _passwordField(),
                const SizedBox(height: 16),
                _confirmField(),
                ..._errorText(context),
                const SizedBox(height: 24),
                _submitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _header(BuildContext context) {
    final theme = Theme.of(context);
    return [
      const SizedBox(height: 16),
      Icon(Icons.lock_reset_outlined,
          size: 64, color: theme.colorScheme.primary),
      const SizedBox(height: 24),
      Text(
        'Yeni şifreni belirle',
        style: theme.textTheme.headlineSmall,
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      Text(
        'En az 6 karakter uzunluğunda güçlü bir şifre seç.',
        style: theme.textTheme.bodyMedium,
        textAlign: TextAlign.center,
      ),
    ];
  }

  Widget _passwordField() {
    return TextFormField(
      controller: _password,
      obscureText: _obscure1,
      textInputAction: TextInputAction.next,
      decoration: InputDecoration(
        labelText: 'Yeni şifre',
        prefixIcon: const Icon(Icons.lock_outlined),
        suffixIcon: _visibilityButton(
          _obscure1,
          () => setState(() => _obscure1 = !_obscure1),
        ),
      ),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Şifre gerekli.';
        if (v.length < 6) return 'Şifre en az 6 karakter olmalı.';
        return null;
      },
    );
  }

  Widget _confirmField() {
    return TextFormField(
      controller: _confirm,
      obscureText: _obscure2,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) => _submit(),
      decoration: InputDecoration(
        labelText: 'Şifreyi onayla',
        prefixIcon: const Icon(Icons.lock_outlined),
        suffixIcon: _visibilityButton(
          _obscure2,
          () => setState(() => _obscure2 = !_obscure2),
        ),
      ),
      validator: (v) => v != _password.text ? 'Şifreler eşleşmiyor.' : null,
    );
  }

  Widget _visibilityButton(bool obscured, VoidCallback onPressed) {
    return IconButton(
      icon: Icon(
          obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined),
      onPressed: onPressed,
    );
  }

  List<Widget> _errorText(BuildContext context) {
    final error = widget.controller.error;
    if (error == null) return const [];
    return [
      const SizedBox(height: 12),
      Text(
        error,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
        textAlign: TextAlign.center,
      ),
    ];
  }

  Widget _submitButton() {
    final loading = widget.controller.loading;
    return FilledButton(
      onPressed: loading ? null : _submit,
      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
      child: loading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            )
          : const Text('Şifremi güncelle'),
    );
  }
}
