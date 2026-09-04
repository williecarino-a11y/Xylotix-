export const AUTH_FLOW = Object.freeze({
  login: {
    initial: 'login',
    steps: {
      login: {
        id: 'login', type: 'form',
        fields: [
          { id: 'email', domId: 'miimiid-login-identifier', type: 'email', required: true, rules: ['required', 'email'] },
          { id: 'password', domId: 'miimiid-login-password', type: 'password', required: true, rules: ['required', 'password'] }
        ],
        primaryAction: { id: 'login', domId: 'miimiid-login-submit', label: 'authSignIn', apiAction: 'login', nextStep: 'authenticated' }
      },
      authenticated: { id: 'authenticated', type: 'confirmation', fields: [] }
    }
  },
  register: {
    initial: 'welcome',
    steps: {
      welcome: { id: 'welcome', type: 'welcome', fields: [], primaryAction: { id: 'start', domId: 'miimiid-register-get-started', label: 'authGetStarted', nextStep: 'name' } },
      name: { id: 'name', type: 'form', fields: [{ id: 'firstName', domId: 'miimiid-register-first-name', type: 'text', required: true, rules: ['required'] }, { id: 'lastName', domId: 'miimiid-register-last-name', type: 'text', required: true, rules: ['required'] }], primaryAction: { id: 'name-next', domId: 'miimiid-register-name-next', label: 'authContinue', nextStep: 'email' }, previousStep: 'welcome' },
      email: { id: 'email', type: 'form', fields: [{ id: 'email', domId: 'miimiid-register-email', type: 'email', required: true, rules: ['required', 'email'] }], primaryAction: { id: 'contact-next', domId: 'miimiid-register-contact-next', label: 'authContinue', nextStep: 'birthday' }, previousStep: 'name' },
      birthday: { id: 'birthday', type: 'form', fields: [{ id: 'gender', domId: 'miimiid-register-gender', type: 'select', required: true, options: ['male', 'female'], rules: ['required', 'gender'] }, { id: 'dateOfBirth', domId: 'miimiid-register-dob', type: 'birthday', required: true, rules: ['required', 'birthday'] }], primaryAction: { id: 'details-next', domId: 'miimiid-register-details-next', label: 'authContinue', nextStep: 'password' }, previousStep: 'email' },
      password: { id: 'password', type: 'form', fields: [{ id: 'password', domId: 'miimiid-register-password', type: 'password', required: true, rules: ['required', 'password'] }, { id: 'confirmPassword', domId: 'miimiid-register-confirm', type: 'password', required: true, rules: ['required', 'confirmation'] }], primaryAction: { id: 'register', domId: 'miimiid-register-submit', label: 'authCreateAccountButton', apiAction: 'register', nextStep: 'verification' }, previousStep: 'birthday' },
      verification: { id: 'verification', type: 'verification', fields: [{ id: 'code', domId: 'miimiid-register-verification-code', type: 'verification', required: true, rules: ['required', 'verification'] }], primaryAction: { id: 'verify', domId: 'miimiid-verify-account-submit', label: 'authVerifyAccount', apiAction: 'verifyAccount', nextStep: 'authenticated' }, secondaryActions: [{ id: 'resend', domId: 'miimiid-resend-verification', label: 'authResendCode', apiAction: 'resendVerification' }], previousStep: 'password' },
      authenticated: { id: 'authenticated', type: 'confirmation', fields: [] }
    }
  },
  forgot: {
    initial: 'forgot',
    steps: {
      forgot: { id: 'forgot', type: 'recovery', fields: [{ id: 'email', domId: 'miimiid-forgot-identifier', type: 'email', required: true, rules: ['required', 'email'] }], primaryAction: { id: 'forgot', domId: 'miimiid-forgot-submit', label: 'authSendResetInstructions', apiAction: 'forgotPassword', nextStep: 'confirmation' } },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [] }
    }
  },
  reset: {
    initial: 'reset',
    steps: {
      reset: { id: 'reset', type: 'form', fields: [{ id: 'password', domId: 'miimiid-reset-password', type: 'password', required: true, rules: ['required', 'password'] }, { id: 'confirmPassword', domId: 'miimiid-reset-confirm', type: 'password', required: true, rules: ['required', 'confirmation'] }], primaryAction: { id: 'reset', domId: 'miimiid-reset-submit', label: 'authResetPasswordButton', apiAction: 'resetPassword', nextStep: 'confirmation' } },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [] }
    }
  }
});

export const AUTH_MODE_ACTIONS = Object.freeze([
  { domId: 'miimiid-show-register', flow: 'register' },
  { domId: 'miimiid-show-forgot', flow: 'forgot' },
  { domId: 'miimiid-show-login-from-register', flow: 'login' },
  { domId: 'miimiid-show-login-from-forgot', flow: 'login' },
  { domId: 'miimiid-show-login-from-reset', flow: 'login' }
]);