// Implementación por defecto del notifier con Quasar (Notify + Dialog). Es el
// único archivo de services/ que importa Quasar.
import { Dialog, Notify } from 'quasar';

export const quasarNotifyImpl = {
  success: (message) => Notify.create({ type: 'positive', message }),
  error: (message) => Notify.create({ type: 'negative', message }),
  info: (message) => Notify.create({ type: 'info', message }),
  confirm: (message) =>
    new Promise((resolve) => {
      Dialog.create({ title: 'Confirmar', message, cancel: true, persistent: true })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false))
        .onDismiss(() => resolve(false));
    })
};

export default quasarNotifyImpl;
