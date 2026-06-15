// platform/auth/auth-service.js
// Forge platform auth service.

import { showToast } from '../../utils.js';
import { SupabaseRuntime } from '../../supabase-runtime.js';
import { AppState } from '../../state-manager.js';
import { Lifecycle } from '../../module-lifecycle.js';
import { Analytics } from '../../analytics-engine.js';
import { Logger } from '../../logger.js';
import { AppShell } from '../../app-shell-manager.js';

const ENV = Object.freeze({
    SUPABASE_URL: window.__ENV__?.SUPABASE_URL || '',
    SUPABASE_KEY: window.__ENV__?.SUPABASE_KEY || '',
    DEMO_MODE:   window.__ENV__?.DEMO_MODE || '',
});

const isDemoMode = () => ENV.DEMO_MODE === 'true';

export class AuthService {
    constructor() {
        this.client = null;
        this.user   = null;
    }

    init() {

        if (isDemoMode()) {
            this.client = this._createDemoClient();
            window.supabaseClient = this.client;
            SupabaseRuntime.init(this.client);
            Logger.warn('[AUTH] DEMO MODE READY');
            return true;
        }

        if (!window.supabase) {
            throw new Error('Supabase SDK missing');
        }

        if (!ENV.SUPABASE_URL || !ENV.SUPABASE_KEY) {
            throw new Error('ENV VARIABLES MISSING — verifica env.js');
        }

        this.client = window.supabase.createClient(
            ENV.SUPABASE_URL,
            ENV.SUPABASE_KEY,
            {
                auth: {
                    persistSession:     true,
                    autoRefreshToken:   true,
                    detectSessionInUrl: true,
                },
            }
        );

        // Expuesto como global SOLO para compatibilidad con módulos legacy
        // pendientes de migración. Los módulos ya migrados NO usan esto.
        // TODO: eliminar window.supabaseClient cuando migración esté completa.
        window.supabaseClient = this.client;
        SupabaseRuntime.init(this.client);

        Logger.info('[AUTH] READY');

        return true;
    }

    async getUser() {

        try {

            if (isDemoMode()) {
                this.user = this._createDemoUser();
                AppState.set('user', this.user);
                return this.user;
            }

            const { data, error } = await this.client.auth.getUser();

            if (error) throw error;

            this.user = data?.user || null;

            AppState.set('user', this.user);

            return this.user;

        } catch (err) {

            Logger.error('[AUTH USER ERROR]', err);
            return null;
        }
    }

    async login() {

        if (isDemoMode()) {
            return;
        }

        try {

            Analytics.track('auth_login_attempt');

            await this.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo:          new URL(window.location.pathname || '/', window.location.origin).href,
                    skipBrowserRedirect: false,
                },
            });

        } catch (err) {

            Logger.error('[LOGIN ERROR]', err);
            showToast('Error iniciando sesión', 'danger');
        }
    }

    async logout() {

        try {

            AppShell.showLoader('Cerrando sesión...');

            // Orden correcto:
            // 1. Destruir módulos montados (limpia listeners, timers, AbortControllers)
            // 2. Cerrar sesión en Supabase
            // 3. Resetear estado local
            // 4. Recargar (estado limpio garantizado)
            await Lifecycle.destroyAll();
            await this.client.auth.signOut();
            AppState.reset();
            location.reload();

        } catch (err) {

            Logger.error('[LOGOUT ERROR]', err);

            // Forzar recarga aunque falle signOut — no dejar UI en estado roto
            location.reload();
        }
    }

    _createDemoUser() {
        return {
            id: 'demo-user',
            email: 'demo@forge.local',
            app_metadata: {
                provider: 'demo',
                demo: true,
            },
            user_metadata: {
                full_name: 'Demo Mode',
                avatar_url: '',
            },
        };
    }

    _createDemoClient() {
        const demoUser = this._createDemoUser();

        const createQuery = () => {
            const result = {
                data: null,
                error: null,
                select: () => result,
                eq: () => result,
                order: () => result,
                limit: () => result,
                upsert: () => Promise.resolve({ data: null, error: null }),
                delete: () => result,
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
                single: () => Promise.resolve({ data: null, error: null }),
                then: resolve => Promise.resolve({ data: null, error: null }).then(resolve),
            };

            return result;
        };

        return {
            auth: {
                getUser: async () => ({ data: { user: demoUser }, error: null }),
                signOut: async () => ({ error: null }),
                signInWithOAuth: async () => ({ data: null, error: null }),
            },
            from: () => createQuery(),
            rpc: async () => ({ data: null, error: null }),
            channel: () => ({
                on() {
                    return this;
                },
                subscribe() {
                    return this;
                },
            }),
            removeChannel: () => null,
        };
    }
}
