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

// src/demo/islands/UserCreator.island.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
function UserCreator({
  initialUsers,
  usersLoadKey,
  createUser
}) {
  const users = useLoad(usersLoadKey) ?? initialUsers;
  const refreshing = usePendingLoad(usersLoadKey);
  const create = useCommit(createUser);
  const [name, setName] = (0, import_react.useState)("");
  const [role, setRole] = (0, import_react.useState)("Contributor");
  const sortedUsers = (0, import_react.useMemo)(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users]
  );
  const session = useSession();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "stack", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "muted", children: [
      "Shared runtime visits: ",
      session.visits
    ] }, void 0, true, {
      fileName: "src/demo/islands/UserCreator.island.tsx",
      lineNumber: 36,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
      "form",
      {
        className: "island-card form-grid",
        onSubmit: (event) => {
          event.preventDefault();
          void create.execute({ name, role }).then(() => {
            setName("");
            setRole("Contributor");
          });
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Name" }, void 0, false, {
              fileName: "src/demo/islands/UserCreator.island.tsx",
              lineNumber: 48,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
              "input",
              {
                placeholder: "Ada Developer",
                value: name,
                onChange: (event) => setName(event.target.value)
              },
              void 0,
              false,
              {
                fileName: "src/demo/islands/UserCreator.island.tsx",
                lineNumber: 49,
                columnNumber: 11
              },
              this
            )
          ] }, void 0, true, {
            fileName: "src/demo/islands/UserCreator.island.tsx",
            lineNumber: 47,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Role" }, void 0, false, {
              fileName: "src/demo/islands/UserCreator.island.tsx",
              lineNumber: 56,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
              "input",
              {
                placeholder: "Contributor",
                value: role,
                onChange: (event) => setRole(event.target.value)
              },
              void 0,
              false,
              {
                fileName: "src/demo/islands/UserCreator.island.tsx",
                lineNumber: 57,
                columnNumber: 11
              },
              this
            )
          ] }, void 0, true, {
            fileName: "src/demo/islands/UserCreator.island.tsx",
            lineNumber: 55,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { disabled: create.pending, type: "submit", children: create.pending ? "Creating..." : "Create user" }, void 0, false, {
            fileName: "src/demo/islands/UserCreator.island.tsx",
            lineNumber: 63,
            columnNumber: 9
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "src/demo/islands/UserCreator.island.tsx",
        lineNumber: 37,
        columnNumber: 7
      },
      this
    ),
    refreshing ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "status", children: "Refreshing users..." }, void 0, false, {
      fileName: "src/demo/islands/UserCreator.island.tsx",
      lineNumber: 68,
      columnNumber: 21
    }, this) : null,
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "user-list", children: sortedUsers.map((user) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "user-item", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: user.name }, void 0, false, {
        fileName: "src/demo/islands/UserCreator.island.tsx",
        lineNumber: 73,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: user.role }, void 0, false, {
        fileName: "src/demo/islands/UserCreator.island.tsx",
        lineNumber: 74,
        columnNumber: 13
      }, this)
    ] }, user.id, true, {
      fileName: "src/demo/islands/UserCreator.island.tsx",
      lineNumber: 72,
      columnNumber: 11
    }, this)) }, void 0, false, {
      fileName: "src/demo/islands/UserCreator.island.tsx",
      lineNumber: 70,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "src/demo/islands/UserCreator.island.tsx",
    lineNumber: 35,
    columnNumber: 5
  }, this);
}
if (window.$RefreshRuntime$) {
  typeof UserCreator === "function" && window.$RefreshRuntime$.register(UserCreator, "src/demo/islands/UserCreator.island.tsx:UserCreator");
}
export {
  UserCreator
};
//# sourceMappingURL=/assets/nest-react/chunks/UserCreator.island-NWG7JBN4.js.map
