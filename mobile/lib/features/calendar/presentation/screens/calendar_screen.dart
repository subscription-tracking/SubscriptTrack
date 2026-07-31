import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../calendar_controller.dart';
import '../widgets/calendar_day_cell.dart';
import '../widgets/calendar_event_item.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({required this.subscriptions, super.key});

  final SubscriptionController subscriptions;

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime _focusedMonth;
  DateTime? _selectedDay;
  late CalendarController _cal;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _focusedMonth = DateTime(now.year, now.month);
    _selectedDay = DateTime(now.year, now.month, now.day);
    _cal = CalendarController(subscriptions: widget.subscriptions);
  }

  void _prevMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month - 1);
        _selectedDay = null;
      });

  void _nextMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month + 1);
        _selectedDay = null;
      });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.subscriptions,
      builder: (context, _) {
        final renewalDays = _cal.renewalDaysInMonth(
            _focusedMonth.year, _focusedMonth.month);
        final selectedEvents = _selectedDay != null
            ? _cal.renewalsForDay(_selectedDay!)
            : [];
        final monthTotal =
            _cal.totalForMonth(_focusedMonth.year, _focusedMonth.month);

        return Column(
          children: [
            // Ay navigasyonu
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 8, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: _prevMonth,
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '${_monthName(_focusedMonth.month)} ${_focusedMonth.year}',
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                        if (monthTotal > 0)
                          Text(
                            '${DateTimeUtils.formatCurrency(monthTotal)} bu ay',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primary,
                                ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: _nextMonth,
                  ),
                ],
              ),
            ),

            // Gün başlıkları
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
                    .map((d) => Expanded(
                          child: Center(
                            child: Text(
                              d,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 4),

            // Takvim grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: _buildGrid(renewalDays),
            ),

            const Divider(height: 24),

            // Seçili güne ait yenilemeler
            Expanded(
              child: selectedEvents.isEmpty
                  ? Center(
                      child: Text(
                        _selectedDay != null
                            ? 'Bu gün yenileme yok'
                            : 'Bir gün seç',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: selectedEvents.length,
                      itemBuilder: (_, i) => CalendarEventItem(
                            subscription: selectedEvents[i],
                            controller: widget.subscriptions,
                          ),
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildGrid(Set<DateTime> renewalDays) {
    final firstDay = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    // Pazartesi = 1, Pazar = 7; grid pazartesi başlar
    final startOffset = (firstDay.weekday - 1) % 7;
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final prevMonthDays =
        DateTime(_focusedMonth.year, _focusedMonth.month, 0).day;

    final today = DateTime.now();
    final todayNorm = DateTime(today.year, today.month, today.day);

    final cells = <Widget>[];

    // Önceki aydan dolgu günleri
    for (var i = startOffset - 1; i >= 0; i--) {
      cells.add(CalendarDayCell(
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasRenewal: false,
        onTap: () {},
      ));
    }

    // Bu ayın günleri
    for (var d = 1; d <= daysInMonth; d++) {
      final date =
          DateTime(_focusedMonth.year, _focusedMonth.month, d);
      final isToday = date == todayNorm;
      final isSelected = _selectedDay != null && date == _selectedDay;
      final hasRenewal = renewalDays.contains(date);

      cells.add(CalendarDayCell(
        day: d,
        isCurrentMonth: true,
        isToday: isToday,
        isSelected: isSelected,
        hasRenewal: hasRenewal,
        onTap: () => setState(() => _selectedDay = date),
      ));
    }

    // Sonraki aydan dolgu
    final remainder = cells.length % 7;
    if (remainder != 0) {
      for (var d = 1; d <= 7 - remainder; d++) {
        cells.add(CalendarDayCell(
          day: d,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          hasRenewal: false,
          onTap: () {},
        ));
      }
    }

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1,
      children: cells,
    );
  }

  String _monthName(int month) => const [
        '', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ][month];
}
