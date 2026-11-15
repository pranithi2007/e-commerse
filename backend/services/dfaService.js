/**
 * Deterministic Finite Automaton (DFA) Service for Order Management
 *
 * Formal Definition:
 * M = (Q, Σ, δ, q0, F)
 *
 * Q (States):
 *   S0: Order Placed (Initial State)
 *   S1: Order Confirmed
 *   S2: Processing
 *   S3: Shipped
 *   S4: Out for Delivery
 *   S5: Delivered (Final State / Terminal)
 *   S6: Cancelled (Terminal State)
 *
 * Σ (Input Alphabet):
 *   PLACE, CONFIRM, PROCESS, SHIP, OUT_FOR_DELIVERY, DELIVER, CANCEL
 *
 * q0 (Initial State):
 *   S0
 *
 * F (Set of Final / Accepting States):
 *   { S5 }
 *
 * Terminal States:
 *   { S5, S6 } -> No transitions permitted from terminal states.
 *
 * δ (Transition Function):
 *   δ(S0, CONFIRM)          = S1
 *   δ(S0, CANCEL)           = S6
 *   δ(S1, PROCESS)          = S2
 *   δ(S1, CANCEL)           = S6
 *   δ(S2, SHIP)             = S3
 *   δ(S2, CANCEL)           = S6
 *   δ(S3, OUT_FOR_DELIVERY) = S4
 *   δ(S4, DELIVER)          = S5
 *   All other transitions are undefined and must be REJECTED.
 */

const DFA_STATES = {
  S0: {
    code: 'S0',
    name: 'Order Placed',
    description: 'Order has been placed by customer and awaits admin confirmation.',
    isInitial: true,
    isFinal: false,
    isTerminal: false,
    color: '#3B82F6' // Blue
  },
  S1: {
    code: 'S1',
    name: 'Order Confirmed',
    description: 'Admin has verified payment/inventory and confirmed the order.',
    isInitial: false,
    isFinal: false,
    isTerminal: false,
    color: '#8B5CF6' // Purple
  },
  S2: {
    code: 'S2',
    name: 'Processing',
    description: 'Order items are being picked and packed at fulfillment warehouse.',
    isInitial: false,
    isFinal: false,
    isTerminal: false,
    color: '#F59E0B' // Amber
  },
  S3: {
    code: 'S3',
    name: 'Shipped',
    description: 'Package handed over to shipping courier. Cancellation window closed.',
    isInitial: false,
    isFinal: false,
    isTerminal: false,
    color: '#06B6D4' // Cyan
  },
  S4: {
    code: 'S4',
    name: 'Out for Delivery',
    description: 'Package with courier delivery agent on local delivery route.',
    isInitial: false,
    isFinal: false,
    isTerminal: false,
    color: '#EC4899' // Pink
  },
  S5: {
    code: 'S5',
    name: 'Delivered',
    description: 'Package delivered to recipient. Successful terminal accepting state.',
    isInitial: false,
    isFinal: true,
    isTerminal: true,
    color: '#10B981' // Green
  },
  S6: {
    code: 'S6',
    name: 'Cancelled',
    description: 'Order cancelled by customer or admin. Terminal non-accepting state.',
    isInitial: false,
    isFinal: false,
    isTerminal: true,
    color: '#EF4444' // Red
  }
};

const DFA_ALPHABET = {
  PLACE: {
    symbol: 'PLACE',
    name: 'Place Order',
    description: 'Customer initiates order placement'
  },
  CONFIRM: {
    symbol: 'CONFIRM',
    name: 'Confirm Order',
    description: 'Admin confirms inventory and payment verification'
  },
  PROCESS: {
    symbol: 'PROCESS',
    name: 'Process Order',
    description: 'Warehouse begins packing and item assembly'
  },
  SHIP: {
    symbol: 'SHIP',
    name: 'Ship Package',
    description: 'Handed over to carrier transit network'
  },
  OUT_FOR_DELIVERY: {
    symbol: 'OUT_FOR_DELIVERY',
    name: 'Out for Delivery',
    description: 'Dispatched to last-mile delivery agent'
  },
  DELIVER: {
    symbol: 'DELIVER',
    name: 'Mark Delivered',
    description: 'Successfully handed over to customer'
  },
  CANCEL: {
    symbol: 'CANCEL',
    name: 'Cancel Order',
    description: 'Order cancellation initiated before shipment'
  }
};

const DFA_TRANSITIONS = {
  S0: {
    CONFIRM: 'S1',
    CANCEL: 'S6'
  },
  S1: {
    PROCESS: 'S2',
    CANCEL: 'S6'
  },
  S2: {
    SHIP: 'S3',
    CANCEL: 'S6'
  },
  S3: {
    OUT_FOR_DELIVERY: 'S4'
  },
  S4: {
    DELIVER: 'S5'
  },
  S5: {}, // Terminal state: no outbound transitions
  S6: {}  // Terminal state: no outbound transitions
};

