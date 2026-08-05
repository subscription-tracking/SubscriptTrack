import 'package:flutter/material.dart';

import '../../core/utils/date_time_utils.dart';

/// Animated money text widget that counts up smoothly from 0 to the target amount.
class AppAnimatedMoney extends StatelessWidget {
  const AppAnimatedMoney({
    required this.amount,
    required this.symbol,
    this.style,
    this.duration = const Duration(milliseconds: 900),
    super.key,
  });

  final double amount;
  final String symbol;
  final TextStyle? style;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: amount),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, val, _) {
        return Text(
          DateTimeUtils.formatCurrency(val, symbol: symbol),
          style: style,
        );
      },
    );
  }
}
