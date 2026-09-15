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

// src/demo/islands/DashboardControls.island.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
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
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "stack", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "muted", children: [
      "Shared runtime visits: ",
      session.visits
    ] }, void 0, true, {
      fileName: "src/demo/islands/DashboardControls.island.tsx",
      lineNumber: 44,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "field", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Client-only filter" }, void 0, false, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 46,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
        "select",
        {
          value: filter,
          onChange: (event) => setFilter(event.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", { value: "all", children: "All" }, void 0, false, {
              fileName: "src/demo/islands/DashboardControls.island.tsx",
              lineNumber: 51,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", { value: "team", children: "Team" }, void 0, false, {
              fileName: "src/demo/islands/DashboardControls.island.tsx",
              lineNumber: 52,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", { value: "projects", children: "Projects" }, void 0, false, {
              fileName: "src/demo/islands/DashboardControls.island.tsx",
              lineNumber: 53,
              columnNumber: 11
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 47,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "src/demo/islands/DashboardControls.island.tsx",
      lineNumber: 45,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "metric-grid", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Greeting" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 59,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: summary.greeting }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 60,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 58,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Users" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 63,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: summary.users }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 64,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 62,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Active projects" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 67,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: summary.activeProjects }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 68,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 66,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Manual refreshes" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 71,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: summary.manualRefreshes }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 72,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 70,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Server generated" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 75,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: new Date(summary.generatedAt).toLocaleTimeString() }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 76,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 74,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Client clock" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 81,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: clientTime }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 82,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 80,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "metric-card", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: "Selected filter" }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 85,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "muted", children: filter }, void 0, false, {
          fileName: "src/demo/islands/DashboardControls.island.tsx",
          lineNumber: 86,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 84,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "src/demo/islands/DashboardControls.island.tsx",
      lineNumber: 57,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
      "button",
      {
        disabled: refresh.pending || refreshing,
        onClick: () => void refresh.execute({}),
        type: "button",
        children: refresh.pending || refreshing ? "Refreshing..." : "Refresh dashboard"
      },
      void 0,
      false,
      {
        fileName: "src/demo/islands/DashboardControls.island.tsx",
        lineNumber: 90,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "src/demo/islands/DashboardControls.island.tsx",
    lineNumber: 43,
    columnNumber: 5
  }, this);
}
if (window.$RefreshRuntime$) {
  typeof DashboardControls === "function" && window.$RefreshRuntime$.register(DashboardControls, "src/demo/islands/DashboardControls.island.tsx:DashboardControls");
}
export {
  DashboardControls
};
//# sourceMappingURL=/assets/nest-react/chunks/DashboardControls.island-RPJPWX4C.js.map
