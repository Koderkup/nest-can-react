import {
  useCommit,
  useLoad,
  usePendingLoad
} from "/assets/nest-react/chunks/chunk-GB3B6RSN.js";
import {
  __toESM,
  require_jsx_runtime,
  require_react,
  useSession
} from "/assets/nest-react/chunks/chunk-GKVIBCEZ.js";

// src/demo/islands/GreetingEditor.island.tsx
var import_react = __toESM(require_react());

// src/demo/islands/session-mark.svg
var session_mark_default = "/assets/nest-react/assets/session-mark-Y2KFTSIX.svg";

// src/demo/islands/GreetingEditor.island.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
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
  (0, import_react.useEffect)(() => {
    setMessage(serverMessage);
  }, [serverMessage]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "island-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pill", children: "useState + useCommit" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted greeting-session", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          alt: "",
          className: "greeting-session-mark",
          src: session_mark_default
        }
      ),
      "Shared runtime visits: ",
      session.visits
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: session.bump, type: "button", children: "Bump session" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: serverMessage }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "form",
      {
        className: "form-grid",
        onSubmit: (event) => {
          event.preventDefault();
          void saveGreeting.execute({ message });
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New greeting" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                value: message,
                onChange: (event) => setMessage(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { disabled: saveGreeting.pending, type: "submit", children: saveGreeting.pending ? "Saving..." : "Commit" })
        ]
      }
    ),
    refreshing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "status", children: "Refreshing server data..." }) : null,
    saveGreeting.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "error", children: saveGreeting.error.message }) : null
  ] });
}
export {
  GreetingEditor
};
//# sourceMappingURL=/assets/nest-react/chunks/GreetingEditor.island-B73FXHZG.js.map
