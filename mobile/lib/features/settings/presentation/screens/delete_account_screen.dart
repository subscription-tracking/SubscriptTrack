import 'package:flutter/material.dart';

import '../../../../core/storage/local_storage.dart';
import '../../../auth/presentation/auth_controller.dart';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({required this.auth, super.key});

  final AuthController auth;

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;
  bool _deleting = false;
  String? _error;

  bool get _canDelete =>
      _confirm.text.trim().toLowerCase() == 'sil' &&
      _password.text.length >= 6;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    setState(() {
      _deleting = true;
      _error = null;
    });

    // Re-auth önce
    final email = widget.auth.user?.email ?? '';
    final ok = await widget.auth.signIn(email, _password.text);
    if (!ok) {
      setState(() {
        _deleting = false;
        _error = widget.auth.error ?? 'Şifre doğrulanamadı.';
      });
      widget.auth.clearError();
      return;
    }

    await widget.auth.deleteAccount(LocalStorage.instance);
    // AuthController unauthenticated durumuna geçer → router login'e yönlendirir.
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Hesabı sil')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            color: colors.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Icon(Icons.warning_outlined, color: colors.error),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Bu işlem geri alınamaz. Hesabın ve tüm abonelik verilerin kalıcı olarak silinecek.',
                    style: TextStyle(color: colors.onErrorContainer),
                  ),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Devam etmek için şifreni gir:'),
          const SizedBox(height: 12),
          TextFormField(
            controller: _password,
            obscureText: _obscure,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Şifre',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscure
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
              errorText: _error,
            ),
          ),
          const SizedBox(height: 20),
          const Text('Onaylamak için aşağıya "sil" yazın:'),
          const SizedBox(height: 12),
          TextField(
            controller: _confirm,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(hintText: 'sil'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: (_canDelete && !_deleting) ? _delete : null,
            style: FilledButton.styleFrom(
              backgroundColor: colors.error,
              minimumSize: const Size.fromHeight(48),
            ),
            child: _deleting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Hesabı kalıcı olarak sil'),
          ),
        ],
      ),
    );
  }
}
