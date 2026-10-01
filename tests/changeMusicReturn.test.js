// @ts-nocheck -- direct Node coverage for return URL validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {isSafeJourneyReturnPath} from '../src/lib/journey/changeMusicReturn.js';

test('Change Music accepts the exact chooser and genre pages with their return state', () => {
    assert.equal(isSafeJourneyReturnPath('/journey-prototype/choose?program=collections&browse=collections'), true);
    assert.equal(isSafeJourneyReturnPath('/journey-prototype/genre?decade=1960s&language=en'), true);
    assert.equal(isSafeJourneyReturnPath('/options-v4'), false);
    assert.equal(isSafeJourneyReturnPath('//example.com/journey-prototype/choose'), false);
    assert.equal(isSafeJourneyReturnPath('/journey-prototype/choose-old'), false);
});
