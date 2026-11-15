/**
 * DFA Order Validator Module
 * 
 * Implements a formal Deterministic Finite Automaton (DFA) M = (Q, Σ, δ, q0, F)
 * to strictly validate and control order status transitions in an E-Commerce system.
 * 
 * Formal Definition:
 * - Q (Set of States): { S0, S1, S2, S3, S4, S5, S6 }
 *   S0: Order Placed
 *   S1: Order Confirmed
 *   S2: Processing
 *   S3: Shipped
 *   S4: Out for Delivery
 *   S5: Delivered (Terminal)
 *   S6: Cancelled (Terminal)
 * 
 * - Σ (Alphabet of Input Events / Actions):
 *   { CONFIRM_ORDER, CANCEL_ORDER, START_PROCESSING, SHIP_ORDER, OUT_FOR_DELIVERY, DELIVER_ORDER }
 * 
 * - δ (Transition Function Q × Σ → Q):
 *   δ(S0, CONFIRM_ORDER)    = S1
 *   δ(S0, CANCEL_ORDER)     = S6
 *   δ(S1, START_PROCESSING) = S2
 *   δ(S1, CANCEL_ORDER)     = S6
 *   δ(S2, SHIP_ORDER)       = S3
 *   δ(S3, OUT_FOR_DELIVERY) = S4
 *   δ(S4, DELIVER_ORDER)    = S5
 * 
 * - q0 (Initial State): S0 (Order Placed)
 * 
 * - F (Set of Final / Terminal States): { S5, S6 }
 *   Delivered (S5) and Cancelled (S6) cannot be modified once reached.
 */

// 1. Definition of States
const DFA_STATES = Object.freeze({
  S0: {
    id: 'S0',
    name: 'ORDER_PLACED',
    label: 'Order Placed',
    stepNumber: 0,
    isTerminal: false,
    badgeClass: 'badge-primary',
    color: '#0d6efd',
    icon: 'bi-cart-check-fill',
    description: 'The order has been created and received by the system.'
  },
  S1: {
    id: 'S1',
    name: 'ORDER_CONFIRMED',
    label: 'Order Confirmed',
    stepNumber: 1,
    isTerminal: false,
    badgeClass: 'badge-info',
    color: '#0dcaf0',
    icon: 'bi-patch-check-fill',
    description: 'Payment verified and order accepted by the store.'
  },
  S2: {
    id: 'S2',
    name: 'PROCESSING',
    label: 'Processing',
    stepNumber: 2,
    isTerminal: false,
    badgeClass: 'badge-warning',
    color: '#ffc107',
    icon: 'bi-gear-wide-connected',
    description: 'Items are being picked, quality-checked, and packed in warehouse.'
  },
  S3: {
    id: 'S3',
    name: 'SHIPPED',
    label: 'Shipped',
    stepNumber: 3,
    isTerminal: false,
    badgeClass: 'badge-secondary',
    color: '#6c757d',
    icon: 'bi-truck',
    description: 'Package has been handed over to the courier logistics partner.'
  },
  S4: {
    id: 'S4',
    name: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    stepNumber: 4,
    isTerminal: false,
    badgeClass: 'badge-indigo',
    color: '#6610f2',
    icon: 'bi-geo-alt-fill',
    description: 'Courier agent has left the local hub and is en route to customer.'
  },
  S5: {
    id: 'S5',
    name: 'DELIVERED',
    label: 'Delivered',
    stepNumber: 5,
    isTerminal: true,
    badgeClass: 'badge-success',
    color: '#198754',
    icon: 'bi-check-circle-fill',
    description: 'Order successfully delivered to customer. Terminal state (Immutable).'
  },
  S6: {
    id: 'S6',
    name: 'CANCELLED',
    label: 'Cancelled',
    stepNumber: -1,
    isTerminal: true,
    badgeClass: 'badge-danger',
    color: '#dc3545',
    icon: 'bi-x-circle-fill',
    description: 'Order has been cancelled. Terminal state (Immutable).'
  }
});

// 2. Definition of Transition Actions (Alphabet Σ)
const DFA_ACTIONS = Object.freeze({
  CONFIRM_ORDER: {
    code: 'CONFIRM_ORDER',
    label: 'Confirm Order',
    targetState: 'S1',
    description: 'Accept order and verify inventory/payment.'
  },
  START_PROCESSING: {
    code: 'START_PROCESSING',
    label: 'Start Processing',
    targetState: 'S2',
    description: 'Send items to warehouse packing station.'
  },
  SHIP_ORDER: {
    code: 'SHIP_ORDER',
    label: 'Ship Order',
    targetState: 'S3',
    description: 'Dispatch packed parcel via courier.'
  },
  OUT_FOR_DELIVERY: {
    code: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    targetState: 'S4',
    description: 'Package is on final delivery vehicle with courier.'
  },
  DELIVER_ORDER: {
    code: 'DELIVER_ORDER',
    label: 'Deliver Order',
    targetState: 'S5',
    description: 'Mark order as handed to recipient (Final Delivered state).'
  },
  CANCEL_ORDER: {
    code: 'CANCEL_ORDER',
    label: 'Cancel Order',
    targetState: 'S6',
    description: 'Cancel order and release reserved stock (Final Cancelled state).'
  }
});

