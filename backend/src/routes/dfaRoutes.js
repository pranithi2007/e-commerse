const express = require('express');
const router = express.Router();
const {
  getDfaSpecification,
  validateTransition,
  getValidNextTransitions,
  getAllStates,
  isTerminalState,
  DFA_STATES,
  DFA_ACTIONS,
  DFA_TRANSITION_TABLE
} = require('../dfa/dfaOrderValidator');

// GET /api/dfa/spec & /api/dfa/definition
router.get(['/spec', '/definition'], (req, res) => {
  res.json({
    success: true,
    specification: getDfaSpecification()
  });
});

// GET /api/dfa/states
router.get('/states', (req, res) => {
  res.json({
    success: true,
    states: getAllStates()
  });
});

// POST /api/dfa/validate
router.post('/validate', (req, res) => {
  const { currentState, targetState, action } = req.body;

  if (!currentState) {
    return res.status(400).json({ success: false, error: 'Current state is required.' });
  }

  const result = validateTransition(currentState, targetState || action);
  res.json({
    success: true,
    result
  });
});

// POST /api/dfa/simulate (Simulate a sequence of events starting from S0)
router.post('/simulate', (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events)) {
    return res.status(400).json({ success: false, error: 'Events array is required.' });
  }

  let currentState = 'S0';
  const trace = [{
    step: 0,
    state: 'S0',
    stateLabel: DFA_STATES.S0.label,
    action: 'START',
    status: 'INITIAL_STATE'
  }];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const validation = validateTransition(currentState, event);

    if (!validation.isValid) {
      trace.push({
        step: i + 1,
        fromState: currentState,
        fromLabel: DFA_STATES[currentState]?.label || currentState,
        attemptedInput: event,
        status: 'REJECTED_DFA_VIOLATION',
        error: validation.errorMessage
      });
      return res.json({
        success: false,
        accepted: false,
        haltedAtStep: i + 1,
        finalState: currentState,
        trace,
        message: `Simulation halted due to DFA violation at step ${i + 1}: ${validation.errorMessage}`
      });
    }

    currentState = validation.toState;
    trace.push({
      step: i + 1,
      fromState: validation.fromState,
      toState: validation.toState,
      toLabel: validation.toLabel,
      action: validation.action,
      actionLabel: validation.actionLabel,
      status: 'TRANSITION_ACCEPTED',
      isTerminal: isTerminalState(currentState)
    });
  }

  res.json({
    success: true,
    accepted: true,
    finalState: currentState,
    isTerminal: isTerminalState(currentState),
    trace,
    message: `String of events successfully accepted by DFA. Order ended in state '${DFA_STATES[currentState]?.label}' (${currentState}).`
  });
});

module.exports = router;
