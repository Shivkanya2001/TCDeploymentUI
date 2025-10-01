// src/components/ConfigCenter.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getConfig,
  upsertConfig,
  addHost as addHostThunk,
  updateHost as updateHostThunk,
  removeHost as removeHostThunk,
  toggleDefaultHost as toggleDefaultHostThunk,
} from "../Redux/actions/defaultConfigActions";
import {
  FiPlus,
  FiTrash2,
  FiCheck,
  FiRefreshCw,
  FiRadio,
  FiExternalLink,
  FiChevronsLeft,
  FiChevronsRight,
  FiGitBranch,
  FiServer,
  FiSettings,
  FiList,
  FiUser,
} from "react-icons/fi";

/* -------------------------- Small helpers -------------------------- */
const toTitle = (k) =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
const uid = (p = "id") => crypto.randomUUID?.() || `${p}-${Date.now()}`;

const PROVIDERS = ["github", "gitlab", "bitbucket", "azure", "gitea"];
const AUTH_METHODS = ["PAT", "SSH"];

/* ---------- Common buffered form controls (no focus loss) ---------- */
function SmartInput({
  value,
  onCommit, // (val) => void
  onImmediateChange, // optional
  commitOn = ["blur", "enter"],
  ...rest
}) {
  const [draft, setDraft] = React.useState(value ?? "");
  const editingRef = React.useRef(false);

  // Sync from external value only when not editing
  React.useEffect(() => {
    if (!editingRef.current) setDraft(value ?? "");
  }, [value]);

  const commit = React.useCallback(() => {
    editingRef.current = false;
    if (onCommit && draft !== value) onCommit(draft);
  }, [draft, value, onCommit]);

  return (
    <input
      {...rest}
      value={draft}
      onFocus={(e) => {
        editingRef.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onImmediateChange?.(e.target.value);
        rest.onChange?.(e);
      }}
      onBlur={(e) => {
        if (commitOn.includes("blur")) commit();
        rest.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (commitOn.includes("enter") && e.key === "Enter") {
          e.currentTarget.blur(); // triggers onBlur commit
        }
        rest.onKeyDown?.(e);
      }}
    />
  );
}

function SmartSelect({ value, onCommit, children, ...rest }) {
  const [draft, setDraft] = React.useState(value ?? "");
  const editingRef = React.useRef(false);

  React.useEffect(() => {
    if (!editingRef.current) setDraft(value ?? "");
  }, [value]);

  const commit = React.useCallback(() => {
    editingRef.current = false;
    if (onCommit && draft !== value) onCommit(draft);
  }, [draft, value, onCommit]);

  return (
    <select
      {...rest}
      value={draft}
      onFocus={(e) => {
        editingRef.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        commit(); // select changes are intentional; commit immediately
        rest.onChange?.(e);
      }}
      onBlur={(e) => {
        commit();
        rest.onBlur?.(e);
      }}
    >
      {children}
    </select>
  );
}

