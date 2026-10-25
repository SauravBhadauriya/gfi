import { combineReducers, configureStore, createAction } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import reelsReducer from "./slices/reelsSlice";
import competitionsReducer from "./slices/competitionsSlice";
import uiReducer from "./slices/uiSlice";
import editorReducer from "./slices/editorSlice";
import postingReducer from "./slices/postingSlice";

/** Dispatched on logout: every slice goes back to its initial state. */
export const resetStore = createAction("session/reset");

const appReducer = combineReducers({
  user: userReducer,
  reels: reelsReducer,
  competitions: competitionsReducer,
  ui: uiReducer,
  editor: editorReducer,
  posting: postingReducer,
});

const rootReducer: typeof appReducer = (state, action) =>
  appReducer(resetStore.match(action) ? undefined : state, action);

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
