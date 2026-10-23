import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

void main() {
  final fixture = jsonDecode(
    File('../testdata/flutter_expo_domain_goldens.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final schedules = fixture['timezoneSchedules'] as List<dynamic>;

  setUpAll(tzdata.initializeTimeZones);

  group('Ortak Flutter–Expo IANA 09:00 planlama', () {
    for (final schedule in schedules) {
      final item = schedule as Map<String, dynamic>;
      test('${item['day']} ${item['timeZone']} ${item['hour']}:00 → UTC', () {
        final day = DateTime.parse(item['day'] as String);
        final location = tz.getLocation(item['timeZone'] as String);
        final scheduled = tz.TZDateTime(
          location,
          day.year,
          day.month,
          day.day,
          item['hour'] as int,
        );
        expect(
            scheduled.toUtc().toIso8601String(), item['expectedUtc'] as String);
      });
    }
  });
}
