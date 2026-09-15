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

// src/demo/islands/DashboardControls.island.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
function DashboardControls({
  initialSummary,
  summaryLoadKey,
  refreshDashboard
}) {
  const summary = useLoad(summaryLoadKey) ?? initialSummary;
  const refreshing = usePendingLoad(summaryLoadKey);
  const refresh = useCommit(refreshDashboard);
  const [filter, setFilter] = (0, import_react.useState)("all");
  const [clientTime, setClientTime] = (0, import_react.useState)(
    () => (/* @__PURE__ */ new Date()).toLocaleTimeString()
  );
  const session = useSession();
  (0, import_react.useEffect)(() => {
    const timer = window.setInterval(() => {
      setClientTime((/* @__PURE__ */ new Date()).toLocaleTimeString());
    }, 1e3);
    return () => window.clearInterval(timer);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "stack", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
      "Shared runtime visits: ",
      session.visits
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Client-only filter" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "select",
        {
          value: filter,
          onChange: (event) => setFilter(event.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "all", children: "All" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "team", children: "Team" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "projects", children: "Projects" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "metric-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Greeting" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: summary.greeting })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Users" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: summary.users })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Active projects" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: summary.activeProjects })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Manual refreshes" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: summary.manualRefreshes })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Server generated" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: new Date(summary.generatedAt).toLocaleTimeString() })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Client clock" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: clientTime })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Selected filter" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: filter })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        disabled: refresh.pending || refreshing,
        onClick: () => void refresh.execute({}),
        type: "button",
        children: refresh.pending || refreshing ? "Refreshing..." : "Refresh dashboard"
      }
    )
  ] });
}
export {
  DashboardControls
};
//# sourceMappingURL=/assets/nest-react/chunks/DashboardControls.island-OHH2B6DP.js.map
