import {
  useCommit,
  useLoad,
  usePendingLoad
} from "/assets/nest-react/chunks/chunk-YA3NPKZY.js";
import {
  __toESM,
  require_jsx_dev_runtime,
  require_react,
  useSession
} from "/assets/nest-react/chunks/chunk-GKOXHDNS.js";

// src/demo/islands/GreetingEditor.island.tsx
var import_react = __toESM(require_react());

// src/demo/islands/session-mark.svg
var session_mark_default = "/assets/nest-react/assets/session-mark.svg";

// src/demo/islands/GreetingEditor.island.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
function GreetingEditor({
  initialMessage,
  loadKey,
  updateGreeting
}) {
  const serverMessage = useLoad(loadKey) ?? initialMessage;
  const refreshing = usePendingLoad(loadKey);
  const [message, setMessage] = (0, import_react.useState)(initialMessage);
  const saveGreeting = useCommit(updateGreeting);
  const session = useSession();
  const previousServerMessage = (0, import_react.useRef)(serverMessage);
  (0, import_react.useEffect)(() => {
    if (previousServerMessage.current === serverMessage) {
      return;
    }
    previousServerMessage.current = serverMessage;
    setMessage(serverMessage);
  }, [serverMessage]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "island-card", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "pill", children: "useState + useCommit" }, void 0, false, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 37,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "muted greeting-session", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { alt: "", className: "greeting-session-mark", src: session_mark_default }, void 0, false, {
        fileName: "src/demo/islands/GreetingEditor.island.tsx",
        lineNumber: 39,
        columnNumber: 9
      }, this),
      "Shared runtime visits: ",
      session.visits
    ] }, void 0, true, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 38,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: session.bump, type: "button", children: "Bump session" }, void 0, false, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 42,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { children: serverMessage }, void 0, false, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 45,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
      "form",
      {
        className: "form-grid",
        onSubmit: (event) => {
          event.preventDefault();
          void saveGreeting.execute({ message });
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "New greeting" }, void 0, false, {
              fileName: "src/demo/islands/GreetingEditor.island.tsx",
              lineNumber: 54,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
              "input",
              {
                value: message,
                onChange: (event) => setMessage(event.target.value)
              },
              void 0,
              false,
              {
                fileName: "src/demo/islands/GreetingEditor.island.tsx",
                lineNumber: 55,
                columnNumber: 11
              },
              this
            )
          ] }, void 0, true, {
            fileName: "src/demo/islands/GreetingEditor.island.tsx",
            lineNumber: 53,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { disabled: saveGreeting.pending, type: "submit", children: saveGreeting.pending ? "Saving..." : "Commit" }, void 0, false, {
            fileName: "src/demo/islands/GreetingEditor.island.tsx",
            lineNumber: 60,
            columnNumber: 9
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "src/demo/islands/GreetingEditor.island.tsx",
        lineNumber: 46,
        columnNumber: 7
      },
      this
    ),
    refreshing ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "status", children: "Refreshing server data..." }, void 0, false, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 64,
      columnNumber: 21
    }, this) : null,
    saveGreeting.error ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "error", children: saveGreeting.error.message }, void 0, false, {
      fileName: "src/demo/islands/GreetingEditor.island.tsx",
      lineNumber: 66,
      columnNumber: 9
    }, this) : null
  ] }, void 0, true, {
    fileName: "src/demo/islands/GreetingEditor.island.tsx",
    lineNumber: 36,
    columnNumber: 5
  }, this);
}
if (window.$RefreshRuntime$) {
  typeof GreetingEditor === "function" && window.$RefreshRuntime$.register(GreetingEditor, "src/demo/islands/GreetingEditor.island.tsx:GreetingEditor");
}
export {
  GreetingEditor
};
//# sourceMappingURL=/assets/nest-react/chunks/GreetingEditor.island-TPMMFKQ2.js.map
