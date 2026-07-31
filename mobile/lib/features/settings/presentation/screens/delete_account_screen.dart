import 'package:flutter/material.dart';

import '../../../auth/presentation/auth_controller.dart';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({required this.auth, super.key});

  final AuthController auth;

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _confirm = TextEditingController();
  bool get _canDelete =>
      _confirm.text.trim().toLowerCase() == 'sil';

  @override
  void dispose() {
    _confirm.dispose();
    super.dispose();
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
                    'Bu işlem geri alınamaz. Tüm abonelik verilerin silinecek.',
                    style: TextStyle(color: colors.onErrorContainer),
                  ),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Onaylamak için aşağıya "sil" yazın:',
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirm,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'sil',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _canDelete
                ? () async {
                    await widget.auth.signOut();
                  }
                : null,
            style: FilledButton.styleFrom(
              backgroundColor: colors.error,
            ),
            child: const Text('Hesabı kalıcı olarak sil'),
          ),
        ],
      ),
    );
  }
}
