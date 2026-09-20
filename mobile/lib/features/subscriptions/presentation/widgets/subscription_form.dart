import 'package:flutter/material.dart';

import '../../../settings/presentation/settings_controller.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/widgets/service_identity.dart';
import '../../../notifications/domain/notification_rule.dart';
import '../../domain/subscription_models.dart';

enum InitialPaymentStatus { paid, unpaid, deferred }

class SubscriptionFormData {
  SubscriptionFormData({
    this.name = '',
    this.amount = '',
    this.currency = 'TRY',
    this.billingCycle = BillingCycle.monthly,
    DateTime? startDate,
    DateTime? nextRenewalDate,
    this.category = SubscriptionCategory.other,
    this.notes = '',
    this.paymentMethod,
    this.isTrial = false,
    this.trialEndDate,
    this.trialPriceAfter = '',
    List<NotificationRule>? notificationRules,
    this.initialPaymentStatus = InitialPaymentStatus.unpaid,
    DateTime? initialPaymentDate,
    this.deferredPaymentDate,
  })  : startDate = startDate ?? DateTime.now(),
        initialPaymentDate = initialPaymentDate ?? DateTime.now(),
        nextRenewalDate =
            nextRenewalDate ?? _defaultNextRenewalDate(startDate, billingCycle),
        notificationRules =
            notificationRules ?? [const NotificationRule(daysBefore: 3)];

  static DateTime _defaultNextRenewalDate(
    DateTime? startDate,
    BillingCycle billingCycle,
  ) {
    final start = startDate ?? DateTime.now();
    return DateTimeUtils.nextOccurrenceOnOrAfter(
      start,
      billingCycle.key,
      DateTime.now(),
      originalAnchor: start,
    );
  }

  String name;
  String amount;
  String currency;
  BillingCycle billingCycle;
  DateTime startDate;
  DateTime nextRenewalDate;
  SubscriptionCategory category;
  String notes;
  String? paymentMethod;
  bool isTrial;
  DateTime? trialEndDate;
  String trialPriceAfter;
  List<NotificationRule> notificationRules;
  InitialPaymentStatus initialPaymentStatus;
  DateTime initialPaymentDate;
  DateTime? deferredPaymentDate;

  /// Başlangıç tarihi veya fatura döngüsü değiştiğinde sonraki yenilemeyi
  /// yeniden hesaplar. Hesap UI'dan bağımsız tutulur; hem tarih seçici hem de
  /// otomatik test aynı domain kuralını kullanır.
  void recalculateNextRenewal({DateTime? now}) {
    nextRenewalDate = DateTimeUtils.nextOccurrenceOnOrAfter(
      startDate,
      billingCycle.key,
      now ?? DateTime.now(),
      originalAnchor: startDate,
    );
  }
}

class SubscriptionForm extends StatefulWidget {
  const SubscriptionForm({
    required this.formKey,
    required this.data,
    super.key,
  });

  final GlobalKey<FormState> formKey;
  final SubscriptionFormData data;

  @override
  State<SubscriptionForm> createState() => _SubscriptionFormState();
}

