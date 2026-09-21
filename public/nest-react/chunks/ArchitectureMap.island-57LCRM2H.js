import {
  __toESM,
  require_jsx_runtime,
  require_react
} from "/assets/nest-react/chunks/chunk-AXCRUDNR.js";

// src/welcome/islands/ArchitectureMap.island.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
function ArchitectureMap({ edges, nodes }) {
  const [activeId, setActiveId] = (0, import_react.useState)(nodes[0]?.id ?? "");
  const connected = (0, import_react.useMemo)(() => {
    const ids = /* @__PURE__ */ new Set([activeId]);
    for (const edge of edges) {
      if (edge.from === activeId || edge.to === activeId) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    }
    return ids;
  }, [activeId, edges]);
  const active = nodes.find((node) => node.id === activeId);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "architecture-map", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "architecture-map__label technical", children: "Module graph" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "architecture-map__stage", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "svg",
        {
          "aria-hidden": "true",
          className: "architecture-map__edges",
          preserveAspectRatio: "none",
          viewBox: "0 0 100 100",
          children: edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from);
            const to = nodes.find((node) => node.id === edge.to);
            if (!from || !to) {
              return null;
            }
            const isLive = connected.has(edge.from) && connected.has(edge.to);
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "line",
              {
                className: isLive ? "architecture-map__line is-live" : "architecture-map__line",
                x1: from.x,
                x2: to.x,
                y1: from.y,
                y2: to.y
              },
              `${edge.from}-${edge.to}`
            );
          })
        }
      ),
      nodes.map((node) => {
        const isActive = node.id === activeId;
        const isConnected = connected.has(node.id);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            "aria-pressed": isActive,
            className: [
              "architecture-map__node",
              `architecture-map__node--${node.kind}`,
              isActive ? "is-active" : "",
              isConnected ? "is-connected" : ""
            ].filter(Boolean).join(" "),
            onClick: () => setActiveId(node.id),
            style: { left: `${node.x}%`, top: `${node.y}%` },
            type: "button",
            children: node.label
          },
          node.id
        );
      })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { "aria-live": "polite", className: "architecture-map__detail", children: active?.detail })
  ] });
}
export {
  ArchitectureMap
};
//# sourceMappingURL=/assets/nest-react/chunks/ArchitectureMap.island-57LCRM2H.js.map
