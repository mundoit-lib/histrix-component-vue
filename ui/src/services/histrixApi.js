import { normalizeApiError } from '../core/apiError.js';
import { normalizeData } from '../core/apiResponse.js';
import { buildApiUrl, resolveHost } from '../core/apiUrl.js';
import { buildExportUrl, parseQueryString } from '../core/export.js';
import { globalProperty } from './appContext.js';
import { adaptAuth, useHistrixAuth } from './auth.js';
import config from './config';
import { useHistrixStorage } from './storage.js';

// Convierte cualquier rechazo en HistrixApiError. Un 401 además avisa a la app
// vía `config.onUnauthorized` (la librería no toca el router).
const rejectWithApiError = (error, { notifyUnauthorized = true } = {}) => {
  const apiError = normalizeApiError(error);
  if (notifyUnauthorized && apiError.status === 401 && typeof config.onUnauthorized === 'function') {
    try {
      config.onUnauthorized(apiError);
    } catch (callbackError) {
      console.error(callbackError);
    }
  }
  return Promise.reject(apiError);
};

// Interceptor local: envuelve la instancia http sin registrar interceptores
// globales (otras partes de la app la usan tal cual). No refresca tokens: eso
// lo hacen plugin-vue-axios o el AuthService.
const METHODS = ['get', 'delete', 'head', 'options', 'post', 'put', 'patch'];
export function withApiErrors(instance) {
  // `instance` puede ser la instancia o una función que la devuelve (resolución diferida).
  const resolve = typeof instance === 'function' && typeof instance.get !== 'function' ? instance : () => instance;
  const target = () => {
    const http = resolve();
    if (!http) {
      throw new Error(
        'Histrix: no hay cliente http. Instalá plugin-vue-axios o pasá `http` a createHistrixClient / config.http.'
      );
    }
    return http;
  };
  const run = (fn) => {
    try {
      return Promise.resolve(fn()).catch((e) => rejectWithApiError(e));
    } catch (e) {
      return rejectWithApiError(e);
    }
  };
  const wrapped = (...args) => run(() => target()(...args));
  for (const method of METHODS) {
    wrapped[method] = (...args) => run(() => target()[method](...args));
  }
  return wrapped;
}

let fixApiWarned = false;
const warnFixApi = () => {
  if (fixApiWarned || !config.fixApi) return;
  fixApiWarned = true;
  console.warn('[histrix] `config.fixApi` (FIX_API_URL) está deprecado: usá `config.apiUrl`.');
};

/** http por defecto: config.http → config.axios → `$axios` de la app (plugin-vue-axios). */
const defaultHttp = () => config.http || config.axios || globalProperty('$axios') || globalProperty('$api');

/**
 * Cliente de la API de Histrix. Todas las dependencias son opcionales:
 *   http    instancia tipo axios (get/post/put/delete + callable)
 *   host    string o función → host del servidor Histrix
 *   db      string o función → base de datos
 *   auth    adaptador de auth (ver services/auth.js) o `$auth`
 *   storage { get, set, remove } (ver services/storage.js)
 * Lo que no se pasa sale de `config` y de los plugins instalados en la app.
 */
