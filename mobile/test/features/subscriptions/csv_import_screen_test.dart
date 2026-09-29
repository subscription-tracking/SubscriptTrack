import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart'
    show FlutterSecureStorage;
import 'package:flutter_test/flutter_test.dart';
import 'package:share_plus/share_plus.dart' show XFile;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/csv_import_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../../support/fake_subscription_repo.dart';

/// Seçilen dosyayı bellekten sunan sahte dosya.
final class _FakeFile extends PlatformFile {
  _FakeFile(this._bytes);

  final Uint8List _bytes;

  @override
  String get name => 'abonelikler.csv';

  @override
  Uri get uri => Uri.parse('memory:///abonelikler.csv');

  @override
  XFile get xFile => throw UnimplementedError();

  @override
  int? lengthSync() => _bytes.length;

  @override
  Future<int?> length() async => _bytes.length;

  @override
  Future<Uint8List> readAsBytes() async => _bytes;

  @override
  Stream<Uint8List> readAsByteStream() => Stream.value(_bytes);
}

class _FakePicker extends FilePickerPlatform {
  PlatformFile? result;
  int calls = 0;

  @override
  Future<PlatformFile?> pickFile({
    String? dialogTitle,
    String? initialDirectory,
    FileType type = FileType.any,
    List<String>? allowedExtensions,
    Function(FilePickerStatus)? onFileLoading,
    int compressionQuality = 0,
    AndroidOptions androidOptions = const AndroidOptions(),
    DarwinOptions darwinOptions = const DarwinOptions(),
    WindowsOptions windowsOptions = const WindowsOptions(),
    LinuxOptions linuxOptions = const LinuxOptions(),
    WebOptions webOptions = const WebOptions(),
  }) async {
    calls++;
    return result;
  }
}

PlatformFile _csv(String content) =>
    _FakeFile(Uint8List.fromList(utf8.encode(content)));

const _header =
    'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after';

/// Depolama kanallarına yazan gerçek asenkron işlemleri bekler.
Future<void> _settleAsync(WidgetTester tester) async {
  await tester.pump();
  await tester
      .runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pumpAndSettle();
}

void main() {
  late _FakePicker picker;
  late FakeSubscriptionRepo repo;
  late SubscriptionController controller;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    picker = _FakePicker();
    FilePickerPlatform.instance = picker;
    repo = FakeSubscriptionRepo();
    controller = SubscriptionController(userId: 'u1', repository: repo);
    await controller.load();
  });

  Future<void> pump(WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(420, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => CsvImportScreen(controller: controller),
              ),
            ),
            child: const Text('aç'),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('aç'));
    await tester.pumpAndSettle();
  }

  testWidgets('başlangıçta dosya seç ve örnek format seçenekleri vardır',
      (tester) async {
    await pump(tester);
    expect(find.text('CSV dosyası seç'), findsOneWidget);
    expect(find.text('Örnek format nasıl olmalı?'), findsOneWidget);
  });

  testWidgets('örnek format diyaloğu panoya kopyalayabilir', (tester) async {
    final clipboard = <String>[];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.setData') {
        clipboard.add((call.arguments as Map)['text'] as String);
      }
      return null;
    });
    addTearDown(() => TestDefaultBinaryMessengerBinding
        .instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, null));

    await pump(tester);
    await tester.tap(find.text('Örnek format nasıl olmalı?'));
    await tester.pumpAndSettle();
    expect(find.text('Örnek CSV formatı'), findsOneWidget);

    await tester.tap(find.text('Panoya kopyala'));
    await tester.pumpAndSettle();

    expect(clipboard.single, startsWith('name,amount'));
    expect(find.text('Örnek panoya kopyalandı.'), findsOneWidget);
  });

  testWidgets('örnek format diyaloğu Kapat ile kapanır', (tester) async {
    await pump(tester);
    await tester.tap(find.text('Örnek format nasıl olmalı?'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Kapat'));
    await tester.pumpAndSettle();
    expect(find.text('Örnek CSV formatı'), findsNothing);
  });

  testWidgets('dosya seçilmezse ekran değişmez', (tester) async {
    await pump(tester);
    picker.result = null;
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();
    expect(picker.calls, 1);
    expect(find.text('CSV dosyası seç'), findsOneWidget);
  });

  testWidgets('geçerli ve geçersiz satırlar ayrı raporlanır', (tester) async {
    await pump(tester);
    picker.result = _csv('$_header\n'
        'Netflix,149.99,TRY,monthly,2026-10-16,streaming,active,,,,\n'
        'Spotify,59.90,TRY,monthly,2026-10-20,music,active,,,,\n'
        ',10,TRY,monthly,2026-10-20,music,active,,,,\n');
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();

    expect(find.text('2 geçerli kayıt'), findsOneWidget);
    expect(find.text('1 satır aktarılmadı'), findsOneWidget);
    expect(find.text('Netflix'), findsOneWidget);
    expect(find.textContaining('149.99 TRY'), findsOneWidget);
  });

  testWidgets('içe aktarma abonelikleri ekler ve durumu korur', (tester) async {
    await pump(tester);
    picker.result = _csv('$_header\n'
        'Netflix,149.99,TRY,monthly,2026-10-16,streaming,active,not,Kart,,\n'
        'Eski,10,USD,yearly,2026-12-01,cloud,paused,,,,\n');
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Geçerli kayıtları içe aktar'));
    await _settleAsync(tester);

    expect(repo.createCalls, 2);
    expect(controller.allItems.map((s) => s.name), ['Netflix', 'Eski']);
    expect(controller.allItems.first.notes, 'not');
    expect(controller.allItems.last.status, SubscriptionStatus.paused);
    expect(find.text('2 abonelik içe aktarıldı.'), findsOneWidget);
    expect(find.text('CSV içe aktar'), findsNothing, reason: 'ekran kapanır');
  });

  testWidgets('geçerli kayıt yoksa içe aktarma bir şey yapmaz', (tester) async {
    await pump(tester);
    picker.result =
        _csv('$_header\n,0,TRY,monthly,2026-10-16,other,active,,,,\n');
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();
    expect(find.text('0 geçerli kayıt'), findsOneWidget);

    await tester.tap(find.text('Geçerli kayıtları içe aktar'));
    await tester.pumpAndSettle();
    expect(repo.createCalls, 0);
    expect(find.text('CSV içe aktar'), findsOneWidget);
  });

  testWidgets('"Başka dosya seç" seçimi yeniler', (tester) async {
    await pump(tester);
    picker.result =
        _csv('$_header\nA,1,TRY,monthly,2026-10-16,other,active,,,,\n');
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();
    expect(find.text('1 geçerli kayıt'), findsOneWidget);

    picker.result = _csv(
        '$_header\nA,1,TRY,monthly,2026-10-16,other,active,,,,\nB,2,TRY,monthly,2026-10-17,other,active,,,,\n');
    await tester.tap(find.text('Başka dosya seç'));
    await tester.pumpAndSettle();
    expect(find.text('2 geçerli kayıt'), findsOneWidget);
  });

  testWidgets('eksik başlık hata olarak gösterilir', (tester) async {
    await pump(tester);
    picker.result = _csv('ad,tutar\nX,1\n');
    await tester.tap(find.text('CSV dosyası seç'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Eksik başlık'), findsOneWidget);
  });
}
