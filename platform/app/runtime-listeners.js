// platform/app/runtime-listeners.js
// Platform runtime browser listeners.

import { showToast } from '../../utils.js';
import { AppState } from '../../state-manager.js';
import { EventBus } from '../../event-system.js';
import { SyncEngine } from '../sync/sync-orchestrator.js';
import { ErrorHandler } from '../../error-boundary.js';
import { Logger } from '../../logger.js';

export function bindPlatformRuntimeListeners() {

    window.addEventListener('online', () => {
        AppState.set('online', true);
        EventBus.emit('network:online');
        Logger.info('[NETWORK] Online');
        showToast('Conexión restaurada', 'success');
        if (typeof SyncEngine?.sync === 'function') {
            SyncEngine.sync().catch(err => {
                Logger.warn('[SYNC] Error al sincronizar tras reconexión:', err);
            });
        }
    });

    window.addEventListener('offline', () => {
        AppState.set('online', false);
        EventBus.emit('network:offline');
        Logger.warn('[NETWORK] Offline');
        showToast('Sin conexión — modo offline', 'warning');
    });

    window.addEventListener('unhandledrejection', (e) => {
        Logger.error('[UNHANDLED REJECTION]', e.reason);
        ErrorHandler.capture(e.reason || new Error('Unhandled Promise rejection'));
    });

    window.addEventListener('error', (e) => {
        Logger.error('[GLOBAL ERROR]', e.error);
        ErrorHandler.capture(e.error || new Error(e.message));
    });
}
