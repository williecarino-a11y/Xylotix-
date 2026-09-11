# Legacy modular authentication engine

This directory contains the original modular authentication implementation retained for regression coverage and historical compatibility.

## Current runtime

The live Miimiid browser runtime uses `../miimiid-auth-engine.js` as the single authentication state and request coordinator. It is loaded by the application shell and coordinated by `../auth-bootstrap-guard.js`.

Files in this directory must not be added to the browser entrypoint unless the authentication architecture is intentionally migrated back to this modular implementation.

## Why this remains

The modular implementation currently provides focused unit-test coverage for form, validation, state, and flow behavior. Keeping it isolated prevents accidental runtime conflicts while allowing those behaviors to be preserved during future migration work.
