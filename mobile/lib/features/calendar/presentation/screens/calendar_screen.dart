import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/presentation/screens/add_subscription_screen.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../calendar_controller.dart';
import '../widgets/calendar_day_cell.dart';
import '../widgets/calendar_event_item.dart';
import '../../../../shared/design/app_tokens.dart';

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
    final renewalDays =
        cal.renewalDaysInMonth(_focusedMonth.year, _focusedMonth.month);
    final trialDays =
        cal.trialDaysInMonth(_focusedMonth.year, _focusedMonth.month);
    final selectedEvents = _selectedDay != null
        ? [
            ...cal.renewalsForDay(_selectedDay!),
            ...cal.trialsForDay(_selectedDay!)
          ]
        : <dynamic>[];
    final monthTotals =
        cal.totalsByCurrencyForMonth(_focusedMonth.year, _focusedMonth.month);
    final today = DateTime.now();
    final urgentDays = <DateTime>{};
    for (final day in {...renewalDays, ...trialDays}) {
      final diff =
          day.difference(DateTime(today.year, today.month, today.day)).inDays;
      if (diff >= 0 && diff <= 3) urgentDays.add(day);
    }

    return Column(
      children: [
        Padding(
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
                      style: Theme.of(context).textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                    if (monthTotals.isNotEmpty)
                      ...monthTotals.entries.map(
                        (e) => Text(
                          '${DateTimeUtils.formatCurrency(e.value.amount, symbol: e.key)} bu ay',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
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
          padding: AppSpacing.screen,
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
        const SizedBox(height: AppSpacing.xs),
        Padding(
          padding: AppSpacing.screen,
          child: _buildGrid({...renewalDays, ...trialDays}, urgentDays),
        ),
        const Divider(height: 24),
        Expanded(
          child: selectedEvents.isEmpty
              ? _EmptyDayState(
                  hasSelection: _selectedDay != null,
                  onAddForDay: _selectedDay == null
                      ? null
                      : () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => AddSubscriptionScreen(
                                controller: subscriptions,
                                initialStartDate: _selectedDay,
                              ),
                            ),
                          ),
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

  Widget _buildGrid(Set<DateTime> renewalDays, Set<DateTime> urgentDays) {
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

class _EmptyDayState extends StatelessWidget {
  const _EmptyDayState({required this.hasSelection, this.onAddForDay});
  final bool hasSelection;
  final VoidCallback? onAddForDay;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.primary.withValues(alpha: 0.08),
              border: Border.all(
                  color: cs.primary.withValues(alpha: 0.18), width: 0.5),
            ),
            child: Icon(
              hasSelection
                  ? Icons.check_circle_outline_rounded
                  : Icons.touch_app_rounded,
              size: 24,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            hasSelection ? 'Bu gün yenileme yok' : 'Bir gün seç',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
          ),
          if (onAddForDay != null) ...[
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: onAddForDay,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Bu güne abonelik ekle'),
            ),
          ],
        ],
      ),
    );
  }
}
