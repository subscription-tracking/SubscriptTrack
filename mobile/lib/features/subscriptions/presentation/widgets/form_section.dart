import 'package:flutter/material.dart';

/// A bordered rounded group — used to visually cluster related fields
/// ("Servis" info, "Yenileme") the way the reference design does, instead
/// of one long flat list of fields.
class FormSection extends StatelessWidget {
  const FormSection({
    required this.children,
    required this.outlineColor,
    super.key,
  });

  final List<Widget> children;
  final Color outlineColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: outlineColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }
}
