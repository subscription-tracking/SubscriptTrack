import '../../../core/domain/money.dart';
import '../../savings/data/savings_repository.dart';
import '../../stats/data/payment_events_repository.dart';

/// Kullanıcının manuel ödeme kayıtları ve tasarruf olaylarının bellek içi
/// deposu. Hata yönetimi ve bildirim çağıran controller'a bırakılır.
class PaymentHistoryStore {
  PaymentHistoryStore({
    required String userId,
    SavingsRepository? savings,
    PaymentEventsRepository? payments,
  })  : _userId = userId,
        _savings = savings ?? SavingsRepository(),
        _payments = payments ?? PaymentEventsRepository();

  final String _userId;
  final SavingsRepository _savings;
  final PaymentEventsRepository _payments;

  List<SavingsEvent> _savingsEvents = [];
  List<PaymentEvent> _paymentEvents = [];

  List<SavingsEvent> get savingsEvents => List.unmodifiable(_savingsEvents);
  List<PaymentEvent> get paymentEvents => List.unmodifiable(_paymentEvents);

  /// İkincil veri setleri, biri yüklenemediğinde ana ekranı çevrimdışı moda
  /// zorlamasın diye hatada boş listeye düşer.
  Future<void> load() async {
    final results = await Future.wait<Object>([
      _savings.fetch(_userId).catchError((_) => <SavingsEvent>[]),
      _payments.fetch(_userId).catchError((_) => <PaymentEvent>[]),
    ]);
    _savingsEvents = results[0] as List<SavingsEvent>;
    _paymentEvents = results[1] as List<PaymentEvent>;
  }

  Future<void> record({
    required String subscriptionId,
    required Money amount,
    required String currency,
    required DateTime paidAt,
  }) async {
    final event = await _payments.record(
      userId: _userId,
      subscriptionId: subscriptionId,
      amount: amount,
      currency: currency,
      paidAt: paidAt,
    );
    _paymentEvents = [event, ..._paymentEvents];
  }

  Future<void> remove(String id) async {
    await _payments.delete(userId: _userId, id: id);
    _paymentEvents = _paymentEvents.where((e) => e.id != id).toList();
  }

  Future<void> update(PaymentEvent event) async {
    final updated = await _payments.update(userId: _userId, event: event);
    _paymentEvents =
        _paymentEvents.map((e) => e.id == updated.id ? updated : e).toList();
  }

  Future<void> recordSavings({
    required String subscriptionId,
    required String eventType,
    required Money monthlyAmount,
    required String currency,
  }) =>
      _savings.record(
        userId: _userId,
        subscriptionId: subscriptionId,
        eventType: eventType,
        monthlyAmount: monthlyAmount,
        annualAmount: monthlyAmount * 12,
        currency: currency,
      );

  Map<String, Money> get savingsByCurrency {
    final result = <String, Money>{};
    for (final event in _savingsEvents) {
      final current = result[event.currency];
      result[event.currency] =
          current == null ? event.annualAmount : current + event.annualAmount;
    }
    return result;
  }
}
