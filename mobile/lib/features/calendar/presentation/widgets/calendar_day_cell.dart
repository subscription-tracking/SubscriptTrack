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

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    Color? bgColor;
    Color textColor = isCurrentMonth ? colors.onSurface : colors.outline;

    if (isSelected) {
      bgColor = colors.primary;
      textColor = colors.onPrimary;
    } else if (isToday) {
      bgColor = colors.primary.withValues(alpha: 0.16);
      textColor = colors.primary;
    }

    final dotColor = isSelected
        ? colors.onPrimary
        : isUrgent
            ? colors.error
            : colors.primary;

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
