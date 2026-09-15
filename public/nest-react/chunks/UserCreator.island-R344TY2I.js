import {
  useCommit,
  useLoad,
  usePendingLoad
} from "/assets/nest-react/chunks/chunk-JK3DK5AG.js";
import {
  __toESM,
  require_jsx_runtime,
  require_react,
  useSession
} from "/assets/nest-react/chunks/chunk-7LMWQLQ2.js";

// src/demo/islands/UserCreator.island.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "stack", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
      "Shared runtime visits: ",
      session.visits
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                placeholder: "Ada Developer",
                value: name,
                onChange: (event) => setName(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Role" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                placeholder: "Contributor",
                value: role,
                onChange: (event) => setRole(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { disabled: create.pending, type: "submit", children: create.pending ? "Creating..." : "Create user" })
        ]
      }
    ),
    refreshing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "status", children: "Refreshing users..." }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "user-list", children: sortedUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "user-item", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user.name }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: user.role })
    ] }, user.id)) })
  ] });
}
export {
  UserCreator
};
//# sourceMappingURL=/assets/nest-react/chunks/UserCreator.island-R344TY2I.js.map
