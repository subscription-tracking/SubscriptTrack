import 'package:flutter/material.dart';

class CalendarDayCell extends StatelessWidget {
  const CalendarDayCell({
    required this.day,
    required this.isCurrentMonth,
    required this.isToday,
    required this.isSelected,
    required this.hasRenewal,
    required this.onTap,
    this.isUrgent = false,
    super.key,
  });

  final int day;
  final bool isCurrentMonth;
  final bool isToday;
  final bool isSelected;
  final bool hasRenewal;
  final bool isUrgent;
  final VoidCallback onTap;

  /// (arka plan, metin) renkleri: seçili > bugün > normal önceliğiyle.
  (Color?, Color) _cellColors(ColorScheme colors) {
    if (isSelected) {
      return (colors.primary, colors.onPrimary);
    }
    if (isToday) {
      return (colors.primary.withValues(alpha: 0.16), colors.primary);
    }
    return (null, isCurrentMonth ? colors.onSurface : colors.outline);
  }

  Color _dotColor(ColorScheme colors) {
    if (isSelected) {
      return colors.onPrimary;
    }
    return isUrgent ? colors.error : colors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final (bgColor, textColor) = _cellColors(colors);
    final dotColor = _dotColor(colors);

    return Semantics(
      label: '$day${hasRenewal ? ', yenileme var' : ''}',
      button: isCurrentMonth,
      selected: isSelected,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isCurrentMonth ? onTap : null,
          customBorder: const CircleBorder(),
          child: Container(
            margin: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
              border: isToday && !isSelected
                  ? Border.all(color: colors.primary.withValues(alpha: 0.4))
                  : null,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(
                  '$day',
                  style: TextStyle(
                    color: textColor,
                    fontWeight: isToday || isSelected
                        ? FontWeight.w700
                        : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
                if (hasRenewal)
                  Positioned(
                    bottom: 5,
                    child: Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: dotColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
