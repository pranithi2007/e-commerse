/**
 * Automated Test Suite for DFA Order Validator
 * Validates formal automaton rules, transitions, terminal states, and rejections.
 */

const {
  DFA_STATES,
  DFA_ACTIONS,
  validateTransition,
  getValidNextTransitions,
  isTerminalState,
  normalizeState
} = require('./src/dfa/dfaOrderValidator');

console.log('================================================================');
console.log('  TESTING DETERMINISTIC FINITE AUTOMATON (DFA) ORDER VALIDATOR  ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testDescription) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test #${totalTests}: ${testDescription}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test #${totalTests}: ${testDescription}`);
    process.exitCode = 1;
  }
}

// 1. Initial State & State Normalization
assert(normalizeState('S0') === 'S0', 'S0 normalizes to S0');
assert(normalizeState('order_placed') === 'S0', 'order_placed normalizes to S0');
assert(normalizeState('Order Confirmed') === 'S1', "'Order Confirmed' normalizes to S1");
assert(normalizeState('INVALID_STATE') === null, 'Unknown state returns null');

// 2. Valid Transitions Testing
console.log('\n--- Testing Valid Transitions ---');

// S0 -> S1
const t1 = validateTransition('S0', 'S1');
assert(t1.isValid && t1.toState === 'S1' && t1.action === 'CONFIRM_ORDER', 'Valid transition: S0 -> S1 (Confirm Order)');

// S0 -> S6
const t2 = validateTransition('S0', 'S6');
assert(t2.isValid && t2.toState === 'S6' && t2.action === 'CANCEL_ORDER', 'Valid transition: S0 -> S6 (Cancel Order)');

// S1 -> S2
const t3 = validateTransition('S1', 'S2');
assert(t3.isValid && t3.toState === 'S2' && t3.action === 'START_PROCESSING', 'Valid transition: S1 -> S2 (Start Processing)');

// S1 -> S6
const t4 = validateTransition('S1', 'S6');
assert(t4.isValid && t4.toState === 'S6' && t4.action === 'CANCEL_ORDER', 'Valid transition: S1 -> S6 (Cancel Order)');

// S2 -> S3
const t5 = validateTransition('S2', 'S3');
assert(t5.isValid && t5.toState === 'S3' && t5.action === 'SHIP_ORDER', 'Valid transition: S2 -> S3 (Ship Order)');

// S3 -> S4
const t6 = validateTransition('S3', 'S4');
assert(t6.isValid && t6.toState === 'S4' && t6.action === 'OUT_FOR_DELIVERY', 'Valid transition: S3 -> S4 (Out for Delivery)');

// S4 -> S5
const t7 = validateTransition('S4', 'S5');
assert(t7.isValid && t7.toState === 'S5' && t7.action === 'DELIVER_ORDER', 'Valid transition: S4 -> S5 (Deliver Order)');

// 3. Testing Valid Action Codes as Inputs
console.log('\n--- Testing Action Code Inputs ---');
const act1 = validateTransition('S0', 'CONFIRM_ORDER');
assert(act1.isValid && act1.toState === 'S1', "Action input 'CONFIRM_ORDER' from S0 transitions to S1");

const act2 = validateTransition('S1', 'START_PROCESSING');
assert(act2.isValid && act2.toState === 'S2', "Action input 'START_PROCESSING' from S1 transitions to S2");

// 4. Testing Invalid Transitions (MUST BE REJECTED)
console.log('\n--- Testing Invalid Transitions (Rejections) ---');

// S0 directly to S2 (Skipping confirmation)
const inv1 = validateTransition('S0', 'S2');
assert(!inv1.isValid && inv1.errorMessage.includes('Invalid state transition'), 'Reject invalid transition: S0 -> S2 directly');

// S0 directly to S5 (Skipping to delivered)
const inv2 = validateTransition('S0', 'S5');
assert(!inv2.isValid, 'Reject invalid transition: S0 -> S5 directly');

// S2 to S6 (Processing cannot be cancelled once in warehouse)
const inv3 = validateTransition('S2', 'S6');
assert(!inv3.isValid, 'Reject invalid transition: S2 -> S6 (Cannot cancel once processing)');

// S3 to S5 (Skipping out for delivery)
const inv4 = validateTransition('S3', 'S5');
assert(!inv4.isValid, 'Reject invalid transition: S3 -> S5 directly');

// Backward transitions
const inv5 = validateTransition('S3', 'S2');
assert(!inv5.isValid, 'Reject backward transition: S3 -> S2');

// Self transitions
const inv6 = validateTransition('S1', 'S1');
assert(!inv6.isValid && inv6.errorMessage.includes('Self-transition'), 'Reject self-transition: S1 -> S1');

// 5. Testing Terminal / Absorbing States (S5 and S6 Immutable)
console.log('\n--- Testing Terminal States (Immutability) ---');

assert(isTerminalState('S5') === true, 'S5 (Delivered) is terminal');
assert(isTerminalState('S6') === true, 'S6 (Cancelled) is terminal');
assert(isTerminalState('S2') === false, 'S2 (Processing) is not terminal');

// Attempting to modify S5 (Delivered)
const term1 = validateTransition('S5', 'S6');
assert(!term1.isValid && term1.errorMessage.includes('terminal state'), 'Reject modifying Delivered (S5) to Cancelled (S6)');

const term2 = validateTransition('S5', 'S0');
assert(!term2.isValid && term2.errorMessage.includes('terminal state'), 'Reject modifying Delivered (S5) back to S0');

// Attempting to modify S6 (Cancelled)
const term3 = validateTransition('S6', 'S1');
assert(!term3.isValid && term3.errorMessage.includes('terminal state'), 'Reject modifying Cancelled (S6) to Confirmed (S1)');

const term4 = validateTransition('S6', 'S5');
assert(!term4.isValid && term4.errorMessage.includes('terminal state'), 'Reject modifying Cancelled (S6) to Delivered (S5)');

// 6. Allowed transitions helper
console.log('\n--- Testing Allowed Transitions Helper ---');
const s0Next = getValidNextTransitions('S0');
assert(s0Next.length === 2 && s0Next.some(t => t.targetState === 'S1') && s0Next.some(t => t.targetState === 'S6'), 'S0 has exactly 2 allowed transitions (S1, S6)');

const s2Next = getValidNextTransitions('S2');
assert(s2Next.length === 1 && s2Next[0].targetState === 'S3', 'S2 has exactly 1 allowed transition (S3)');

const s5Next = getValidNextTransitions('S5');
assert(s5Next.length === 0, 'S5 has 0 allowed transitions (Terminal)');

console.log(`\n================================================================`);
console.log(`  DFA TEST SUITE RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`================================================================\n`);
