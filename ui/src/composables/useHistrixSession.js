// Sesión del usuario: única fuente de `user` para la app y la librería.
//
//   const { user, isLogged, login, logout, refresh } = useHistrixSession();
//
// Se apoya en el adaptador de auth (services/auth.js) y en useApi(). Con
// plugin-vue-auth 1.x (websanova) `user` se actualiza al hacer login/refresh;
// con el AuthService nuevo, además, por su `onUserChange`.
import { computed, shallowRef } from 'vue';
import { useHistrixAuth } from '../services/auth.js';
import useApi from '../services/histrixApi.js';
import { readJson, useHistrixStorage } from '../services/storage.js';

// Estado compartido por todos los que usen el composable.
const user = shallowRef(null);
let subscribedTo = null;
let unsubscribe = null;

const subscribe = (auth, storage) => {
  if (subscribedTo === auth) return;
  if (unsubscribe) unsubscribe();
  subscribedTo = auth;
  user.value = auth.user() || readJson(storage, 'user');
  unsubscribe = auth.onUserChange((next) => {
    user.value = next || null;
  });
};

export function useHistrixSession() {
  const auth = useHistrixAuth();
  const storage = useHistrixStorage();
  const api = useApi();
  subscribe(auth, storage);

  const refresh = async () => {
    await api.getUser();
    user.value = auth.user() || readJson(storage, 'user');
    return user.value;
  };

  const login = async (username, password, redirect) => {
    await api.login(username, password, redirect);
    user.value = auth.user() || readJson(storage, 'user');
    return user.value;
  };

  const logout = (options) => {
    const result = api.logout(options);
    user.value = null;
    return result;
  };

  return {
    user,
    isLogged: computed(() => Boolean(user.value)),
    login,
    logout,
    refresh
  };
}

export default useHistrixSession;