class _SubscriptionFormState extends State<SubscriptionForm> {
  late final TextEditingController _name;
  late final TextEditingController _amount;
  late final TextEditingController _notes;
  bool _showDetails = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.data.name);
    _amount = TextEditingController(text: widget.data.amount);
    _notes = TextEditingController(text: widget.data.notes);
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  static const _currencyOptions = [
    ('TRY', '₺'),
    ('USD', '\$'),
    ('EUR', '€'),
    ('GBP', '£'),
  ];

  void _autoSetNextRenewal() {
    // Başlangıç bugün/gelecekteyse ilk yenileme == başlangıç tarihinin kendisi;
    // geçmişteyse kaçırılan periyotlar atlanıp bugünden sonraki en yakın
    // yenilemeye ulaşılır (nextOccurrenceOnOrAfter tek noktadan ikisini de
    // karşılar — bkz. DateTimeUtils).
    widget.data.recalculateNextRenewal();
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.data.startDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        widget.data.startDate = picked;
        _autoSetNextRenewal();
      });
    }
  }

  Future<void> _pickNextRenewalDate() async {
    final earliest = widget.data.startDate.isAfter(DateTime.now())
        ? widget.data.startDate
        : DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.data.nextRenewalDate.isBefore(earliest)
          ? earliest
          : widget.data.nextRenewalDate,
      firstDate: earliest,
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) setState(() => widget.data.nextRenewalDate = picked);
  }

  Future<void> _pickInitialPaymentDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.data.initialPaymentDate,
      firstDate: widget.data.startDate,
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) setState(() => widget.data.initialPaymentDate = picked);
  }

  Future<void> _pickDeferredPaymentDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate:
          widget.data.deferredPaymentDate ?? widget.data.nextRenewalDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) {
      setState(() => widget.data.deferredPaymentDate = picked);
    }
  }

  Future<void> _pickTrialEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.data.trialEndDate ?? widget.data.nextRenewalDate,
      firstDate: widget.data.startDate,
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) setState(() => widget.data.trialEndDate = picked);
  }

  void _showQuickAddPaymentMethod() {
    final textController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yeni Ödeme Yöntemi Ekle'),
        content: TextField(
          controller: textController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'Örn. Garanti Bonus ****1234',
            labelText: 'Kart / Yöntem Adı',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () {
              final val = textController.text.trim();
              if (val.isNotEmpty) {
                SettingsController.instance.addPaymentMethod(val);
                setState(() => widget.data.paymentMethod = val);
                Navigator.pop(context);
              }
            },
            child: const Text('Ekle'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

  static const _reminderPresetDays = [1, 3, 7];

  static const _popularPresets = <(String, SubscriptionCategory)>[
    // Streaming
    ('Netflix', SubscriptionCategory.streaming),
    ('Disney+', SubscriptionCategory.streaming),
    ('YouTube Premium', SubscriptionCategory.streaming),
    ('BluTV', SubscriptionCategory.streaming),
    ('Exxen', SubscriptionCategory.streaming),
    ('Amazon Prime', SubscriptionCategory.streaming),
    ('Apple TV+', SubscriptionCategory.streaming),
    ('MUBI', SubscriptionCategory.streaming),
    // Music
    ('Spotify', SubscriptionCategory.music),
    ('Apple Music', SubscriptionCategory.music),
    ('YouTube Music', SubscriptionCategory.music),
    ('Tidal', SubscriptionCategory.music),
    ('Deezer', SubscriptionCategory.music),
    // AI & Productivity
    ('ChatGPT', SubscriptionCategory.software),
    ('Claude', SubscriptionCategory.software),
    ('Notion', SubscriptionCategory.software),
    ('Slack', SubscriptionCategory.software),
    // Creative
    ('Figma', SubscriptionCategory.software),
    ('Adobe', SubscriptionCategory.software),
    ('Canva', SubscriptionCategory.software),
    // Cloud
    ('iCloud', SubscriptionCategory.cloud),
    ('Google One', SubscriptionCategory.cloud),
    ('Dropbox', SubscriptionCategory.cloud),
    // Gaming
    ('Xbox Game Pass', SubscriptionCategory.gaming),
    ('PlayStation Plus', SubscriptionCategory.gaming),
    ('EA Play', SubscriptionCategory.gaming),
  ];

  @override
  Widget build(BuildContext context) {
    final outlineColor =
        Theme.of(context).colorScheme.outline.withValues(alpha: .5);
    final paymentMethods = SettingsController.instance.paymentMethods;
    final currentName = widget.data.name.trim().toLowerCase();

    return Form(
      key: widget.formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _FormSection(
            outlineColor: outlineColor,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Popüler servisler',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: .6),
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                ),
              ),
              SizedBox(
                height: 56,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  itemCount: _popularPresets.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final preset = _popularPresets[index];
                    final isSelected =
                        currentName == preset.$1.trim().toLowerCase();
                    return ChoiceChip(
                      avatar: ServiceIdentity(
                        name: preset.$1,
                        category: preset.$2,
                        size: 26,
                      ),
                      label: Text(
                        preset.$1,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : outlineColor,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      selected: isSelected,
                      showCheckmark: false,
                      onSelected: (_) {
                        setState(() {
                          _name.text = preset.$1;
                          widget.data.name = preset.$1;
                          widget.data.category = preset.$2;
                        });
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: 'Servis',
                  hintText: 'Örn. Netflix',
                  // S45: ad yazılırken canlı marka rengi/ikon önizlemesi —
                  // ServiceIdentity'nin detay ekranında zaten kullanılan aynı
                  // marka eşleşmesi.
                  prefixIcon: Padding(
                    padding: const EdgeInsets.all(8),
                    child: ServiceIdentity(
                      name: widget.data.name,
                      category: widget.data.category,
                      size: 28,
                    ),
                  ),
                  suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded),
                ),
                onChanged: (v) => setState(() => widget.data.name = v),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Ad boş olamaz' : null,
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 110,
                    child: DropdownButtonFormField<String>(
                      initialValue: widget.data.currency,
                      decoration:
                          const InputDecoration(labelText: 'Para birimi'),
                      items: _currencyOptions
                          .map((c) => DropdownMenuItem(
                                value: c.$1,
                                child: Text('${c.$2} ${c.$1}'),
                              ))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => widget.data.currency = v ?? 'TRY'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _amount,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(labelText: 'Tutar'),
                      onChanged: (v) => widget.data.amount = v,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Tutar gir';
                        final n = double.tryParse(v.replaceAll(',', '.'));
                        if (n == null || n <= 0) return 'Geçerli tutar gir';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<BillingCycle>(
                initialValue: widget.data.billingCycle,
                decoration: const InputDecoration(labelText: 'Ödeme döngüsü'),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                items: BillingCycle.values
                    .map(
                        (c) => DropdownMenuItem(value: c, child: Text(c.label)))
                    .toList(),
                onChanged: (v) => setState(() {
                  widget.data.billingCycle = v ?? BillingCycle.monthly;
                  _autoSetNextRenewal();
                }),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _FormSection(
            outlineColor: outlineColor,
            children: [
              Text('Yenileme', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 12),
              _DateTile(
                label: 'Sonraki ödeme',
                value: _formatDate(widget.data.nextRenewalDate),
                onTap: _pickNextRenewalDate,
                outlineColor: outlineColor,
              ),
              const SizedBox(height: 16),
              Text('Hatırlat', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _reminderPresetDays.map((days) {
                  final selected = widget.data.notificationRules
                      .any((r) => r.daysBefore == days);
                  return FilterChip(
                    label: Text('$days gün'),
                    selected: selected,
                    showCheckmark: false,
                    onSelected: (_) => setState(() {
                      widget.data.notificationRules = [
                        NotificationRule(daysBefore: days),
                      ];
                    }),
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.tune_rounded),
            title: const Text('Diğer ayrıntılar'),
            subtitle: const Text('Kategori, deneme, kart ve not'),
            trailing:
                Icon(_showDetails ? Icons.expand_less : Icons.chevron_right),
            onTap: () => setState(() => _showDetails = !_showDetails),
          ),
          if (_showDetails) ...[
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Ücretsiz deneme'),
              subtitle: const Text('Deneme bitişinde ücretli döneme geçer'),
              value: widget.data.isTrial,
              onChanged: (value) => setState(() => widget.data.isTrial = value),
            ),
            if (widget.data.isTrial) ...[
              _DateTile(
                icon: Icons.hourglass_bottom_outlined,
                label: 'Deneme bitiş tarihi',
                value: widget.data.trialEndDate == null
                    ? 'Tarih seç'
                    : _formatDate(widget.data.trialEndDate!),
                onTap: _pickTrialEndDate,
                outlineColor: outlineColor,
              ),
              const SizedBox(height: 12),
              TextFormField(
                initialValue: widget.data.trialPriceAfter,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Trial sonrası fiyat',
                  prefixIcon: Icon(Icons.payments_outlined),
                ),
                onChanged: (v) => widget.data.trialPriceAfter = v,
                validator: (v) {
                  if (!widget.data.isTrial) return null;
                  if (widget.data.trialEndDate == null) {
                    return 'Trial bitiş tarihi seç';
                  }
                  final n = double.tryParse((v ?? '').replaceAll(',', '.'));
                  return n == null || n <= 0
                      ? 'Geçerli trial sonrası fiyatı gir'
                      : null;
                },
              ),
            ],
            const SizedBox(height: 16),
            DropdownButtonFormField<SubscriptionCategory>(
              initialValue: widget.data.category,
              decoration: const InputDecoration(
                labelText: 'Kategori',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: SubscriptionCategory.values
                  .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
                  .toList(),
              onChanged: (v) => setState(
                  () => widget.data.category = v ?? SubscriptionCategory.other),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String?>(
              initialValue: paymentMethods.contains(widget.data.paymentMethod)
                  ? widget.data.paymentMethod
                  : null,
              decoration: const InputDecoration(
                labelText: 'Ödeme Yöntemi / Kart (opsiyonel)',
                prefixIcon: Icon(Icons.credit_card_outlined),
              ),
              items: [
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Seçilmedi'),
                ),
                ...paymentMethods.map(
                  (pm) => DropdownMenuItem<String?>(
                    value: pm,
                    child: Text(pm),
                  ),
                ),
                const DropdownMenuItem<String?>(
                  value: '__ADD_NEW__',
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add, size: 18),
                      SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          '+ Yeni Kart',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              onChanged: (v) {
                if (v == '__ADD_NEW__') {
                  _showQuickAddPaymentMethod();
                } else {
                  setState(() => widget.data.paymentMethod = v);
                }
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<InitialPaymentStatus>(
              initialValue: widget.data.initialPaymentStatus,
              decoration: const InputDecoration(
                labelText: 'İlk ödeme durumu',
                prefixIcon: Icon(Icons.fact_check_outlined),
              ),
              items: const [
                DropdownMenuItem(
                    value: InitialPaymentStatus.paid, child: Text('Ödendi')),
                DropdownMenuItem(
                    value: InitialPaymentStatus.unpaid,
                    child: Text('Ödenmedi')),
                DropdownMenuItem(
                    value: InitialPaymentStatus.deferred,
                    child: Text('Ertelendi')),
              ],
              onChanged: (v) => setState(() => widget.data
                  .initialPaymentStatus = v ?? InitialPaymentStatus.unpaid),
            ),
            const SizedBox(height: 8),
            if (widget.data.initialPaymentStatus == InitialPaymentStatus.paid)
              _DateTile(
                icon: Icons.event_available_outlined,
                label: 'Ödeme tarihi',
                value: _formatDate(widget.data.initialPaymentDate),
                onTap: _pickInitialPaymentDate,
                outlineColor: outlineColor,
              ),
            if (widget.data.initialPaymentStatus ==
                InitialPaymentStatus.deferred)
              _DateTile(
                icon: Icons.event_repeat_outlined,
                label: 'Ertelenen ödeme tarihi',
                value: widget.data.deferredPaymentDate == null
                    ? 'Tarih seç'
                    : _formatDate(widget.data.deferredPaymentDate!),
                onTap: _pickDeferredPaymentDate,
                outlineColor: outlineColor,
              ),
          ],
          const SizedBox(height: 16),
          _DateTile(
            icon: Icons.play_arrow_outlined,
            label: 'Başlangıç tarihi',
            value: _formatDate(widget.data.startDate),
            onTap: _pickStartDate,
            outlineColor: outlineColor,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _notes,
            maxLines: 3,
            maxLength: 500,
            textInputAction: TextInputAction.done,
            decoration: const InputDecoration(
              labelText: 'Notlar (opsiyonel)',
              prefixIcon: Icon(Icons.notes),
              alignLabelWithHint: true,
            ),
            onChanged: (v) => widget.data.notes = v,
          ),
        ],
      ),
    );
  }
}

/// A bordered rounded group — used to visually cluster related fields
/// ("Servis" info, "Yenileme") the way the reference design does, instead
/// of one long flat list of fields.
class _FormSection extends StatelessWidget {
  const _FormSection({required this.children, required this.outlineColor});

  final List<Widget> children;
  final Color outlineColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: outlineColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }
}

class _DateTile extends StatelessWidget {
  const _DateTile({
    this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    required this.outlineColor,
  });

  final IconData? icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final Color outlineColor;

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: icon == null ? null : Icon(icon),
        title: Text(label),
        subtitle: Text(value),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: outlineColor),
        ),
      );
}
