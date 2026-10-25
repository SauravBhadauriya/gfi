import { useCallback, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addText, updateText } from "@/store/slices/editorSlice";
import type { TextDraft } from "./TextEditorOverlay";
import { DEFAULT_TEXT_SIZE } from "./textStyles";

const NEW_DRAFT: TextDraft = { text: "", fontId: "rubik", color: "#FFFFFF", background: "none", alignment: "center" };

/** Add / edit text items in the shared editorSlice (used by the preview screen and the editor). */
export function useTextEditing(startTime = 0) {
  const dispatch = useAppDispatch();
  const texts = useAppSelector((state) => state.editor.texts);
  const [editor, setEditor] = useState<{ id: string | null; draft: TextDraft } | null>(null);

  const openNew = useCallback(() => setEditor({ id: null, draft: NEW_DRAFT }), []);

  const openEdit = useCallback(
    (id: string) => {
      const t = texts.find((item) => item.id === id);
      if (!t) return;
      setEditor({
        id,
        draft: {
          text: t.text,
          fontId: t.fontFamily ?? "rubik",
          color: t.color,
          background: t.background ?? "none",
          alignment: t.alignment ?? "center",
        },
      });
    },
    [texts]
  );

  const finish = useCallback(
    (draft: TextDraft) => {
      const style = {
        text: draft.text,
        fontFamily: draft.fontId,
        color: draft.color,
        background: draft.background,
        alignment: draft.alignment,
      };
      if (editor?.id) {
        dispatch(updateText({ id: editor.id, updates: style }));
      } else {
        dispatch(
          addText({
            id: `text-${Date.now()}`,
            type: "text",
            ...style,
            x: 0.5,
            y: 0.45,
            fontSize: DEFAULT_TEXT_SIZE,
            scale: 1,
            rotation: 0,
            opacity: 1,
            startTime,
            endTime: null,
          })
        );
      }
      setEditor(null);
    },
    [editor, dispatch, startTime]
  );

  const cancel = useCallback(() => setEditor(null), []);
  return { editor, openNew, openEdit, finish, cancel };
}
