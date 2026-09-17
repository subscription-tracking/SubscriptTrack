/// A per-subscription reminder rule. The value is a calendar offset from the
/// renewal/trial date; delivery is scheduled at 09:00 in the user's timezone.
class NotificationRule {
  const NotificationRule({required this.daysBefore, this.enabled = true})
      : assert(daysBefore >= 0 && daysBefore <= 30);

  final int daysBefore;
  final bool enabled;

  Map<String, dynamic> toJson() => {
        'daysBefore': daysBefore,
        'enabled': enabled,
      };

  factory NotificationRule.fromJson(Map<String, dynamic> json) =>
      NotificationRule(
        daysBefore: (json['daysBefore'] as num?)?.toInt() ?? 3,
        enabled: json['enabled'] as bool? ?? true,
      );
}
