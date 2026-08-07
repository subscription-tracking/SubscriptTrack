import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart';
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
        title: const Text('Yeni Ödeme Yöntemi Ekle'),
        content: TextField(
          controller: textController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'Örn. Garanti Bonus ****1234',
            labelText: 'Kart / Yöntem Adı',
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
        title: const Text('Ödeme Yöntemini Düzenle'),
        content: TextField(
          controller: textController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Kart / Yöntem Adı',
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
        title: const Text('Ödeme Yöntemini Sil'),
        content: Text(
            '"$name" ödeme yöntemini silmek istediğinize emin misiniz?'),
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
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
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
            title: const Text('Ödeme Yöntemlerim'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: _showAddDialog,
                tooltip: 'Yeni ekle',
              ),
            ],
          ),
          body: methods.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.credit_card_off_outlined,
                          size: 48, color: AppColors.onSurfaceVar),
                      const SizedBox(height: 12),
                      const Text(
                        'Henüz bir ödeme yöntemi eklemediniz.',
                        style: TextStyle(color: AppColors.onSurfaceVar),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _showAddDialog,
                        icon: const Icon(Icons.add),
                        label: const Text('Ödeme Yöntemi Ekle'),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                  itemCount: methods.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final name = methods[index];
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: Theme.of(context)
                              .colorScheme
                              .outline
                              .withValues(alpha: 0.2),
                        ),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.credit_card,
                            color: AppColors.primary,
                          ),
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
                              onPressed: () => _showEditDialog(name),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  size: 20, color: AppColors.error),
                              onPressed: () => _confirmDelete(name),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: _showAddDialog,
            icon: const Icon(Icons.add),
            label: const Text('Yeni Kart / Yöntem'),
          ),
        );
      },
    );
  }
}