export function createHistrixClient(options = {}) {
  // Los defaults se resuelven siempre (inject sólo funciona en setup).
  const defaultStorage = useHistrixStorage();
  const defaultAuth = useHistrixAuth();
  const storage = options.storage || defaultStorage;
  const auth = options.auth ? adaptAuth(options.auth) : defaultAuth;
  // Se resuelve ya (dentro de setup hay instancia) y, si no estaba, en cada pedido.
  const initialHttp = options.http || defaultHttp();
  const axios = withApiErrors(() => initialHttp || defaultHttp());

  const read = (value) => (typeof value === 'function' ? value() : value);

  const currentDb = () => {
    if (options.db !== undefined) return read(options.db);
    return storage.get('database') || config.db;
  };

  const host = () => {
    if (options.host !== undefined) return read(options.host);
    if (config.fixApi) warnFixApi();
    return resolveHost({ storedHost: storage.get('host'), fixApi: config.fixApi, apiUrl: config.apiUrl });
  };

  const apiUrl = () => buildApiUrl({ host: host(), db: currentDb(), apiUrl: config.apiUrl });

  const getData = async (url) => {
    return axios.get(url);
  };

  const getBasicDataUser = (_scope) => {
    return axios.get(`${apiUrl()}/me`);
  };

  const getUser = async (_verify = false) => {
    return getBasicDataUser().then((resp) => {
      const userObject = resp.data;
      // Compat: las apps leen el usuario guardado en la clave `user`.
      storage.set('user', JSON.stringify(resp.data));
      auth.setUser(userObject);
      if (userObject.verified == null) {
        return '/auth/verify';
      }
      return true;
    });
  };

  return {
    getHostDb(host) {
      const url = `${host}/api/db/`;
      return axios.get(url);
    },

    currentDb,

    async info() {
      const hostUrl = host();
      return getData(`${hostUrl}/api/info/`);
    },

    async getDatabaseInfo(db) {
      const hostUrl = host();
      return getData(`${hostUrl}/api/db/${db}`);
    },

    host,
    apiUrl,

    /**
     * User Methods
     */
    changePassword(data) {
      return axios.post(`${apiUrl()}/change-password/`, data);
    },

    reSendConfirmationMail(data) {
      return axios.post(`${apiUrl()}/resend-confirmation/`, data);
    },

    confirmRegistration(data) {
      return axios.post(`${apiUrl()}/confirm-registration/`, data);
    },

    register(form) {
      return axios.post(`${apiUrl()}/registration/`, form);
    },

    // Solicitar/confirmar reseteo de contraseña. Endpoint a nivel host (no
    // scopeado por /api/db/{db}); la base viaja en el body (`db`). Se usa tanto
    // para pedir el mail de recupero ({ email, recover, db }) como para fijar la
    // nueva contraseña con token ({ email, password, confirm_password, token, db }).
    resetPassword(form) {
      return axios.post(`${host()}/api/resetpassword/`, form);
    },

    updateUser(form, userId) {
      return axios
        .put(`${apiUrl()}/app/users/current_user_form.xml`, {
          data: {
            Nombre: form.Nombre,
            name: form.Nombre,
            apellido: form.apellido,
            lastName: form.apellido,
            email: form.email,
            telefono: form.telefono,
            keys: {
              Id_usuario: userId
            }
          },
          keys: {
            Id_usuario: userId
          }
        })
        .then((response) => {
          if (response.id !== null || response.id !== undefined) {
            return {
              error: false,
              html: false,
              msg: 'Usuario actualizado exitosamente',
              detail: ''
            };
          }
          return {
            error: true,
            html: false,
            msg: 'Error actualizando usuario'
          };
        });
    },

    getBasicDataUser,

    /**
     * Login
     * @param {string} username
     * @param {string} password
     */
    async login(username, password, redirect) {
      const token = null;
      const request = {
        url: `${apiUrl()}/token`,
        data: {
          username,
          password,
          grant_type: 'password',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          notification_token: token
        },
        method: 'POST',
        rememberMe: true,
        staySignedIn: true,
        headers: {
          Accept: 'application/json, text/plain',
          'Content-Type': 'application/json'
        }
      };
      return (
        auth
          .login({ username, password, request, redirect })
          // Credenciales inválidas también responden 401: no es sesión expirada,
          // así que no se dispara onUnauthorized.
          .catch((e) => rejectWithApiError(e, { notifyUnauthorized: false }))
          .then((_success) => {
            return getUser();
          })
      );
    },

    /** Cierra la sesión en el adaptador de auth y borra el usuario guardado. */
    logout(options) {
      storage.remove('user');
      return auth.logout(options);
    },

    /** Token de acceso actual (para headers de uploads, etc.). */
    getToken() {
      return auth.getToken() || storage.get('accessToken');
    },

    getData,

    /**
     * System Methods
     */
    /**
     * Get Menu
     * @param {string} level
     */
    async getMenu(level) {
      const url = `${apiUrl()}/menu/${level}?platform=app`;
      return getData(url);
    },

    async getUserNotifications() {
      const url = `${apiUrl()}/user/notifications/`;
      return getData(url);
    },

    async getUsers() {
      const url = `${apiUrl()}/users/`;
      return getData(url);
    },

    async getUserInfo() {
      const url = `${apiUrl()}/me/`;
      return getData(url);
    },

    getUser,

    async getValidToken(id) {
      return axios
        .get(`${apiUrl()}/app/users/valid_token.xml?login=${id}`, {
          params: {
            token: 'magic_token',
            redirect: false
          }
        })
        .then((resp) => {
          if (!resp.data || resp.data.errors) {
            return null;
          }
          return resp.data.data[0];
        })
        .catch((e) => {
          console.error(e);
          return null;
        });
    },

    /**
     * Application related methods
     */
    /**
     * getSchema
     * @param {string} path App Xml Path
     */
    async getAppSchema(path, params) {
      return axios.get(`${apiUrl()}/schema/${path}`, { params });
    },

    // Resuelve la respuesta de axios con `data` normalizado: 204/body vacío →
    // `{ data: [] }`, y `response.data.data` sigue disponible para los call-sites.
    async getAppData(path, params) {
      const response = await axios({
        method: 'GET',
        url: `${apiUrl()}/app/${path}`,
        params
      });
      return { ...response, data: normalizeData(response) };
    },

    async getAppPdf(path, params) {
      return axios.get(`${apiUrl()}/pdf/${path}`, { params, responseType: 'arraybuffer' });
    },

    upload(files) {
      files
        .filter((file) => file.data.name)
        .map((file) => {
          const formData = new FormData();
          formData.append('file', file.data);
          axios({
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            url: `${apiUrl()}/files/${file.path}`,
            data: formData
          });
        });
    },

    async insertAppData(path, data) {
      return axios({
        method: 'POST',
        url: `${apiUrl()}/app/${path}`,
        data
      });
    },

    async updateAppData(path, data) {
      return axios({
        method: 'PUT',
        url: `${apiUrl()}/app/${path}`,
        data
      });
    },

    async processAppForm(path, data) {
      return axios({
        method: 'PATCH',
        url: `${apiUrl()}/app/${path}`,
        data: { data }
      });
    },

    async processApp(path, data) {
      return axios({
        method: 'PATCH',
        url: `${apiUrl()}/app/${path}`,
        data: {
          jsonData: data
        }
      });
    },

    async deleteAppData(path, keys) {
      return axios({
        method: 'DELETE',
        url: `${apiUrl()}/app/${path}`,
        data: {
          keys
        }
      });
    },

    // Reusa la función pura de core/export.js (testeada) para no duplicar el
    // parseo del querystring pseudo-OData.
    queryStringToObject(query) {
      return parseQueryString(query);
    },

    getFiles(path) {
      const url = `${apiUrl()}/dir/${path}`;
      return axios.get(url, {});
    },

    async deleteFile(path) {
      return axios({
        method: 'DELETE',
        url: `${apiUrl()}/files/${path}`
      });
    },

    // Favorites
    async getFavoritesOption() {
      const url = `${apiUrl()}/favorites/`;
      try {
        const response = await getData(url);
        if (Array.isArray(response.data)) return response.data;
        return response.data?.favorites ?? [];
      } catch (_error) {
        return [];
      }
    },

    async getFavorites() {
      const url = `${apiUrl()}/favorites/`;
      try {
        const response = await getData(url);
        const keys = Array.isArray(response.data) ? response.data : (response.data?.favorites ?? []);
        return { keys };
      } catch (_error) {
        return { keys: [] };
      }
    },

    async setFavorit(menuId, uri, name) {
      const url = `${apiUrl()}/favorites/`;
      let favorites = [];
      try {
        const response = await getData(url);
        favorites = Array.isArray(response.data) ? response.data : (response.data?.favorites ?? []);
      } catch (_error) {
        favorites = [];
      }
      favorites.push({ menuId, uri, name });
      return axios({
        method: 'PUT',
        url,
        data: { favorites }
      });
    },

    async removeFavorit(menuId) {
      const url = `${apiUrl()}/favorites/`;
      let favorites = [];
      try {
        const response = await getData(url);
        favorites = Array.isArray(response.data) ? response.data : (response.data?.favorites ?? []);
      } catch (_error) {
        return null;
      }
      const index = favorites.findIndex((item) => item.menuId === menuId);
      if (index > -1) favorites.splice(index, 1);
      return axios({
        method: 'PUT',
        url,
        data: { favorites }
      });
    },

    // Descarga el archivo exportado. El service NO muestra UI: retorna la
    // promesa y propaga el error para que el componente que llama lo muestre
    // (antes hacía Notify de Quasar acá y se tragaba el error).
    downloadAppData(path, query, fileFormat, fileName) {
      const url = buildExportUrl(apiUrl(), fileFormat, path);
      return axios
        .get(url, {
          params: query,
          responseType: 'blob'
        })
        .then((response) => {
          const fileURL = window.URL.createObjectURL(new Blob([response.data]));
          const fileLink = document.createElement('a');
          fileLink.href = fileURL;
          fileLink.setAttribute('download', fileName);
          document.body.appendChild(fileLink);
          fileLink.click();
          fileLink.remove();
          window.URL.revokeObjectURL(fileURL);
        });
    },

    async apiDBQuery() {
      const { data } = await axios.get(config.mainUrl);
      const infoDB = [];
      for (const db in data) {
        const aux = data[db];
        if (aux.hidden !== 'true') {
          aux.name = aux.name ? aux.name : db;
          infoDB.push({
            value: aux.id,
            label: aux.description,
            img: aux.logo
          });
        }
      }
      return infoDB;
    }
  };
}

/** Cliente con las dependencias por defecto (config + plugins de la app). */
export default function useApi() {
  return createHistrixClient();
}
