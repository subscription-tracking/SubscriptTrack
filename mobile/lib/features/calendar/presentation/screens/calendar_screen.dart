import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../calendar_controller.dart';
import '../widgets/calendar_day_cell.dart';
import '../widgets/calendar_event_item.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime _focusedMonth;
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _focusedMonth = DateTime(now.year, now.month);
    _selectedDay = DateTime(now.year, now.month, now.day);
  }

  void _prevMonth() => setState(() {
        _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1);
        _selectedDay = null;
      });

  void _nextMonth() => setState(() {
        _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1);
        _selectedDay = null;
      });

  @override
  Widget build(BuildContext context) {
    final subscriptions = context.watch<SubscriptionController>();
    final cal = CalendarController(subscriptions: subscriptions);
    final renewalDays =
        cal.renewalDaysInMonth(_focusedMonth.year, _focusedMonth.month);
    final selectedEvents =
        _selectedDay != null ? cal.renewalsForDay(_selectedDay!) : <dynamic>[];
    final monthTotals =
        cal.totalsByCurrencyForMonth(_focusedMonth.year, _focusedMonth.month);

    return Column(
      children: [
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
                    if (monthTotals.isNotEmpty)
                      ...monthTotals.entries.map(
                        (e) => Text(
                          '${DateTimeUtils.formatCurrency(e.value, symbol: e.key)} bu ay',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color:
                                        Theme.of(context).colorScheme.primary,
                                  ),
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
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: _buildGrid(renewalDays),
        ),
        const Divider(height: 24),
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
                    controller: subscriptions,
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildGrid(Set<DateTime> renewalDays) {
    final firstDay = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final startOffset = (firstDay.weekday - 1) % 7;
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final prevMonthDays =
        DateTime(_focusedMonth.year, _focusedMonth.month, 0).day;

    final today = DateTime.now();
    final todayNorm = DateTime(today.year, today.month, today.day);
    final cells = <Widget>[];

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

    for (var d = 1; d <= daysInMonth; d++) {
      final date = DateTime(_focusedMonth.year, _focusedMonth.month, d);
      cells.add(CalendarDayCell(
        day: d,
        isCurrentMonth: true,
        isToday: date == todayNorm,
        isSelected: _selectedDay != null && date == _selectedDay,
        hasRenewal: renewalDays.contains(date),
        onTap: () => setState(() => _selectedDay = date),
      ));
    }

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
        '',
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık'
      ][month];
}
