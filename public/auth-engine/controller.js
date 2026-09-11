// Legacy modular auth controller retained temporarily for compatibility.
// The live application uses public/miimiid-auth-engine.js as its single
// authentication runtime. Keep this module isolated from the browser entrypoint.
export { NavigationController, ActionController, AuthController } from './legacy-controller.js';
