import 'package:flutter/material.dart';

import '../../../settings/presentation/settings_controller.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/widgets/service_identity.dart';
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
    List<int>? reminderDays,
    this.initialPaymentStatus = InitialPaymentStatus.unpaid,
    DateTime? initialPaymentDate,
    this.deferredPaymentDate,
  })  : startDate = startDate ?? DateTime.now(),
        initialPaymentDate = initialPaymentDate ?? DateTime.now(),
        nextRenewalDate =
            nextRenewalDate ?? DateTime.now().add(const Duration(days: 30)),
        reminderDays = reminderDays ?? [3];

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
  List<int> reminderDays;
  InitialPaymentStatus initialPaymentStatus;
  DateTime initialPaymentDate;
  DateTime? deferredPaymentDate;
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
    final s = widget.data.startDate;
    // Başlangıç bugün/gelecekteyse ilk yenileme == başlangıç tarihinin kendisi;
    // geçmişteyse kaçırılan periyotlar atlanıp bugünden sonraki en yakın
    // yenilemeye ulaşılır (nextOccurrenceOnOrAfter tek noktadan ikisini de
    // karşılar — bkz. DateTimeUtils).
    widget.data.nextRenewalDate = DateTimeUtils.nextOccurrenceOnOrAfter(
      s,
      widget.data.billingCycle.key,
      DateTime.now(),
    );
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
    if (picked != null)
      setState(() => widget.data.deferredPaymentDate = picked);
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
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'Popüler Servisler',
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
            height: 42,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 2),
              itemCount: _popularPresets.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final preset = _popularPresets[index];
                final isSelected =
                    currentName == preset.$1.trim().toLowerCase();
                return ChoiceChip(
                  avatar: ServiceIdentity(
                    name: preset.$1,
                    category: preset.$2,
                    size: 22,
                  ),
                  label: Text(
                    preset.$1,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
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
            decoration: const InputDecoration(
              labelText: 'Abonelik adı',
              hintText: 'Örn. Netflix',
              prefixIcon: Icon(Icons.label_outline),
            ),
            onChanged: (v) => widget.data.name = v,
            validator: (v) =>
                v == null || v.trim().isEmpty ? 'Ad boş olamaz' : null,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 80,
                child: DropdownButtonFormField<String>(
                  initialValue: widget.data.currency,
                  decoration: const InputDecoration(labelText: 'Para'),
                  items: _currencyOptions
                      .map((c) => DropdownMenuItem(
                            value: c.$1,
                            child: Text(c.$2),
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
                  decoration: const InputDecoration(
                    labelText: 'Tutar',
                    prefixIcon: Icon(Icons.payments_outlined),
                  ),
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
            decoration: const InputDecoration(
              labelText: 'Ödeme döngüsü',
              prefixIcon: Icon(Icons.repeat),
            ),
            items: BillingCycle.values
                .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
                .toList(),
            onChanged: (v) => setState(() {
              widget.data.billingCycle = v ?? BillingCycle.monthly;
              _autoSetNextRenewal();
            }),
          ),
          const SizedBox(height: 8),
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
                  value: InitialPaymentStatus.unpaid, child: Text('Ödenmedi')),
              DropdownMenuItem(
                  value: InitialPaymentStatus.deferred,
                  child: Text('Ertelendi')),
            ],
            onChanged: (v) => setState(() => widget.data.initialPaymentStatus =
                v ?? InitialPaymentStatus.unpaid),
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
          if (widget.data.initialPaymentStatus == InitialPaymentStatus.deferred)
            _DateTile(
              icon: Icons.event_repeat_outlined,
              label: 'Ertelenen ödeme tarihi',
              value: widget.data.deferredPaymentDate == null
                  ? 'Tarih seç'
                  : _formatDate(widget.data.deferredPaymentDate!),
              onTap: _pickDeferredPaymentDate,
              outlineColor: outlineColor,
            ),
          const SizedBox(height: 16),
          _DateTile(
            icon: Icons.play_arrow_outlined,
            label: 'Başlangıç tarihi',
            value: _formatDate(widget.data.startDate),
            onTap: _pickStartDate,
            outlineColor: outlineColor,
          ),
          const SizedBox(height: 12),
          _DateTile(
            icon: Icons.calendar_today_outlined,
            label: 'Sonraki yenileme',
            value: _formatDate(widget.data.nextRenewalDate),
            onTap: _pickNextRenewalDate,
            outlineColor: outlineColor,
          ),
          const SizedBox(height: 16),
          Text('Hatırlatmalar', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            children: [0, 1, 3, 7]
                .map((days) => FilterChip(
                      label: Text(days == 0 ? 'Bugün' : '$days gün önce'),
                      selected: widget.data.reminderDays.contains(days),
                      onSelected: (selected) => setState(() {
                        if (selected) {
                          widget.data.reminderDays.add(days);
                        } else if (widget.data.reminderDays.length > 1) {
                          widget.data.reminderDays.remove(days);
                        }
                      }),
                    ))
                .toList(),
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

class _DateTile extends StatelessWidget {
  const _DateTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    required this.outlineColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final Color outlineColor;

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(icon),
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
