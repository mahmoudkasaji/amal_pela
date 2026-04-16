/**
 * Central API barrel — re-exports all domain modules for convenient importing.
 *
 * Usage: `import { fetchTrainees, rpcBookSession } from '../api';`
 */

export * from './_shared';
export * from './auth.api';
export * from './branches.api';
export * from './session-types.api';
export * from './club-settings.api';
export * from './trainees.api';
export * from './trainers.api';
export * from './sessions.api';
export * from './bookings.api';
export * from './packages.api';
export * from './ledger.api';