// 3. Strict Transition Table δ: State -> Valid Transitions
// Maps each currentState to an array of valid transition objects
const DFA_TRANSITION_TABLE = Object.freeze({
  S0: [
    { targetState: 'S1', action: 'CONFIRM_ORDER', actionLabel: 'Confirm Order' },
    { targetState: 'S6', action: 'CANCEL_ORDER', actionLabel: 'Cancel Order' }
  ],
  S1: [
    { targetState: 'S2', action: 'START_PROCESSING', actionLabel: 'Start Processing' },
    { targetState: 'S6', action: 'CANCEL_ORDER', actionLabel: 'Cancel Order' }
  ],
  S2: [
    { targetState: 'S3', action: 'SHIP_ORDER', actionLabel: 'Ship Order' }
  ],
  S3: [
    { targetState: 'S4', action: 'OUT_FOR_DELIVERY', actionLabel: 'Out for Delivery' }
  ],
  S4: [
    { targetState: 'S5', action: 'DELIVER_ORDER', actionLabel: 'Deliver Order' }
  ],
  S5: [], // Terminal State: Immutable, no outgoing transitions
  S6: []  // Terminal State: Immutable, no outgoing transitions
});

/**
 * Normalizes input state key or name to state ID (e.g., 'S0', 'ORDER_PLACED' -> 'S0')
 * @param {string} stateInput 
 * @returns {string|null} State ID like 'S0' or null if unrecognized
 */
function normalizeState(stateInput) {
  if (!stateInput) return null;
  const upper = String(stateInput).trim().toUpperCase();
  if (DFA_STATES[upper]) return upper;

  // Search by state name or label
  for (const [key, state] of Object.entries(DFA_STATES)) {
    if (state.name === upper || state.label.toUpperCase() === upper) {
      return key;
    }
  }
  return null;
}

/**
 * Checks whether a state is a final/terminal state in the DFA.
 * @param {string} stateInput 
 * @returns {boolean}
 */
function isTerminalState(stateInput) {
  const stateId = normalizeState(stateInput);
  if (!stateId) return false;
  return Boolean(DFA_STATES[stateId].isTerminal);
}

/**
 * Gets all allowed next transitions from a given state.
 * @param {string} currentStateInput 
 * @returns {Array<{ targetState: string, targetLabel: string, action: string, actionLabel: string, badgeClass: string }>}
 */
function getValidNextTransitions(currentStateInput) {
  const stateId = normalizeState(currentStateInput);
  if (!stateId || !DFA_TRANSITION_TABLE[stateId]) {
    return [];
  }

  return DFA_TRANSITION_TABLE[stateId].map(tr => ({
    targetState: tr.targetState,
    targetLabel: DFA_STATES[tr.targetState].label,
    action: tr.action,
    actionLabel: tr.actionLabel,
    badgeClass: DFA_STATES[tr.targetState].badgeClass,
    color: DFA_STATES[tr.targetState].color,
    icon: DFA_STATES[tr.targetState].icon
  }));
}

/**
 * Core DFA Validation Engine
 * Evaluates whether a transition from currentState to targetState (or action) is valid according to the DFA.
 * 
 * @param {string} currentStateInput - Starting DFA state (e.g. 'S0', 'S1', 'ORDER_PLACED')
 * @param {string} targetInput - Intended next state ID, state name, or action code (e.g. 'S1', 'S6', 'START_PROCESSING')
 * @returns {{
 *   isValid: boolean,
 *   fromState: string,
 *   fromLabel: string,
 *   toState: string|null,
 *   toLabel: string|null,
 *   action: string|null,
 *   actionLabel: string|null,
 *   errorMessage: string|null,
 *   reason: string
 * }}
 */
