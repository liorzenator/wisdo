import sinon from 'sinon';
import { domainEvents } from '../src/utils/domainEvents.js';

export const mochaHooks = {
    beforeEach() {
        // Stub domainEvents.emit globally for all tests to prevent
        // triggering background feed refreshes that require a DB connection.
        sinon.stub(domainEvents, 'emit');
    },
    afterEach() {
        sinon.restore();
    }
};
