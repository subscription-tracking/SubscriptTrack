import 'package:flutter/material.dart';

class CalendarDayCell extends StatelessWidget {
  const CalendarDayCell({
    required this.day,
    required this.isCurrentMonth,
    required this.isToday,
    required this.isSelected,
    required this.hasRenewal,
    required this.onTap,
    super.key,
  });

  final int day;
  final bool isCurrentMonth;
  final bool isToday;
  final bool isSelected;
  final bool hasRenewal;
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
      bgColor = colors.primaryContainer;
      textColor = colors.onPrimaryContainer;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              '$day',
              style: TextStyle(
                color: textColor,
                fontWeight:
                    isToday || isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (hasRenewal)
              Positioned(
                bottom: 4,
                child: Container(
                  width: 5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: isSelected ? colors.onPrimary : colors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
