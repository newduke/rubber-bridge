import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import {
  HandEntry,
  RubberData,
  Contract,
  Doubled,
  Side,
  calculateHandScores,
  computeRubberState,
  declarerSide,
  calcUnfinishedBonus,
} from '../utils/scoring';
import { loadData, saveData, makeNewRubber, AppStorageData } from '../utils/storage';

// ─── State & Actions ──────────────────────────────────────────────────────────

interface AppState {
  currentRubber: RubberData;
  history: RubberData[];
  loaded: boolean;
}

type Action =
  | { type: 'LOAD'; payload: AppStorageData }
  | {
      type: 'ADD_HAND';
      payload: {
        contract: Contract;
        result: number;
        doubled: Doubled;
        honours?: { side: Side; value: 100 | 150 };
      };
    }
  | { type: 'UNDO_LAST_HAND' }
  | { type: 'NEW_RUBBER'; payload?: { withUnfinishedBonus: boolean } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return {
        currentRubber: action.payload.currentRubber,
        history: action.payload.history,
        loaded: true,
      };

    case 'ADD_HAND': {
      const { contract, result, doubled, honours } = action.payload;
      const current = state.currentRubber;

      // Compute current rubber state to determine vulnerability
      const rubberState = computeRubberState(current.hands);
      if (rubberState.rubberComplete) return state; // no more hands in a complete rubber

      const side = declarerSide(contract.declarer);
      const vulnerable = side === 'NS' ? rubberState.nsVul : rubberState.ewVul;

      const scores = calculateHandScores(contract, result, vulnerable, doubled, honours);

      const entry: HandEntry = {
        id: `hand_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        contract,
        result,
        doubled,
        honours,
        scores,
        timestamp: Date.now(),
        vulnerable,
      };

      const updatedRubber: RubberData = {
        ...current,
        hands: [...current.hands, entry],
      };

      // Check if rubber is now complete → record completedAt
      const newState = computeRubberState(updatedRubber.hands);
      if (newState.rubberComplete && !updatedRubber.completedAt) {
        updatedRubber.completedAt = Date.now();
      }

      return { ...state, currentRubber: updatedRubber };
    }

    case 'UNDO_LAST_HAND': {
      const hands = state.currentRubber.hands;
      if (hands.length === 0) return state;
      const updatedRubber: RubberData = {
        ...state.currentRubber,
        hands: hands.slice(0, -1),
        completedAt: undefined, // un-complete if we undo the completing hand
      };
      return { ...state, currentRubber: updatedRubber };
    }

    case 'NEW_RUBBER': {
      const rubberState = computeRubberState(state.currentRubber.hands);
      let finishedRubber = state.currentRubber;

      if (action.payload?.withUnfinishedBonus && !rubberState.rubberComplete) {
        const bonus = calcUnfinishedBonus(rubberState);
        finishedRubber = {
          ...finishedRubber,
          completedAt: finishedRubber.completedAt ?? Date.now(),
          unfinishedNsBonus: bonus.nsBonus,
          unfinishedEwBonus: bonus.ewBonus,
        };
      }

      // Only keep in history if it has at least one hand
      const history =
        finishedRubber.hands.length > 0
          ? [finishedRubber, ...state.history]
          : state.history;

      return {
        ...state,
        currentRubber: makeNewRubber(),
        history,
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface RubberContextValue {
  state: AppState;
  addHand: (
    contract: Contract,
    result: number,
    doubled: Doubled,
    honours?: { side: Side; value: 100 | 150 },
  ) => void;
  undoLastHand: () => void;
  newRubber: (withUnfinishedBonus?: boolean) => void;
}

const RubberContext = createContext<RubberContextValue | null>(null);

export function RubberProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    currentRubber: makeNewRubber(),
    history: [],
    loaded: false,
  });

  // Load from storage on mount
  useEffect(() => {
    loadData().then((data) => dispatch({ type: 'LOAD', payload: data }));
  }, []);

  // Persist to storage on every change (after initial load)
  useEffect(() => {
    if (!state.loaded) return;
    saveData({ currentRubber: state.currentRubber, history: state.history });
  }, [state.currentRubber, state.history, state.loaded]);

  const addHand = useCallback(
    (
      contract: Contract,
      result: number,
      doubled: Doubled,
      honours?: { side: Side; value: 100 | 150 },
    ) => {
      dispatch({ type: 'ADD_HAND', payload: { contract, result, doubled, honours } });
    },
    [],
  );

  const undoLastHand = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_HAND' });
  }, []);

  const newRubber = useCallback((withUnfinishedBonus = false) => {
    dispatch({ type: 'NEW_RUBBER', payload: { withUnfinishedBonus } });
  }, []);

  return (
    <RubberContext.Provider value={{ state, addHand, undoLastHand, newRubber }}>
      {children}
    </RubberContext.Provider>
  );
}

export function useRubber(): RubberContextValue {
  const ctx = useContext(RubberContext);
  if (!ctx) throw new Error('useRubber must be used within RubberProvider');
  return ctx;
}