function validateTransition(currentStateInput, targetInput) {
  const fromState = normalizeState(currentStateInput);

  if (!fromState) {
    return {
      isValid: false,
      fromState: currentStateInput,
      fromLabel: 'Unknown State',
      toState: null,
      toLabel: null,
      action: null,
      actionLabel: null,
      errorMessage: `Invalid DFA State: Starting state '${currentStateInput}' does not exist in state set Q.`,
      reason: 'NON_EXISTENT_SOURCE_STATE'
    };
  }

  const fromMeta = DFA_STATES[fromState];

  // Rule 1: Delivered (S5) orders cannot be modified
  if (fromState === 'S5') {
    return {
      isValid: false,
      fromState: 'S5',
      fromLabel: fromMeta.label,
      toState: null,
      toLabel: null,
      action: null,
      actionLabel: null,
      errorMessage: `DFA Violation: Order is in terminal state 'Delivered' (S5). Delivered orders cannot be modified.`,
      reason: 'TERMINAL_STATE_DELIVERED'
    };
  }

  // Rule 2: Cancelled (S6) orders cannot be modified
  if (fromState === 'S6') {
    return {
      isValid: false,
      fromState: 'S6',
      fromLabel: fromMeta.label,
      toState: null,
      toLabel: null,
      action: null,
      actionLabel: null,
      errorMessage: `DFA Violation: Order is in terminal state 'Cancelled' (S6). Cancelled orders cannot be modified.`,
      reason: 'TERMINAL_STATE_CANCELLED'
    };
  }

  // Determine what target is requested: it could be a target state or an action code
  let targetState = normalizeState(targetInput);
  let actionCode = null;

  if (!targetState) {
    // Check if targetInput corresponds to an action in DFA_ACTIONS
    const upperInput = String(targetInput).trim().toUpperCase();
    if (DFA_ACTIONS[upperInput]) {
      actionCode = upperInput;
      targetState = DFA_ACTIONS[upperInput].targetState;
    }
  }

  if (!targetState) {
    return {
      isValid: false,
      fromState: fromState,
      fromLabel: fromMeta.label,
      toState: null,
      toLabel: null,
      action: null,
      actionLabel: null,
      errorMessage: `DFA Violation: Target status or action '${targetInput}' is unrecognized in alphabet Σ or state set Q.`,
      reason: 'INVALID_TARGET'
    };
  }

  const toMeta = DFA_STATES[targetState];

  // Self-transition check
  if (fromState === targetState) {
    return {
      isValid: false,
      fromState: fromState,
      fromLabel: fromMeta.label,
      toState: targetState,
      toLabel: toMeta.label,
      action: null,
      actionLabel: null,
      errorMessage: `DFA Violation: Self-transition rejected. The order is already in state '${toMeta.label}' (${targetState}).`,
      reason: 'SELF_TRANSITION'
    };
  }

  // Find valid transition from current state in transition table δ
  const validTransitions = DFA_TRANSITION_TABLE[fromState] || [];
  const match = validTransitions.find(t => t.targetState === targetState);

  if (!match) {
    // Transition does not exist in δ
    const allowedTransitionsList = validTransitions
      .map(t => `'${DFA_STATES[t.targetState].label}' (${t.targetState}) via ${t.actionLabel}`)
      .join(', ');

    return {
      isValid: false,
      fromState: fromState,
      fromLabel: fromMeta.label,
      toState: targetState,
      toLabel: toMeta.label,
      action: actionCode || 'UNKNOWN',
      actionLabel: null,
      errorMessage: `DFA Violation: Invalid state transition! Cannot transition from '${fromMeta.label}' (${fromState}) directly to '${toMeta.label}' (${targetState}). ` +
                    (allowedTransitionsList 
                      ? `Allowed transition(s) from ${fromState}: [ ${allowedTransitionsList} ].`
                      : `No outgoing transitions allowed from ${fromState}.`),
      reason: 'INVALID_TRANSITION'
    };
  }

  // Valid transition found!
  return {
    isValid: true,
    fromState: fromState,
    fromLabel: fromMeta.label,
    toState: targetState,
    toLabel: toMeta.label,
    action: match.action,
    actionLabel: match.actionLabel,
    errorMessage: null,
    reason: 'VALID_TRANSITION'
  };
}

/**
 * Returns metadata for a given state
 */
function getStateMetadata(stateInput) {
  const stateId = normalizeState(stateInput);
  return stateId ? DFA_STATES[stateId] : null;
}

/**
 * Returns all states with metadata
 */
function getAllStates() {
  return Object.values(DFA_STATES);
}

/**
 * Returns the formal definition of the DFA
 */
function getDfaSpecification() {
  return {
    name: 'Order Lifecycle Deterministic Finite Automaton',
    tuple: 'M = (Q, Σ, δ, q0, F)',
    states: DFA_STATES,
    alphabet: DFA_ACTIONS,
    initialState: 'S0',
    finalStates: ['S5', 'S6'],
    transitionTable: DFA_TRANSITION_TABLE,
    rules: [
      'Every order starts at initial state S0 (Order Placed).',
      'Transitions are deterministic: for any state S and event e, δ(S, e) has at most one next state.',
      'S5 (Delivered) is an absorbing/terminal state: no outgoing transitions are permitted.',
      'S6 (Cancelled) is an absorbing/terminal state: no outgoing transitions are permitted.',
      'Any state change attempt not explicitly defined in transition function δ is strictly rejected.'
    ]
  };
}

// Export module for both Node.js CommonJS and potential browser window usage
const dfaModule = {
  DFA_STATES,
  DFA_ACTIONS,
  DFA_TRANSITION_TABLE,
  normalizeState,
  isTerminalState,
  getValidNextTransitions,
  validateTransition,
  getStateMetadata,
  getAllStates,
  getDfaSpecification
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = dfaModule;
}
if (typeof window !== 'undefined') {
  window.DFAOrderValidator = dfaModule;
}
