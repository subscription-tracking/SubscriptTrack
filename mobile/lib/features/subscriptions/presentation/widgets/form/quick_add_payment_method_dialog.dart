import 'package:flutter/material.dart';

/// Formdan hızlıca yeni bir ödeme yöntemi etiketi ekleyen diyalog.
void showQuickAddPaymentMethodDialog(
  BuildContext context, {
  required void Function(String name) onAdded,
}) {
  final textController = TextEditingController();
  showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Ödeme yöntemi ekle'),
      content: TextField(
        controller: textController,
        autofocus: true,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(
          hintText: 'Örn. Garanti Bonus',
          labelText: 'Ödeme yöntemi adı',
          helperText: 'Kart numaranı veya başka hassas bilgileri yazma.',
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal')),
        FilledButton(
          onPressed: () {
            final value = textController.text.trim();
            if (value.isNotEmpty) {
              onAdded(value);
              Navigator.pop(context);
            }
          },
          child: const Text('Ekle'),
        ),
      ],
    ),
  );
}
