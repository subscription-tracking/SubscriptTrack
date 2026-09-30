import 'package:flutter/material.dart';

import '../settings_controller.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({required this.controller, super.key});

  final SettingsController controller;

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  void _showAddDialog() {
    final textController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yeni ödeme yöntemi ekle'),
        content: TextField(
          controller: textController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'Örn. Garanti Bonus ****1234',
            labelText: 'Ödeme yöntemi adı',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () {
              if (textController.text.trim().isNotEmpty) {
                widget.controller.addPaymentMethod(textController.text);
                Navigator.pop(context);
              }
            },
            child: const Text('Ekle'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(String oldName) {
    final textController = TextEditingController(text: oldName);
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ödeme yöntemini düzenle'),
        content: TextField(
          controller: textController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Ödeme yöntemi adı',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () {
              if (textController.text.trim().isNotEmpty) {
                widget.controller
                    .renamePaymentMethod(oldName, textController.text);
                Navigator.pop(context);
              }
            },
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(String name) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ödeme yöntemini sil'),
        content: Text('"$name" ödeme yöntemini silmek istediğine emin misin?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              widget.controller.removePaymentMethod(name);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final methods = widget.controller.paymentMethods;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Ödeme yöntemlerim'),
          ),
          body: Column(children: [
            _SyncErrorBanner(controller: widget.controller),
            Expanded(
              child: methods.isEmpty
                  ? _EmptyMethods(onAdd: _showAddDialog)
                  : _methodList(methods),
            ),
          ]),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: _showAddDialog,
            icon: const Icon(Icons.add),
            label: const Text('Yeni ödeme yöntemi'),
          ),
        );
      },
    );
  }

  Widget _methodList(List<String> methods) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      itemCount: methods.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final name = methods[index];
        return _MethodCard(
          name: name,
          onEdit: () => _showEditDialog(name),
          onDelete: () => _confirmDelete(name),
        );
      },
    );
  }
}

class _EmptyMethods extends StatelessWidget {
  const _EmptyMethods({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.credit_card_off_outlined, size: 48, color: muted),
          const SizedBox(height: 12),
          Text(
            'Henüz bir ödeme yöntemi eklemedin.',
            style: TextStyle(color: muted),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.add),
            label: const Text('Ödeme yöntemi ekle'),
          ),
        ],
      ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.name,
    required this.onEdit,
    required this.onDelete,
  });

  final String name;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: cs.outline.withValues(alpha: 0.2)),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(Icons.credit_card, color: cs.primary),
        ),
        title: Text(
          name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 20),
              tooltip: '$name düzenle',
              onPressed: onEdit,
            ),
            IconButton(
              icon: Icon(Icons.delete_outline, size: 20, color: cs.error),
              tooltip: '$name sil',
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _SyncErrorBanner extends StatelessWidget {
  const _SyncErrorBanner({required this.controller});
  final SettingsController controller;

  @override
  Widget build(BuildContext context) {
    final error = controller.paymentMethodsSyncError;
    if (error == null) return const SizedBox.shrink();
    return MaterialBanner(
      content: Text('$error Yerel değişikliğin korunuyor.'),
      actions: [
        TextButton(
          onPressed: controller.retryPaymentMethodsSync,
          child: const Text('Tekrar dene'),
        ),
      ],
    );
  }
}
