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
  final _confirm = TextEditingController();
  bool _deleting = false;

  bool get _canDelete => _confirm.text.trim().toLowerCase() == 'sil';

  @override
  void dispose() {
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    setState(() => _deleting = true);
    await widget.auth.deleteAccount(LocalStorage.instance);
    // Auth durumu unauthenticated'a döndüğünde app.dart otomatik login'e yönlendirir.
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
            style: FilledButton.styleFrom(backgroundColor: colors.error),
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
