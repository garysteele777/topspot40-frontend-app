// @ts-nocheck -- Node's test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSingleChoiceContinue} from '../src/lib/interactions/singleChoiceContinue.js';

function setup({disabled = false} = {}) {
    let selected = null;
    let selections = 0;
    let continuations = 0;
    let isDisabled = disabled;

    const control = createSingleChoiceContinue({
        getSelected: () => selected,
        select: (choice) => {
            selected = choice;
            selections += 1;
        },
        onContinue: () => {
            continuations += 1;
        },
        isContinueDisabled: () => isDisabled,
        duplicateWindowMs: 50
    });

    return {
        control,
        get selected() { return selected; },
        get selections() { return selections; },
        get continuations() { return continuations; },
        setDisabled(value) { isDisabled = value; }
    };
}

test('first pointer activation selects only', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});

    assert.equal(screen.selected, 'rock');
    assert.equal(screen.selections, 1);
    assert.equal(screen.continuations, 0);
});

test('second pointer activation of the selected choice continues', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});
    screen.control.select('rock', {detail: 1});

    assert.equal(screen.continuations, 1);
});

test('changing choice only changes the selection', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});
    screen.control.select('pop', {detail: 1});

    assert.equal(screen.selected, 'pop');
    assert.equal(screen.continuations, 0);
});

test('a disabled Continue cannot be bypassed by selecting again', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});
    screen.setDisabled(true);
    screen.control.select('rock', {detail: 1});

    assert.equal(screen.continuations, 0);
});

test('nearby repeated activations navigate only once', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});
    screen.control.select('rock', {detail: 1});
    screen.control.continue();
    screen.control.select('rock', {detail: 1});

    assert.equal(screen.continuations, 1);
});

test('keyboard activation does not invoke Continue a second time', () => {
    const screen = setup();

    screen.control.select('rock', {detail: 1});
    screen.control.select('rock', {detail: 0});

    assert.equal(screen.selections, 2);
    assert.equal(screen.continuations, 0);
});
