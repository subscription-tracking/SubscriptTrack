import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

void main() {
  group('SubscriptionFormData varsayılan yenileme tarihi', () {
    test('başlangıç tarihi verildiğinde tek tarih kuralını kullanır', () {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, now.day + 7);
      final data = SubscriptionFormData(startDate: start);

      expect(data.nextRenewalDate, start);
    });
  });

  group('SubscriptionForm validasyon', () {
    late GlobalKey<FormState> formKey;
    late SubscriptionFormData data;

    setUp(() {
      formKey = GlobalKey<FormState>();
      data = SubscriptionFormData();
    });

    Widget buildForm() => MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: SubscriptionForm(formKey: formKey, data: data),
            ),
          ),
        );

    testWidgets('boş ad ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Ad boş olamaz'), findsOneWidget);
    });

    testWidgets('boş tutar ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Tutar gir'), findsOneWidget);
    });

    testWidgets('sıfır tutar ile form geçersiz', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '0');
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('Geçerli tutar gir'), findsOneWidget);
    });

    testWidgets('geçerli ad ve tutar ile form valid', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '49.90');
      final valid = formKey.currentState!.validate();
      await tester.pump();
      expect(valid, isTrue);
    });

    testWidgets('virgüllü tutar kabul edilir', (tester) async {
      await tester.pumpWidget(buildForm());
      await tester.enterText(find.byType(TextFormField).first, 'Spotify');
      await tester.enterText(find.byType(TextFormField).at(1), '29,99');
      final valid = formKey.currentState!.validate();
      await tester.pump();
      expect(valid, isTrue);
    });
  });
}
