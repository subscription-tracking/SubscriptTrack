import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

void main() {
  group('SubscriptionStatus geçiş kuralları (S9)', () {
    // active →
    test(
        'active → paused geçer',
        () => expect(
            SubscriptionStatus.active
                .canTransitionTo(SubscriptionStatus.paused),
            isTrue));
    test(
        'active → cancelled geçer',
        () => expect(
            SubscriptionStatus.active
                .canTransitionTo(SubscriptionStatus.cancelled),
            isTrue));
    test(
        'active → archived geçer',
        () => expect(
            SubscriptionStatus.active
                .canTransitionTo(SubscriptionStatus.archived),
            isTrue));
    test(
        'active → active geçmez',
        () => expect(
            SubscriptionStatus.active
                .canTransitionTo(SubscriptionStatus.active),
            isFalse));

    // paused →
    test(
        'paused → active geçer (resume)',
        () => expect(
            SubscriptionStatus.paused
                .canTransitionTo(SubscriptionStatus.active),
            isTrue));
    test(
        'paused → cancelled geçer',
        () => expect(
            SubscriptionStatus.paused
                .canTransitionTo(SubscriptionStatus.cancelled),
            isTrue));
    test(
        'paused → archived geçer',
        () => expect(
            SubscriptionStatus.paused
                .canTransitionTo(SubscriptionStatus.archived),
            isTrue));
    test(
        'paused → paused geçmez',
        () => expect(
            SubscriptionStatus.paused
                .canTransitionTo(SubscriptionStatus.paused),
            isFalse));

    // cancelled →
    test(
        'cancelled → archived geçer',
        () => expect(
            SubscriptionStatus.cancelled
                .canTransitionTo(SubscriptionStatus.archived),
            isTrue));
    test(
        'cancelled → active geçmez',
        () => expect(
            SubscriptionStatus.cancelled
                .canTransitionTo(SubscriptionStatus.active),
            isFalse));
    test(
        'cancelled → paused geçmez',
        () => expect(
            SubscriptionStatus.cancelled
                .canTransitionTo(SubscriptionStatus.paused),
            isFalse));

    // archived →
    test(
        'archived → active geçer (restore)',
        () => expect(
            SubscriptionStatus.archived
                .canTransitionTo(SubscriptionStatus.active),
            isTrue));
    test(
        'archived → paused geçmez',
        () => expect(
            SubscriptionStatus.archived
                .canTransitionTo(SubscriptionStatus.paused),
            isFalse));
    test(
        'archived → cancelled geçmez',
        () => expect(
            SubscriptionStatus.archived
                .canTransitionTo(SubscriptionStatus.cancelled),
            isFalse));
  });
}
