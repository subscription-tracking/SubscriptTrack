import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/navigation/app_routes.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../calendar_controller.dart';
import '../widgets/calendar_day_cell.dart';
import '../widgets/calendar_event_item.dart';
import '../../../../shared/design/app_tokens.dart';
import '../widgets/empty_day_state.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({required this.controller, super.key});

  final SubscriptionController controller;

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
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) => _buildContent(context),
    );
  }

  Widget _buildContent(BuildContext context) {
    final subscriptions = widget.controller;
    final cal = CalendarController(subscriptions: subscriptions);
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;
    final renewalDays = cal.renewalDaysInMonth(year, month);
    final trialDays = cal.trialDaysInMonth(year, month);
    final eventDays = {...renewalDays, ...trialDays};
    final selected = _selectedDay;
    final selectedEvents = selected == null
        ? const <Subscription>[]
        : [...cal.renewalsForDay(selected), ...cal.trialsForDay(selected)];

    return Column(
      children: [
        _monthHeader(context, cal.totalsByCurrencyForMonth(year, month)),
        _weekdayRow(context),
        const SizedBox(height: AppSpacing.xs),
        Padding(
          padding: AppSpacing.screen,
          child: _buildGrid(eventDays, _urgentDays(eventDays)),
        ),
        const Divider(height: 24),
        Expanded(
          child: selectedEvents.isEmpty
              ? EmptyDayState(
                  hasSelection: selected != null,
                  onAddForDay: selected == null
                      ? null
                      : () =>
                          context.push(AppRoutes.addSubscriptionOn(selected)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: selectedEvents.length,
                  itemBuilder: (_, i) => CalendarEventItem(
                    subscription: selectedEvents[i],
                    controller: subscriptions,
                    isTrial: selectedEvents[i].isTrial,
                  ),
                ),
        ),
      ],
    );
  }

  /// Bugünden itibaren 3 gün içinde olan gün(ler).
  static Set<DateTime> _urgentDays(Iterable<DateTime> days) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return {
      for (final day in days)
        if (day.difference(today).inDays >= 0 &&
            day.difference(today).inDays <= 3)
          day,
    };
  }

  Widget _monthHeader(BuildContext context, Map<String, Money> monthTotals) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0),
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
                  style: textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                for (final e in monthTotals.entries)
                  Text(
                    '${DateTimeUtils.formatCurrency(e.value.amount, symbol: e.key)} bu ay',
                    style: textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
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
    );
  }

  Widget _weekdayRow(BuildContext context) {
    final style = Theme.of(context)
        .textTheme
        .bodySmall
        ?.copyWith(fontWeight: FontWeight.w600);
    return Padding(
      padding: AppSpacing.screen,
      child: Row(
        children: [
          for (final d in const ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'])
            Expanded(child: Center(child: Text(d, style: style))),
        ],
      ),
    );
  }

  Widget _buildGrid(Set<DateTime> renewalDays, Set<DateTime> urgentDays) {
    final cells = _cells(renewalDays, urgentDays);

    return LayoutBuilder(
      builder: (context, constraints) {
        final textScale = MediaQuery.textScalerOf(context).scale(1);
        final minCellHeight = textScale > 1.2 ? 46.0 : 40.0;
        return GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: constraints.maxWidth / 7 / minCellHeight,
          children: cells,
        );
      },
    );
  }

  List<Widget> _cells(Set<DateTime> renewalDays, Set<DateTime> urgentDays) {
    final firstDay = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final startOffset = (firstDay.weekday - 1) % 7;
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final prevMonthDays =
        DateTime(_focusedMonth.year, _focusedMonth.month, 0).day;

    final now = DateTime.now();
    final todayNorm = DateTime(now.year, now.month, now.day);
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
        isUrgent: urgentDays.contains(date),
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
    return cells;
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
