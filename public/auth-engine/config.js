export const AUTH_FLOW = Object.freeze({
  login: {
    initial: 'login',
    steps: {
      login: {
        id: 'login', type: 'form',
        fields: [
          { id: 'email', type: 'email', required: true, rules: ['required', 'email'] },
          { id: 'password', type: 'password', required: true, rules: ['required', 'password'] }
        ],
        primaryAction: { id: 'login', label: 'authSignIn', apiAction: 'login', nextStep: 'authenticated' }
      }
    }
  },
  register: {
    initial: 'welcome',
    steps: {
      welcome: { id: 'welcome', type: 'welcome', fields: [], primaryAction: { id: 'start', label: 'authGetStarted', nextStep: 'name' } },
      name: {
        id: 'name', type: 'form',
        fields: [
          { id: 'firstName', type: 'text', required: true, rules: ['required'] },
          { id: 'lastName', type: 'text', required: true, rules: ['required'] }
        ],
        primaryAction: { id: 'name-next', label: 'authContinue', nextStep: 'email' }, previousStep: 'welcome'
      },
      email: {
        id: 'email', type: 'form',
        fields: [{ id: 'email', type: 'email', required: true, rules: ['required', 'email'] }],
        primaryAction: { id: 'email-next', label: 'authContinue', nextStep: 'birthday' }, previousStep: 'name'
      },
      birthday: {
        id: 'birthday', type: 'form',
        fields: [
          { id: 'gender', type: 'select', required: true, options: ['male', 'female'], rules: ['required', 'gender'] },
          { id: 'dateOfBirth', type: 'birthday', required: true, rules: ['required', 'birthday'] }
        ],
        primaryAction: { id: 'birthday-next', label: 'authContinue', nextStep: 'password' }, previousStep: 'email'
      },
      password: {
        id: 'password', type: 'form',
        fields: [
          { id: 'password', type: 'password', required: true, rules: ['required', 'password'] },
          { id: 'confirmPassword', type: 'password', required: true, rules: ['required', 'confirmation'] }
        ],
        primaryAction: { id: 'register', label: 'authCreateAccountButton', apiAction: 'register', nextStep: 'verification' }, previousStep: 'birthday'
      },
      verification: {
        id: 'verification', type: 'verification',
        fields: [{ id: 'code', type: 'verification', required: true, rules: ['required', 'verification'] }],
        primaryAction: { id: 'verify', label: 'authVerifyAccount', apiAction: 'verify', nextStep: 'authenticated' },
        secondaryActions: [{ id: 'resend', label: 'authResendCode', apiAction: 'resend' }], previousStep: 'password'
      }
    }
  },
  forgot: {
    initial: 'forgot',
    steps: {
      forgot: {
        id: 'forgot', type: 'recovery',
        fields: [{ id: 'email', type: 'email', required: true, rules: ['required', 'email'] }],
        primaryAction: { id: 'forgot', label: 'authSendResetInstructions', apiAction: 'forgot', nextStep: 'confirmation' }
      },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [] }
    }
  },
  reset: {
    initial: 'reset',
    steps: {
      reset: {
        id: 'reset', type: 'form',
        fields: [
          { id: 'password', type: 'password', required: true, rules: ['required', 'password'] },
          { id: 'confirmPassword', type: 'password', required: true, rules: ['required', 'confirmation'] }
        ],
        primaryAction: { id: 'reset', label: 'authResetPasswordButton', apiAction: 'reset', nextStep: 'confirmation' }
      },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [] }
    }
  }
});
