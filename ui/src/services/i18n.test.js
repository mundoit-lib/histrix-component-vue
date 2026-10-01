import { describe, expect, it } from 'vitest';
import { createApp, ref } from 'vue';
import en from '../locales/en.js';
import es from '../locales/es.js';
import { createHistrixI18n, provideHistrixI18n, useHistrixI18n } from './i18n.js';

describe('createHistrixI18n', () => {
  it('sin opciones usa es', () => {
    const { t, locale } = createHistrixI18n();
    expect(locale.value).toBe('es');
    expect(t('table.perPage')).toBe('Por página');
  });

  it('interpola {params} y deja los que faltan', () => {
    const { t } = createHistrixI18n();
    expect(t('export.title', { title: 'Clientes' })).toBe('Exportar Clientes');
    expect(t('help.selectField')).toBe('Seleccione {label}');
  });

  it('otro locale, con fallback a es y a la clave', () => {
    const { t } = createHistrixI18n({ locale: 'pt', messages: { pt: { 'common.search': 'Pesquisar' } } });
    expect(t('common.search')).toBe('Pesquisar');
    expect(t('table.perPage')).toBe('Por página');
    expect(t('no.existe')).toBe('no.existe');
  });

  it('los mensajes propios pisan los de la lib sin perder el resto', () => {
    const { t } = createHistrixI18n({ locale: 'en', messages: { en: { 'common.search': 'Find' } } });
    expect(t('common.search')).toBe('Find');
    expect(t('common.cancel')).toBe('Cancel');
  });

  it('el locale puede ser un ref y cambiar en caliente', () => {
    const locale = ref('es');
    const { t } = createHistrixI18n({ locale });
    expect(t('common.close')).toBe('Cerrar');
    locale.value = 'en';
    expect(t('common.close')).toBe('Close');
  });
});

describe('diccionarios', () => {
  it('en no tiene claves que es no tenga', () => {
    expect(Object.keys(en).filter((key) => !(key in es))).toEqual([]);
  });
});

describe('provideHistrixI18n / useHistrixI18n', () => {
  it('fuera de setup devuelve el último registrado', () => {
    provideHistrixI18n(createApp({}), { locale: 'en' });
    expect(useHistrixI18n().t('common.save')).toBe('Save');
    provideHistrixI18n(createApp({}), {});
    expect(useHistrixI18n().t('common.save')).toBe('Guardar');
  });

  it('acepta un `t` externo (vue-i18n) y cae a es para las claves que no tiene', () => {
    const external = { t: (key) => (key === 'common.save' ? 'Salvar' : key) };
    const { t } = provideHistrixI18n(createApp({}), external);
    expect(t('common.save')).toBe('Salvar');
    expect(t('common.cancel')).toBe('Cancelar');
    provideHistrixI18n(createApp({}), {});
  });
});
