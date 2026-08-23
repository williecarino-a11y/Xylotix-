export const StepRegistry = Object.freeze({
  welcome: { render: 'form' },
  form: { render: 'form' },
  verification: { render: 'verification' },
  recovery: { render: 'form' },
  confirmation: { render: 'confirmation' }
});

export const FieldRegistry = Object.freeze({
  text: 'input',
  email: 'input',
  password: 'password',
  birthday: 'birthday',
  verification: 'verification',
  select: 'select'
});