/* ----------------------------- UI atoms ---------------------------- */
function Sidebar({ active, onChange, storageKey = "cfgSidebarCollapsed" }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "false");
    } catch {
      return false;
    }
  });
  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(collapsed));
  }, [collapsed, storageKey]);

  const items = [
    { key: "repos", label: "Git Repos", icon: <FiGitBranch /> },
    { key: "hosts", label: "Hosts", icon: <FiServer /> },
    { key: "deploy", label: "Deployment", icon: <FiSettings /> },
    { key: "summary", label: "Summary", icon: <FiList /> },
    { key: "operational", label: "Operational Profile", icon: <FiUser /> },
  ];

  return (
    <aside
      className={`relative shrink-0 border-r border-slate-200 bg-slate-50 transition-all duration-200 ease-in-out ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between px-2 py-3">
        {!collapsed && (
          <div className="text-sm font-semibold text-slate-800">
            Configuration Center
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`h-8 w-8 grid place-items-center rounded-md text-slate-700 hover:bg-white ring-1 ring-slate-200 ${
            collapsed ? "mx-auto" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
      </div>

      <nav className="px-2 pb-3 space-y-1">
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`w-full flex items-center gap-2 rounded-md ${
                collapsed ? "justify-center p-2" : "px-3 py-2"
              } text-[13px] transition-colors ${
                isActive
                  ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-900"
                  : "hover:bg-white hover:shadow-sm text-slate-700"
              }`}
              title={collapsed ? it.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-[16px]">{it.icon}</span>
              {!collapsed && <span className="truncate">{it.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ListItem({ active, title, subtitle, onClick, onDelete, right }) {
  return (
    <div
      className={`group flex items-center justify-between px-2 py-2 rounded-md border ${
        active ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <button onClick={onClick} className="flex-1 text-left">
        <div className="text-[13px] font-medium text-slate-800">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-slate-500">{subtitle}</div>
        )}
      </button>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={onDelete}
          className="h-8 w-8 grid place-items-center rounded-md text-red-600 hover:bg-red-50"
          title="Remove"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block mb-1 text-[11px] font-medium text-slate-700">
      {label}
    </label>
    {children}
    {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
  </div>
);

/* ------------------------- Main component -------------------------- */
export default function ConfigCenter({ seedConfig }) {
  const dispatch = useDispatch();
  const { config, loading, error } = useSelector((s) => s.defaultConfig);

  // Factory defaults
  const factoryDefaults = React.useMemo(
    () => ({
      gitRemotes: [
        {
          id: "remote-01",
          provider: "github",
          url: "https://github.com/example/plm-deployment",
          authMethod: "PAT",
          username: "plm-bot",
          tokenRef: "",
          sshKeyRef: "",
          branch: "main",
          branches: [],
        },
      ],
      defaultRemoteId: "remote-01",

      hosts: [
        { id: "host-01", name: "PLM App Server", address: "plm-server-01" },
        { id: "host-02", name: "PLM Agent 02", address: "agent-02" },
      ],
      defaultSelectedHostIds: ["host-01"],

      action: "deploy",
      repo: "",
      branch: "",

      user: "",
      group: "",
      pwFile: "",

      ...(seedConfig || {}),
    }),
    [seedConfig]
  );

  // App state persisted with backend
  const [form, setForm] = React.useState(factoryDefaults);
  const [hydrated, setHydrated] = React.useState(false);

  // Panel state
  const [activeTab, setActiveTab] = React.useState("repos");

  // Drafts for detail views
  const [activeRemoteId, setActiveRemoteId] = React.useState(null);
  const [remoteDraft, setRemoteDraft] = React.useState(null);

  const [activeHostId, setActiveHostId] = React.useState(null);
  const [hostDraft, setHostDraft] = React.useState(null);

  /* ============================ LIFECYCLE ============================= */
  React.useEffect(() => {
    dispatch(getConfig());
  }, [dispatch]);

  React.useEffect(() => {
    if (hydrated) return;
    const base =
      config && Object.keys(config).length ? config : factoryDefaults;
    const ensured = {
      gitRemotes: Array.isArray(base.gitRemotes) ? base.gitRemotes : [],
      defaultRemoteId:
        base.defaultRemoteId || base.gitRemotes?.[0]?.id || undefined,
      hosts: Array.isArray(base.hosts) ? base.hosts : [],
      defaultSelectedHostIds: Array.isArray(base.defaultSelectedHostIds)
        ? base.defaultSelectedHostIds
        : [],
      action: base.action || "deploy",
      repo: base.repo || "",
      branch: base.branch || "",
      user: base.user || "",
      group: base.group || "",
      pwFile: base.pwFile || "",
    };
    setForm(ensured);
    setHydrated(true);
  }, [config, factoryDefaults, hydrated]);

  // Keep remote/host drafts in sync with current selections
  React.useEffect(() => {
    const active =
      form.gitRemotes?.find((r) => r.id === activeRemoteId) || null;
    setRemoteDraft(
      active
        ? {
            id: active.id,
            provider: active.provider || "github",
            url: active.url || "",
            authMethod: active.authMethod || "PAT",
            username: active.username || "",
            tokenRef: active.tokenRef || "",
            sshKeyRef: active.sshKeyRef || "",
            branch: active.branch || "main",
            branches: active.branches || [],
          }
        : null
    );
  }, [activeRemoteId, form.gitRemotes]);

  React.useEffect(() => {
    const active = form.hosts?.find((h) => h.id === activeHostId) || null;
    setHostDraft(active ? { ...active } : null);
  }, [activeHostId, form.hosts]);

  /* ------------------------ Backend helpers ------------------------ */
  const applyAll = async () => {
    const res = await dispatch(upsertConfig(form)).unwrap();
    setForm(res);
  };
  const refresh = async () => {
    await dispatch(getConfig()).unwrap();
  };

  /* -------------------------- Repos Panel -------------------------- */
  const addRemote = () => {
    const id = uid("remote");
    setForm((p) => ({
      ...p,
      gitRemotes: [
        ...(p.gitRemotes || []),
        {
          id,
          provider: "github",
          url: "",
          authMethod: "PAT",
          username: "",
          tokenRef: "",
          sshKeyRef: "",
          branch: "main",
          branches: [],
        },
      ],
      defaultRemoteId: p.defaultRemoteId || id,
    }));
    setActiveRemoteId(id);
  };
  const removeRemote = (id) =>
    setForm((p) => {
      const rest = (p.gitRemotes || []).filter((r) => r.id !== id);
      const nextDefault =
        p.defaultRemoteId === id ? rest?.[0]?.id : p.defaultRemoteId;
      if (activeRemoteId === id) setActiveRemoteId(null);
      return { ...p, gitRemotes: rest, defaultRemoteId: nextDefault };
    });

  const ReposPanel = () => {
    const openUrl =
      form.gitRemotes?.find((r) => r.id === form.defaultRemoteId)?.url || "";

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* List */}
        <div className="lg:col-span-1 rounded-lg border border-slate-200 p-3 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-slate-800">
              Git Repositories
            </div>
            <div className="flex items-center gap-2">
              {!!openUrl && (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] inline-flex items-center gap-1 text-blue-700 hover:text-blue-800"
                  title="Open Default Repo"
                >
                  <FiExternalLink /> Open
                </a>
              )}
              <button
                onClick={addRemote}
                className="text-[11px] px-2 py-1 rounded-md ring-1 ring-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <FiPlus className="inline mr-1" />
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {(form.gitRemotes || []).map((r) => (
              <ListItem
                key={r.id}
                active={activeRemoteId === r.id}
                title={`${toTitle(r.provider)} @ ${r.branch || "main"}`}
                subtitle={r.url || "—"}
                onClick={() => setActiveRemoteId(r.id)}
                onDelete={() => removeRemote(r.id)}
                right={
                  <label className="inline-flex items-center gap-1 text-[11px]">
                    <input
                      type="radio"
                      name="defaultRemote"
                      checked={form.defaultRemoteId === r.id}
                      onChange={() =>
                        setForm((p) => ({ ...p, defaultRemoteId: r.id }))
                      }
                    />
                    <FiRadio /> Default
                  </label>
                }
              />
            ))}
            {!(form.gitRemotes || []).length && (
              <div className="text-[12px] text-slate-500">
                No repositories. Click “Add”.
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 p-3 bg-white">
          {!remoteDraft ? (
            <div className="text-[12px] text-slate-500">
              Select a repository to edit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Provider">
                <SmartSelect
                  value={remoteDraft.provider}
                  onCommit={(val) => {
                    const next = { ...remoteDraft, provider: val };
                    setRemoteDraft(next);
                    setForm((p) => ({
                      ...p,
                      gitRemotes: (p.gitRemotes || []).map((r) =>
                        r.id === next.id ? { ...r, provider: val } : r
                      ),
                    }));
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-[12px]"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {toTitle(p)}
                    </option>
                  ))}
                </SmartSelect>
              </Field>

              <Field label="Repository URL" hint="https://... or git@...">
                <SmartInput
                  value={remoteDraft.url}
                  onCommit={(val) => {
                    const next = { ...remoteDraft, url: val };
                    setRemoteDraft(next);
                    setForm((p) => ({
                      ...p,
                      gitRemotes: (p.gitRemotes || []).map((r) =>
                        r.id === next.id ? { ...r, url: val } : r
                      ),
                    }));
                  }}
                  placeholder="https://github.com/org/repo"
                  className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                />
              </Field>

              <Field label="Auth Method">
                <SmartSelect
                  value={remoteDraft.authMethod || "PAT"}
                  onCommit={(val) => {
                    const next = { ...remoteDraft, authMethod: val };
                    setRemoteDraft(next);
                    setForm((p) => ({
                      ...p,
                      gitRemotes: (p.gitRemotes || []).map((r) =>
                        r.id === next.id ? { ...r, authMethod: val } : r
                      ),
                    }));
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-[12px]"
                >
                  {AUTH_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </SmartSelect>
              </Field>

              {remoteDraft.authMethod === "PAT" ? (
                <>
                  <Field label="Username (optional)">
                    <SmartInput
                      value={remoteDraft.username || ""}
                      onCommit={(val) => {
                        const next = { ...remoteDraft, username: val };
                        setRemoteDraft(next);
                        setForm((p) => ({
                          ...p,
                          gitRemotes: (p.gitRemotes || []).map((r) =>
                            r.id === next.id ? { ...r, username: val } : r
                          ),
                        }));
                      }}
                      placeholder="bot-user"
                      className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                    />
                  </Field>
                  <Field
                    label="Token Ref"
                    hint="Vault/KeyRef only; no raw tokens"
                  >
                    <SmartInput
                      value={remoteDraft.tokenRef || ""}
                      onCommit={(val) => {
                        const next = { ...remoteDraft, tokenRef: val };
                        setRemoteDraft(next);
                        setForm((p) => ({
                          ...p,
                          gitRemotes: (p.gitRemotes || []).map((r) =>
                            r.id === next.id ? { ...r, tokenRef: val } : r
                          ),
                        }));
                      }}
                      placeholder="kv://git/token/bot"
                      className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="SSH Key Ref"
                    hint="Path or Vault ref; no raw keys"
                  >
                    <SmartInput
                      value={remoteDraft.sshKeyRef || ""}
                      onCommit={(val) => {
                        const next = { ...remoteDraft, sshKeyRef: val };
                        setRemoteDraft(next);
                        setForm((p) => ({
                          ...p,
                          gitRemotes: (p.gitRemotes || []).map((r) =>
                            r.id === next.id ? { ...r, sshKeyRef: val } : r
                          ),
                        }));
                      }}
                      placeholder="kv://team/ssh/deploy"
                      className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                    />
                  </Field>
                  <Field label="Token Ref (optional)">
                    <SmartInput
                      value={remoteDraft.tokenRef || ""}
                      onCommit={(val) => {
                        const next = { ...remoteDraft, tokenRef: val };
                        setRemoteDraft(next);
                        setForm((p) => ({
                          ...p,
                          gitRemotes: (p.gitRemotes || []).map((r) =>
                            r.id === next.id ? { ...r, tokenRef: val } : r
                          ),
                        }));
                      }}
                      placeholder="kv://git/token/bot"
                      className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                    />
                  </Field>
                </>
              )}

              <Field label="Branch">
                {remoteDraft.branches?.length ? (
                  <SmartSelect
                    value={remoteDraft.branch || ""}
                    onCommit={(val) => {
                      const next = { ...remoteDraft, branch: val };
                      setRemoteDraft(next);
                      setForm((p) => ({
                        ...p,
                        gitRemotes: (p.gitRemotes || []).map((r) =>
                          r.id === next.id ? { ...r, branch: val } : r
                        ),
                      }));
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-[12px]"
                  >
                    {remoteDraft.branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </SmartSelect>
                ) : (
                  <SmartInput
                    value={remoteDraft.branch || ""}
                    onCommit={(val) => {
                      const next = { ...remoteDraft, branch: val };
                      setRemoteDraft(next);
                      setForm((p) => ({
                        ...p,
                        gitRemotes: (p.gitRemotes || []).map((r) =>
                          r.id === next.id ? { ...r, branch: val } : r
                        ),
                      }));
                    }}
                    placeholder="main"
                    className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                  />
                )}
              </Field>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* -------------------------- Hosts Panel -------------------------- */
  const addHost = async () => {
    const id = uid("h");
    const suffix = String(id).slice(-4);
    const payload = { id, name: "New Host", address: `host-${suffix}` };
    const res = await dispatch(addHostThunk(payload)).unwrap();
    setForm((p) => ({ ...p, ...res }));
    setActiveHostId(id);
  };
  const removeHost = async (id) => {
    const res = await dispatch(removeHostThunk(id)).unwrap();
    setForm((p) => ({ ...p, ...res }));
    if (activeHostId === id) setActiveHostId(null);
  };
  const toggleDefaultHost = async (id, selected) => {
    const res = await dispatch(
      toggleDefaultHostThunk({ id, selected })
    ).unwrap();
    setForm((p) => ({ ...p, ...res }));
  };

  const HostsPanel = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* List */}
        <div className="lg:col-span-1 rounded-lg border border-slate-200 p-3 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-slate-800">
              Hosts
            </div>
            <button
              onClick={addHost}
              className="text-[11px] px-2 py-1 rounded-md ring-1 ring-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <FiPlus className="inline mr-1" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {(form.hosts || []).map((h) => (
              <ListItem
                key={h.id}
                active={activeHostId === h.id}
                title={h.name || h.id}
                subtitle={h.address}
                onClick={() => setActiveHostId(h.id)}
                onDelete={() => removeHost(h.id)}
                right={
                  <label className="inline-flex items-center gap-1 text-[11px]">
                    <input
                      type="checkbox"
                      checked={(form.defaultSelectedHostIds || []).includes(
                        h.id
                      )}
                      onChange={(e) =>
                        toggleDefaultHost(h.id, e.target.checked)
                      }
                    />
                    Default
                  </label>
                }
              />
            ))}
            {!(form.hosts || []).length && (
              <div className="text-[12px] text-slate-500">
                No hosts. Click “Add”.
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 p-3 bg-white">
          {!hostDraft ? (
            <div className="text-[12px] text-slate-500">
              Select a host to edit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name">
                <SmartInput
                  value={hostDraft.name}
                  onCommit={(val) => {
                    const next = { ...hostDraft, name: val };
                    setHostDraft(next);
                    dispatch(
                      updateHostThunk({ id: next.id, patch: { name: val } })
                    );
                    setForm((p) => ({
                      ...p,
                      hosts: (p.hosts || []).map((x) =>
                        x.id === next.id ? { ...x, name: val } : x
                      ),
                    }));
                  }}
                  placeholder="PLM App Server"
                  className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                />
              </Field>
              <Field label="Address / Alias">
                <SmartInput
                  value={hostDraft.address}
                  onCommit={(val) => {
                    const next = { ...hostDraft, address: val };
                    setHostDraft(next);
                    dispatch(
                      updateHostThunk({ id: next.id, patch: { address: val } })
                    );
                    setForm((p) => ({
                      ...p,
                      hosts: (p.hosts || []).map((x) =>
                        x.id === next.id ? { ...x, address: val } : x
                      ),
                    }));
                  }}
                  placeholder="plm-server-01"
                  className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ----------------------- Deployment Panel ------------------------ */
  const DeploymentPanel = () => (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Action">
          <SmartInput
            value={form.action || ""}
            onCommit={(val) => setForm((p) => ({ ...p, action: val }))}
            placeholder="deploy"
            className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
          />
        </Field>
        <Field label="(Optional) Legacy Repo URL" hint="Kept for compatibility">
          <SmartInput
            value={form.repo || ""}
            onCommit={(val) => setForm((p) => ({ ...p, repo: val }))}
            placeholder="https://github.com/org/repo"
            className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
          />
        </Field>
        <Field label="(Optional) Legacy Branch">
          <SmartInput
            value={form.branch || ""}
            onCommit={(val) => setForm((p) => ({ ...p, branch: val }))}
            placeholder="main"
            className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
          />
        </Field>
      </div>
    </div>
  );

  /* ----------------------- Operational Panel ----------------------- */
  const OperationalProfilePanel = () => (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="text-[12px] font-semibold text-slate-800 mb-3">
        Operational Profile
      </div>

      {/* Group 1: User / Group */}
      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="User">
          <SmartInput
            value={form.user || ""}
            onCommit={(val) => setForm((p) => ({ ...p, user: val }))}
            autoComplete="off"
            placeholder="plm-admin"
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px]"
          />
        </Field>

        <Field label="Group">
          <SmartInput
            value={form.group || ""}
            onCommit={(val) => setForm((p) => ({ ...p, group: val }))}
            autoComplete="off"
            placeholder="plm-devops"
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px]"
          />
        </Field>
      </div>

      {/* Group 2: Action / Key file */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Action">
          <SmartInput
            value={form.action || ""}
            onCommit={(val) => setForm((p) => ({ ...p, action: val }))}
            autoComplete="off"
            placeholder="deploy"
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px]"
          />
        </Field>
        <Field label="Password Key File" hint="Path to key/secret file">
          <SmartInput
            value={form.pwFile || ""}
            onCommit={(val) => setForm((p) => ({ ...p, pwFile: val }))}
            autoComplete="off"
            placeholder="/secrets/plm.key"
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px]"
          />
        </Field>
      </div>
    </div>
  );

  /* -------------------------- Summary Panel ------------------------ */
  const SummaryPanel = () => {
    const defaultRemote = form.gitRemotes?.find(
      (r) => r.id === form.defaultRemoteId
    );
    return (
      <div className="rounded-lg border border-slate-200 p-3 bg-white">
        <div className="text-[12px] font-semibold text-slate-800 mb-2">
          Selected Defaults Overview
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Selection</th>
                <th className="py-2 pr-4">Make Default</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-t border-slate-200">
                <td className="py-2 pr-4">Code Remote</td>
                <td className="py-2 pr-4">
                  {defaultRemote ? (
                    <>
                      {toTitle(defaultRemote.provider)} @{" "}
                      {defaultRemote.branch || "main"}{" "}
                      <span className="text-slate-500">
                        ({defaultRemote.url})
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    {(form.gitRemotes || []).map((r) => (
                      <label
                        key={r.id}
                        className="inline-flex items-center gap-1"
                      >
                        <input
                          type="radio"
                          name="defaultRemote2"
                          checked={form.defaultRemoteId === r.id}
                          onChange={() =>
                            setForm((p) => ({ ...p, defaultRemoteId: r.id }))
                          }
                        />
                        {toTitle(r.provider)}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-2 pr-4">Hosts</td>
                <td className="py-2 pr-4">
                  {(form.defaultSelectedHostIds || []).length
                    ? form.defaultSelectedHostIds.join(", ")
                    : "—"}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-2">
                    {(form.hosts || []).map((h) => (
                      <label
                        key={h.id}
                        className="inline-flex items-center gap-1"
                      >
                        <input
                          type="checkbox"
                          checked={(form.defaultSelectedHostIds || []).includes(
                            h.id
                          )}
                          onChange={(e) =>
                            toggleDefaultHost(h.id, e.target.checked)
                          }
                        />
                        {h.name || h.id}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-2 pr-4">Action</td>
                <td className="py-2 pr-4">{form.action || "deploy"}</td>
                <td className="py-2 pr-4">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ---------------------------- Layout ----------------------------- */
  return (
    <div className="flex h-full">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Config Workspace
            </div>
            <div className="text-[11px] text-slate-500">
              Curate repos, hosts, and deployment inputs. Persist when ready.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-[12px] text-slate-500">Syncing…</span>
            )}
            {error && (
              <span className="text-[12px] text-red-600">
                {typeof error === "string" ? error : JSON.stringify(error)}
              </span>
            )}
            <button
              onClick={refresh}
              className="text-[12px] px-3 py-1.5 rounded-md ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <FiRefreshCw className="inline mr-1" />
              Refresh
            </button>
            <button
              onClick={applyAll}
              className="text-[12px] px-3 py-1.5 rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <FiCheck className="inline mr-1" />
              Apply
            </button>
          </div>
        </div>

        {activeTab === "repos" && <ReposPanel />}
        {activeTab === "hosts" && <HostsPanel />}
        {activeTab === "deploy" && <DeploymentPanel />}
        {activeTab === "summary" && <SummaryPanel />}
        {activeTab === "operational" && <OperationalProfilePanel />}
      </main>
    </div>
  );
}