const INITIAL_STATE = 'S0';
const FINAL_STATES = ['S5'];
const TERMINAL_STATES = ['S5', 'S6'];

/**
 * Validates a transition against the DFA rules.
 * @param {string} currentStateCode - Current state code (e.g. 'S0')
 * @param {string} inputSymbol - Input alphabet symbol (e.g. 'CONFIRM')
 * @returns {object} Validation result
 */
function validateTransition(currentStateCode, inputSymbol) {
  const currentState = DFA_STATES[currentStateCode];
  const symbol = DFA_ALPHABET[inputSymbol];

  // Check state validity
  if (!currentState) {
    return {
      accepted: false,
      valid: false,
      currentState: currentStateCode,
      inputSymbol,
      nextState: null,
      reason: `Invalid state '${currentStateCode}'. Not present in DFA state set Q.`
    };
  }

  // Check symbol validity
  if (!symbol) {
    return {
      accepted: false,
      valid: false,
      currentState: currentStateCode,
      inputSymbol,
      nextState: null,
      reason: `Invalid input symbol '${inputSymbol}'. Not present in DFA alphabet Σ.`
    };
  }

  // Check if current state is terminal
  if (TERMINAL_STATES.includes(currentStateCode)) {
    return {
      accepted: false,
      valid: false,
      currentState: currentStateCode,
      inputSymbol,
      nextState: null,
      reason: `Current state '${currentStateCode} (${currentState.name})' is a terminal state. No transitions are permitted from terminal states.`
    };
  }

  // Check transition function δ(q, σ)
  const stateTransitions = DFA_TRANSITIONS[currentStateCode] || {};
  const targetStateCode = stateTransitions[inputSymbol];

  if (!targetStateCode) {
    return {
      accepted: false,
      valid: false,
      currentState: currentStateCode,
      inputSymbol,
      nextState: null,
      reason: `Undefined transition: δ(${currentStateCode}, ${inputSymbol}) is not defined in transition function δ. Transition rejected by DFA.`
    };
  }

  const nextState = DFA_STATES[targetStateCode];

  return {
    accepted: true,
    valid: true,
    currentState: currentStateCode,
    currentStateName: currentState.name,
    inputSymbol,
    nextState: targetStateCode,
    nextStateName: nextState.name,
    isFinal: nextState.isFinal,
    isTerminal: nextState.isTerminal,
    reason: `Valid transition: δ(${currentStateCode}, ${inputSymbol}) -> ${targetStateCode} (${nextState.name}) accepted by DFA.`
  };
}

/**
 * Returns list of allowed transitions from a given state.
 * @param {string} currentStateCode
 */
function getValidNextTransitions(currentStateCode) {
  const transitions = DFA_TRANSITIONS[currentStateCode] || {};
  return Object.keys(transitions).map((symbol) => ({
    inputSymbol: symbol,
    symbolName: DFA_ALPHABET[symbol]?.name || symbol,
    nextStateCode: transitions[symbol],
    nextStateName: DFA_STATES[transitions[symbol]]?.name || transitions[symbol]
  }));
}

/**
 * Check if an order in a given state can be cancelled.
 * @param {string} currentStateCode
 */
function isCancellable(currentStateCode) {
  return ['S0', 'S1', 'S2'].includes(currentStateCode);
}

/**
 * Runs a complete simulation on a sequence of symbols from a start state.
 * @param {string} startStateCode - default 'S0'
 * @param {string[]} symbolSequence - Array of input symbols
 */
function simulateSequence(startStateCode = INITIAL_STATE, symbolSequence = []) {
  let currentStateCode = startStateCode;
  const trace = [];
  let isHalted = false;
  let haltReason = null;

  for (let i = 0; i < symbolSequence.length; i++) {
    const symbol = symbolSequence[i];
    const validation = validateTransition(currentStateCode, symbol);

    trace.push({
      step: i + 1,
      fromState: currentStateCode,
      fromStateName: DFA_STATES[currentStateCode]?.name || 'Unknown',
      inputSymbol: symbol,
      toState: validation.nextState,
      toStateName: validation.nextStateName || 'REJECTED',
      accepted: validation.accepted,
      reason: validation.reason
    });

    if (!validation.accepted) {
      isHalted = true;
      haltReason = validation.reason;
      break;
    }

    currentStateCode = validation.nextState;
  }

  const isFinalAccepted = !isHalted && FINAL_STATES.includes(currentStateCode);

  return {
    startState: startStateCode,
    endState: currentStateCode,
    isFinalAccepted,
    isTerminal: TERMINAL_STATES.includes(currentStateCode),
    isHalted,
    haltReason,
    trace,
    totalSteps: trace.length
  };
}

module.exports = {
  DFA_STATES,
  DFA_ALPHABET,
  DFA_TRANSITIONS,
  INITIAL_STATE,
  FINAL_STATES,
  TERMINAL_STATES,
  validateTransition,
  getValidNextTransitions,
  isCancellable,
  simulateSequence
};
