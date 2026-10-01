import { version } from '../package.json';

import ExportForm from './components/ExportForm.vue';
import FormLoginNotStyles from './components/FormLoginNotStyles.vue';
import HistrixApp from './components/HistrixApp.vue';
import HistrixAppDialog from './components/HistrixAppDialog.vue';
import HistrixCalendar from './components/HistrixCalendar.vue';
import HistrixCell from './components/HistrixCell.vue';
import HistrixChart from './components/HistrixChart.vue';
import HistrixDashboard from './components/HistrixDashboard.vue';
import HistrixField from './components/HistrixField.vue';
import HistrixFilters from './components/HistrixFilters.vue';
import HistrixForgotPasswordSplit from './components/HistrixForgotPasswordSplit.vue';
import HistrixForm from './components/HistrixForm.vue';
import HistrixHelp from './components/HistrixHelp.vue';
import HistrixList from './components/HistrixList.vue';
import HistrixLoginSplit from './components/HistrixLoginSplit.vue';
import HistrixPage from './components/HistrixPage.vue';
import HistrixPasswordChange from './components/HistrixPasswordChange.vue';
import HistrixRegisterSplit from './components/HistrixRegisterSplit.vue';
import HistrixResetPasswordSplit from './components/HistrixResetPasswordSplit.vue';
import HistrixTable from './components/HistrixTable.vue';
import HistrixTree from './components/HistrixTree.vue';
import InputPassword from './components/InputPassword.vue';
import LoginForm from './components/LoginForm.vue';
import DatabaseSelector from './components/widgets/DatabaseSelector.vue';
import FavoritItems from './components/widgets/FavoritItems.vue';
import HistrixConnectionSettings from './components/widgets/HistrixConnectionSettings.vue';
import HistrixExpansionMenu from './components/widgets/HistrixExpansionMenu.vue';
import HistrixFileManager from './components/widgets/HistrixFileManager.vue';
import HistrixLog from './components/widgets/HistrixLog.vue';
import HistrixMenu from './components/widgets/HistrixMenu.vue';
import HistrixMenuSearch from './components/widgets/HistrixMenuSearch.vue';
import HistrixNews from './components/widgets/HistrixNews.vue';
import HistrixUsers from './components/widgets/HistrixUsers.vue';
import notificationMenu from './components/widgets/notificationMenu.vue';
import profileMenu from './components/widgets/profileMenu.vue';
import profileMenuItems from './components/widgets/profileMenuItems.vue';
import { useHistrixSession } from './composables/useHistrixSession.js';
import { HistrixApiError, isHistrixApiError, normalizeApiError } from './core/apiError.js';
import { normalizeData } from './core/apiResponse.js';
import { setHistrixApp } from './services/appContext.js';
import {
  adaptAuth,
  authServiceAdapter,
  createAuthAdapter,
  provideHistrixAuth,
  useHistrixAuth,
  websanovaAuthAdapter
} from './services/auth.js';
import { adaptBus, createHistrixBus, provideHistrixBus, useHistrixBus } from './services/bus.js';
import config from './services/config';
import { createHistrixClient } from './services/histrixApi.js';
import { useHistrixNavigate } from './services/navigation.js';
import { createNotifier, provideHistrixNotify, useHistrixNotify } from './services/notify.js';
import quasarNotifyImpl from './services/notify.quasar.js';
import { createBrowserStorage, createMemoryStorage, useHistrixStorage } from './services/storage.js';

const components = [
  ExportForm,
  FormLoginNotStyles,
  HistrixApp,
  HistrixAppDialog,
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForgotPasswordSplit,
  HistrixForm,
  HistrixHelp,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixPage,
  HistrixMenu,
  HistrixMenuSearch,
  HistrixNews,
  HistrixPasswordChange,
  HistrixRegisterSplit,
  HistrixResetPasswordSplit,
  HistrixTable,
  HistrixTree,
  HistrixUsers,
  InputPassword,
  LoginForm,
  DatabaseSelector,
  FavoritItems,
  notificationMenu,
  profileMenu,
  profileMenuItems
];

export {
  version,
  ExportForm,
  FormLoginNotStyles,
  HistrixApp,
  HistrixAppDialog,
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForgotPasswordSplit,
  HistrixForm,
  HistrixHelp,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixPage,
  HistrixMenu,
  HistrixMenuSearch,
  HistrixNews,
  HistrixPasswordChange,
  HistrixRegisterSplit,
  HistrixResetPasswordSplit,
  HistrixTable,
  HistrixTree,
  HistrixUsers,
  InputPassword,
  LoginForm,
  DatabaseSelector,
  FavoritItems,
  notificationMenu,
  profileMenu,
  profileMenuItems,
  config,
  HistrixApiError,
  isHistrixApiError,
  normalizeApiError,
  normalizeData,
  createNotifier,
  provideHistrixNotify,
  useHistrixNotify,
  createHistrixBus,
  adaptBus,
  provideHistrixBus,
  useHistrixBus,
  createAuthAdapter,
  adaptAuth,
  websanovaAuthAdapter,
  authServiceAdapter,
  provideHistrixAuth,
  useHistrixAuth,
  createHistrixClient,
  createBrowserStorage,
  createMemoryStorage,
  useHistrixStorage,
  useHistrixNavigate,
  useHistrixSession
};

export default {
  version,
  ExportForm,
  FormLoginNotStyles,
  HistrixApp,
  HistrixAppDialog,
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForgotPasswordSplit,
  HistrixForm,
  HistrixHelp,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixPage,
  HistrixMenu,
  HistrixMenuSearch,
  HistrixNews,
  HistrixPasswordChange,
  HistrixRegisterSplit,
  HistrixResetPasswordSplit,
  HistrixTable,
  HistrixTree,
  HistrixUsers,
  InputPassword,
  LoginForm,
  DatabaseSelector,
  FavoritItems,
  notificationMenu,
  profileMenu,
  profileMenuItems,
  install(app, options = {}) {
    for (const component of components) {
      app.component(component.name, component);
    }
    // Permite resolver los plugins de la app (bus, auth, http, router) fuera de setup.
    setHistrixApp(app);
    // Notifier: el que inyecte la app (`app.use(plugin, { notify })`) o el de Quasar.
    provideHistrixNotify(app, options.notify || quasarNotifyImpl);
    // Contratos opcionales: sin pasarlos se usan los plugins de Mundo IT si están.
    if (options.bus) provideHistrixBus(app, options.bus);
    if (options.auth) provideHistrixAuth(app, options.auth);
    if (options.http) config.http = options.http;
    if (options.storage !== undefined) config.storage = options.storage;
    if (typeof options.onNavigate === 'function') config.onNavigate = options.onNavigate;
    if (typeof options.onUnauthorized === 'function') {
      config.onUnauthorized = options.onUnauthorized;
    }
  }
};
