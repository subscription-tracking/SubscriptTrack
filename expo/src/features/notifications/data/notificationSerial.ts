import { createSerialExecutor } from '../../../core/async/serialExecutor';
/** Native scheduler mutations share one queue, including snooze and deletion. */
export const notificationSerial = createSerialExecutor();
