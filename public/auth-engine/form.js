export const FIELD_STATES = Object.freeze({
  UNTOUCHED: 'untouched', FOCUSED: 'focused', FILLED: 'filled', VALIDATING: 'validating', VALID: 'valid', INVALID: 'invalid', DISABLED: 'disabled'
});

export class FormEngine {
  constructor() { this.reset(); }

  reset() {
    this.values = {};
    this.touched = {};
    this.dirty = {};
    this.errors = {};
    this.fields = {};
  }

  configure(fields, source = {}) {
    this.values = {};
    for (const field of fields || []) {
      this.values[field.id] = source[field.id] ?? '';
      this.fields[field.id] = { state: FIELD_STATES.UNTOUCHED, disabled: false };
    }
  }

  setValue(field, value) {
    this.values[field] = value;
    this.touched[field] = true;
    this.dirty[field] = true;
    this.fields[field] = { ...(this.fields[field] || {}), state: value ? FIELD_STATES.FILLED : FIELD_STATES.UNTOUCHED };
  }

  touch(field) {
    this.touched[field] = true;
    if (this.fields[field]) this.fields[field].state = this.values[field] ? FIELD_STATES.FILLED : FIELD_STATES.UNTOUCHED;
  }

  touchAll(fields) { for (const field of fields || []) this.touch(field.id); }

  setErrors(errors) {
    this.errors = errors || {};
    for (const id of Object.keys(this.fields)) {
      this.fields[id].state = this.errors[id] ? FIELD_STATES.INVALID : (this.values[id] ? FIELD_STATES.VALID : FIELD_STATES.UNTOUCHED);
    }
  }

  get canContinue() {
    return Object.keys(this.errors).length === 0;
  }
}
