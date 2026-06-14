// platform/app/bootstrap.js
// Forge app bootstrap helper.

export function bootstrapApp(startApp) {
    if (typeof startApp !== 'function') {
        throw new TypeError('bootstrapApp requires a start function');
    }

    const run = () => {
        try {
            Promise
                .resolve(startApp())
                .catch(err => {
                    console.error('[APP BOOTSTRAP FATAL]', err);
                });
        } catch (err) {
            console.error('[APP BOOTSTRAP FATAL]', err);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
        return;
    }

    run();
}
