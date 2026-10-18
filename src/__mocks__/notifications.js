export const isIOS = () => false;
export const isPWA = () => false;
export const notifStatus = () => "off";
export const enableNotifications = async () => ({ ok: true });
export const refreshNotifications = async () => {};
export const testNotifications = async () => ({ ok: true });
export const listenForeground = async () => () => {};
