const dfaService = require('../services/dfaService');

console.log('--- Testing DFA Service Directly ---');

// Test 1: S0 -> CONFIRM -> S1
const test1 = dfaService.validateTransition('S0', 'CONFIRM');
console.log('Test 1 [S0 + CONFIRM]:', test1.accepted === true && test1.nextState === 'S1' ? 'PASS' : 'FAIL', test1);

// Test 2: S0 -> CANCEL -> S6
const test2 = dfaService.validateTransition('S0', 'CANCEL');
console.log('Test 2 [S0 + CANCEL]:', test2.accepted === true && test2.nextState === 'S6' ? 'PASS' : 'FAIL', test2);

// Test 3: S1 -> PROCESS -> S2
const test3 = dfaService.validateTransition('S1', 'PROCESS');
console.log('Test 3 [S1 + PROCESS]:', test3.accepted === true && test3.nextState === 'S2' ? 'PASS' : 'FAIL', test3);

// Test 4: S2 -> SHIP -> S3
const test4 = dfaService.validateTransition('S2', 'SHIP');
console.log('Test 4 [S2 + SHIP]:', test4.accepted === true && test4.nextState === 'S3' ? 'PASS' : 'FAIL', test4);

// Test 5: S3 -> OUT_FOR_DELIVERY -> S4
const test5 = dfaService.validateTransition('S3', 'OUT_FOR_DELIVERY');
console.log('Test 5 [S3 + OUT_FOR_DELIVERY]:', test5.accepted === true && test5.nextState === 'S4' ? 'PASS' : 'FAIL', test5);

// Test 6: S4 -> DELIVER -> S5
const test6 = dfaService.validateTransition('S4', 'DELIVER');
console.log('Test 6 [S4 + DELIVER]:', test6.accepted === true && test6.nextState === 'S5' ? 'PASS' : 'FAIL', test6);

// Test 7: S3 -> CANCEL (Invalid transition - cannot cancel shipped order)
const test7 = dfaService.validateTransition('S3', 'CANCEL');
console.log('Test 7 [S3 + CANCEL (Must REJECT)]:', test7.accepted === false ? 'PASS (REJECTED CORRECTLY)' : 'FAIL', test7.reason);

// Test 8: S5 (Terminal) -> any transition (Must REJECT)
const test8 = dfaService.validateTransition('S5', 'CONFIRM');
console.log('Test 8 [S5 Terminal (Must REJECT)]:', test8.accepted === false ? 'PASS (REJECTED CORRECTLY)' : 'FAIL', test8.reason);

// Test 9: Simulate full sequence
const sim1 = dfaService.simulateSequence('S0', ['CONFIRM', 'PROCESS', 'SHIP', 'OUT_FOR_DELIVERY', 'DELIVER']);
console.log('Test 9 [Full Sequence to S5]:', sim1.isFinalAccepted === true ? 'PASS' : 'FAIL', 'End state:', sim1.endState);

// Test 10: Simulate invalid sequence
const sim2 = dfaService.simulateSequence('S0', ['CONFIRM', 'DELIVER']);
console.log('Test 10 [Invalid Sequence]:', sim2.isHalted === true ? 'PASS (HALTED CORRECTLY)' : 'FAIL', 'Halt Reason:', sim2.haltReason);
