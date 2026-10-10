import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import reelsReducer from "./slices/reelsSlice";
import competitionsReducer from "./slices/competitionsSlice";
import uiReducer from "./slices/uiSlice";
import editorReducer from "./slices/editorSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    reels: reelsReducer,
    competitions: competitionsReducer,
    ui: uiReducer,
    editor: editorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

