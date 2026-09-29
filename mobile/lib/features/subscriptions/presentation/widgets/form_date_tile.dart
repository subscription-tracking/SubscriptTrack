import 'package:flutter/material.dart';

class FormDateTile extends StatelessWidget {
  const FormDateTile({
    this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    required this.outlineColor,
    super.key,
  });

  final IconData? icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final Color outlineColor;

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: icon == null ? null : Icon(icon),
        title: Text(label),
        subtitle: Text(value),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: outlineColor),
        ),
      );
}
