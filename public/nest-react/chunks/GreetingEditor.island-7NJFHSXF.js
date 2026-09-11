import {
  useCommit,
  useLoad,
  usePendingLoad
} from "./chunk-5SZ3HSQC.js";
import {
  __toESM,
  require_jsx_runtime,
  require_react
} from "./chunk-6HGV5ZIV.js";

// src/demo/islands/GreetingEditor.island.tsx
var import_react = __toESM(require_react());
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
  (0, import_react.useEffect)(() => {
    setMessage(serverMessage);
  }, [serverMessage]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "island-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pill", children: "useState + useCommit" }),
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
//# sourceMappingURL=GreetingEditor.island-7NJFHSXF.js.map
