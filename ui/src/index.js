import { version } from '../package.json';

import ExportForm from './components/ExportForm.vue';
import FormLoginNotStyles from './components/FormLoginNotStyles.vue';
import HistrixApp from './components/HistrixApp.vue';
import HistrixCalendar from './components/HistrixCalendar.vue';
import HistrixCell from './components/HistrixCell.vue';
import HistrixChart from './components/HistrixChart.vue';
import HistrixDashboard from './components/HistrixDashboard.vue';
import HistrixField from './components/HistrixField.vue';
import HistrixFilters from './components/HistrixFilters.vue';
import HistrixForm from './components/HistrixForm.vue';
import HistrixList from './components/HistrixList.vue';
import HistrixLoginSplit from './components/HistrixLoginSplit.vue';
import HistrixPasswordChange from './components/HistrixPasswordChange.vue';
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
import HistrixNews from './components/widgets/HistrixNews.vue';
import HistrixUsers from './components/widgets/HistrixUsers.vue';
import notificationMenu from './components/widgets/notificationMenu.vue';
import profileMenu from './components/widgets/profileMenu.vue';
import profileMenuItems from './components/widgets/profileMenuItems.vue';
import config from './services/config';

const components = [
  ExportForm,
  FormLoginNotStyles,
  HistrixApp,
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForm,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixMenu,
  HistrixNews,
  HistrixPasswordChange,
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
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForm,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixMenu,
  HistrixNews,
  HistrixPasswordChange,
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
  config
};

export default {
  version,
  ExportForm,
  FormLoginNotStyles,
  HistrixApp,
  HistrixCalendar,
  HistrixCell,
  HistrixChart,
  HistrixConnectionSettings,
  HistrixDashboard,
  HistrixExpansionMenu,
  HistrixField,
  HistrixFileManager,
  HistrixFilters,
  HistrixForm,
  HistrixList,
  HistrixLog,
  HistrixLoginSplit,
  HistrixMenu,
  HistrixNews,
  HistrixPasswordChange,
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
  install(app, _options) {
    for (const component of components) {
      app.component(component.name, component);
    }
  }
};
