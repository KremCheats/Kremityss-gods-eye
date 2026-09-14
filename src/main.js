import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import { mountAuthGate } from './auth.js';

let application = null;

mountAuthGate({
  onAuthenticated: () => {
    application = createStandaloneApplication({
      googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
      cesiumToken: import.meta.env.CESIUM_ION_TOKEN,
      allowQaRegistration: import.meta.env.DEV,
    });
    application.start().catch((error) => {
      console.error('Kremityss initialization failed:', error);
      const loaderStatus = document.querySelector('#loading-screen .loader-status');
      if (!loaderStatus) return;
      loaderStatus.textContent = `Error: ${describeError(error)}`;
      loaderStatus.style.color = '#ff4444';
    });
  },
});

export { application };
