/// A per-subscription reminder rule. The value is a calendar offset from the
/// renewal/trial date; delivery is scheduled at 09:00 in the user's timezone.
class NotificationRule {
  const NotificationRule({required this.daysBefore, this.enabled = true})
      : assert(daysBefore >= 0 && daysBefore <= 30);

  final int daysBefore;
  final bool enabled;

  NotificationRule copyWith({int? daysBefore, bool? enabled}) =>
      NotificationRule(
        daysBefore: daysBefore ?? this.daysBefore,
        enabled: enabled ?? this.enabled,
      );

  Map<String, dynamic> toJson() => {
        'daysBefore': daysBefore,
        'enabled': enabled,
      };

  factory NotificationRule.fromJson(Map<String, dynamic> json) =>
      NotificationRule(
        daysBefore: (json['daysBefore'] as num?)?.toInt() ?? 3,
        enabled: json['enabled'] as bool? ?? true,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationRule &&
          other.daysBefore == daysBefore &&
          other.enabled == enabled;

  @override
  int get hashCode => Object.hash(daysBefore, enabled);
}
