import 'package:flutter/material.dart';

/// Yüklenirken ilerleme göstergesi çıkaran ana eylem düğmesi ([tall]: 52 px yükseklik).
class LoadingFilledButton extends StatelessWidget {
  const LoadingFilledButton({
    required this.label,
    required this.loading,
    required this.onPressed,
    this.tall = true,
    super.key,
  });

  final String label;
  final bool loading;
  final VoidCallback? onPressed;
  final bool tall;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: loading ? null : onPressed,
      style: tall
          ? FilledButton.styleFrom(minimumSize: const Size.fromHeight(52))
          : null,
      child: loading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            )
          : Text(label),
    );
  }
}
