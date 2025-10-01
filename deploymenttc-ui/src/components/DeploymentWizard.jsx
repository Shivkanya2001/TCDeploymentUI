import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setEnvironment,
  setModuleType,
  setFile,
  startDeployment,
  deploymentSuccess,
  deploymentFailure,
} from "../Redux/slices/deploymentSlice";
import { getArtifactFileFromRepo } from "../Redux/actions/deploymentActions";
import {
  getGitRepoConfig,
  getGitRepoConnect,
  getRepoBranches,
} from "../Redux/actions/gitConfigActions";
import FileUpload from "./FileUpload";
import LogsViewer from "./Logs";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiDownloadCloud,
  FiFilter,
  FiGitBranch,
  FiGithub,
  FiGitlab,
  FiLayers,
  FiList,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiUploadCloud,
  FiX,
  FiFolder,
  FiFolderMinus,
  FiFolderPlus,
  FiZap,
} from "react-icons/fi";

/**
 * Embedded RepoConnect Wizard (Beanstalk-style)
 * Provider → Repo → Branch → Tree → Detect → Confirm
 * Uses backend routes:
 *   POST  /api/git/connect         { provider } (Authorization: Bearer <PAT>)
 *   GET   /api/git/repos?provider=github
 *   POST  /api/git/resolve         { provider, url }
 *   GET   /api/git/branches?provider=github&repo=owner/name
 *   GET   /api/git/tree?provider=github&repo=owner/name&branch=main
 */
function RepoConnectInline({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState("github"); // github | gitlab | azure | bitbucket
  const [token, setToken] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null); // {id, fullName, url}

  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState("");
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [tree, setTree] = useState([]); // [{path, type:"file"|"dir"}]
  const [treeLoading, setTreeLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [search, setSearch] = useState("");

  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null); // { bmide:[], preferences:[], stylesheets:[] }
  const dispatch = useDispatch();

  const hdrs = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    }),
    [token]
  );

  const call = async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: { ...hdrs, ...(opts.headers || {}) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const handleConnect = async () => {
    try {
      const response = await dispatch(getGitRepoConnect({ provider, token }));

      if (response.payload?.ok) {
        // On successful connection, load repositories for the selected provider
        loadRepos();
        setStep(2); // Move to next step
      } else {
        console.error("Connection failed:", response.payload);
      }
    } catch (error) {
      console.error("Error connecting:", error.message || error);
    }
  };

  const loadRepos = async () => {
    setReposLoading(true); // Start loading state
    try {
      // Dispatch the action and get the response payload directly
      const response = await dispatch(getGitRepoConfig({ provider, token }));

      if (response.payload && response.payload.length > 0) {
        // If repositories are found, update the state
        setRepos(response.payload); // Update the state with the list of repositories
        loadBranches();
      } else {
        console.log("No repositories found.");
        setRepos([]); // Set empty array if no repositories found
      }
    } catch (error) {
      console.log("Error loading repos:", error);
    } finally {
      setReposLoading(false); // Stop loading state
    }
  };

  const useRepoUrlDirect = async () => {
    const { repo } = await call(`/api/git/resolve`, {
      method: "POST",
      body: JSON.stringify({ provider, url: repoUrl }),
    });
    setSelectedRepo(repo);
    setStep(3);
  };
  const loadBranches = async () => {
    setBranchesLoading(true); // Start loading state for branches
    try {
      // Fetch branches for the selected repository
      const response = await dispatch(
        getRepoBranches({ provider, token, repo: selectedRepo.fullName })
      );

      if (response?.payload?.items) {
        // If branches are returned, update the state with the branches
        setBranches(response.payload.items);
      } else {
        console.log("No branches found.");
        setBranches([]); // Set empty array if no branches found
      }
    } catch (error) {
      console.log("Error loading branches:", error);
      setBranches([]); // Ensure branches state is cleared on error
    } finally {
      setBranchesLoading(false); // Stop loading state for branches
    }
  };
  useEffect(() => {
    if (step === 3 && !branches.length) {
      loadBranches(); // Automatically load branches when step is 3
    }
  }, [step]); // Dependency on `step` to trigger when it changes
  const loadTree = async () => {
    if (!selectedRepo || !branch) return;
    setTreeLoading(true);
    try {
      const { items } = await call(
        `/api/git/tree?provider=${provider}&repo=${encodeURIComponent(
          selectedRepo.fullName
        )}&branch=${encodeURIComponent(branch)}`
      );
      setTree(items || []);
      setExpanded((p) => ({ ...p, "": true }));
    } finally {
      setTreeLoading(false);
    }
  };

  const detectModules = async () => {
    setDetecting(true);
    try {
      const lower = (p) => p.toLowerCase();
      const bmide = tree
        .filter(
          (t) => t.type === "file" && /bmide\/.+\.(zip|xml|txt)$/i.test(t.path)
        )
        .map((t) => t.path);
      const preferences = tree
        .filter(
          (t) =>
            t.type === "file" &&
            /(^|\/)prefs?|preferences\/.+\.(xml|ini)$/i.test(lower(t.path))
        )
        .map((t) => t.path);
      const stylesheets = tree
        .filter((t) => t.type === "file" && /\.(xsl|xslt)$/i.test(t.path || ""))
        .map((t) => t.path);
      const found = { bmide, preferences, stylesheets };
      setDetected(found);
      const next = new Set(selectedPaths);
      [...bmide, ...preferences, ...stylesheets].forEach((p) => next.add(p));
      setSelectedPaths(next);
    } finally {
      setDetecting(false);
    }
  };

  const toggleExpand = (path) =>
    setExpanded((p) => ({ ...p, [path]: !p[path] }));
  const isChecked = (path) => selectedPaths.has(path);
  const onCheck = (path, checked) => {
    const next = new Set(selectedPaths);
    if (checked) next.add(path);
    else next.delete(path);
    setSelectedPaths(next);
  };

  const filtered = useMemo(() => {
    if (!search) return tree;
    const q = search.toLowerCase();
    return tree.filter((t) => t.path.toLowerCase().includes(q));
  }, [tree, search]);

  const confirmSelection = () => {
    const files = [...selectedPaths].filter((p) => !p.endsWith("/"));
    const buckets = {
      bmide: files.filter((p) => /bmide\/.+\.(zip|xml|txt)$/i.test(p)),
      preferences: files.filter((p) =>
        /(^|\/)prefs?|preferences\/.+\.(xml|ini)$/i.test(p.toLowerCase())
      ),
      stylesheets: files.filter((p) => /\.(xsl|xslt)$/i.test(p)),
    };
    onComplete?.({
      provider,
      repo: selectedRepo,
      branch,
      buckets,
      files,
    });
  };

  // --- Tree rendering (simple directory view) ---
  function TreeView({ items }) {
    const roots = useMemo(() => {
      const top = new Set();
      items.forEach((i) => top.add(i.path.split("/")[0]));
      return [...top].sort().map((name) => ({ path: name, type: "dir" }));
    }, [items]);

    return (
      <div className="text-[12px]">
        {roots.map((r) => (
          <TreeNode
            key={r.path}
            path={r.path}
            type="dir"
            level={0}
            items={items}
          />
        ))}
      </div>
    );
  }

  function TreeNode({ path, type, level, items }) {
    const children = useMemo(
      () =>
        items.filter(
          (i) =>
            i.path.startsWith(path + "/") &&
            i.path.slice(path.length + 1).split("/").length === 1
        ),
      [items, path]
    );
    const hasChildren = children.length > 0;
    const open = expanded[path];
    const paddingLeft = 8 + level * 14;

    return (
      <div>
        <div className="flex items-center" style={{ paddingLeft }}>
          {type === "dir" ? (
            <button
              type="button"
              onClick={() => toggleExpand(path)}
              className="mr-1 text-slate-600"
              title={open ? "Collapse" : "Expand"}
            >
              {open ? <FiFolderMinus /> : <FiFolderPlus />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <input
            type="checkbox"
            className="mr-2"
            checked={isChecked(path)}
            onChange={(e) => onCheck(path, e.target.checked)}
          />
          <span className="truncate flex-1">
            {type === "dir" ? (
              <span className="inline-flex items-center gap-1">
                <FiFolder className="text-slate-500" /> {path.split("/").pop()}
              </span>
            ) : (
              path.split("/").pop()
            )}
          </span>
        </div>
        {open &&
          hasChildren &&
          children.map((c) => (
            <TreeNode
              key={c.path}
              path={c.path}
              type={c.type}
              level={level + 1}
              items={items}
            />
          ))}
      </div>
    );
  }

  // --- UI by step ---
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-slate-600">
          Connect Repository — Step {step} of 5
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-[12px] px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200"
            onClick={() => setStep(1)}
          >
            Reset
          </button>
          <button
            className="text-[12px] px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "github", label: "GitHub", Icon: FiGithub },
              { id: "gitlab", label: "GitLab", Icon: FiGitlab },
              { id: "azure", label: "Azure DevOps", Icon: FiShield },
              { id: "bitbucket", label: "Bitbucket", Icon: FiGitBranch },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`rounded-lg border p-3 text-left ${
                  provider === p.id
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p.Icon /> {p.label}
                </div>
                <div className="text-[11px] text-slate-500">
                  PAT/OAuth supported
                </div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Access Token (PAT)
              </label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)} // Update the token
                className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                placeholder="ghp_... or AZDO PAT"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConnect} // Trigger the connect function
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700"
                disabled={!token} // Disable if no token is provided
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <div className="text-[12px] text-slate-700">Choose a repository</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              className="px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 text-[12px]"
              onClick={loadRepos}
              disabled={reposLoading}
            >
              Load My Repos
            </button>
            <div className="md:col-span-2 flex gap-2">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="or paste repo URL (https://...)"
                className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
              />
              <button
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[12px]"
                onClick={useRepoUrlDirect}
                disabled={!repoUrl}
              >
                Use URL
              </button>
            </div>
          </div>

          {reposLoading ? (
            <div className="text-center">Loading repositories...</div> // Loading indicator
          ) : (
            <div className="max-h-56 overflow-y-auto mt-2">
              {/* Dropdown for repositories */}
              <select
                value={selectedRepo ? selectedRepo.id : ""}
                onChange={(e) => {
                  const selected = repos.find(
                    (repo) => repo.id === parseInt(e.target.value)
                  );
                  setSelectedRepo(selected);
                }}
                className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
              >
                <option value="" disabled>
                  Select a repository
                </option>
                {repos.length > 0 ? (
                  repos.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.fullName}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No repositories found
                  </option>
                )}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
              onClick={() => setStep(3)}
              disabled={!selectedRepo}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="grow">
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Branch for {selectedRepo?.fullName}
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 text-[12px]"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No branches available</option>
                )}
              </select>
            </div>
            {/* Optionally include the button for manual trigger */}
            {/* <button
              className="h-9 px-3 rounded-lg ring-1 ring-slate-200"
              onClick={loadBranches} // Manually trigger loading branches
              disabled={branchesLoading || !selectedRepo}
            >
              Load branches
            </button> */}
            {/* <button
              className="h-9 px-3 rounded-lg bg-blue-600 text-white"
              onClick={() => {
                setStep(4); // Proceed to step 4
                loadTree(); // Load tree after proceeding
              }}
              disabled={!branch}
            >
              Proceed
            </button> */}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <FiSearch className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter paths…"
                className="w-full border border-slate-300 rounded-lg pl-7 p-2 text-[12px]"
              />
            </div>
            <button
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[12px] inline-flex items-center gap-2"
              onClick={detectModules}
              disabled={detecting || treeLoading}
              title="Auto-detect Teamcenter artifacts"
            >
              <FiZap /> Detect
            </button>
          </div>
          <div className="text-[11px] text-slate-500">
            Select folders/files to include. Detection preselects common
            Teamcenter artifacts.
          </div>
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
            <TreeView items={filtered} />
          </div>
          {detected && (
            <div className="text-[12px] text-slate-700">
              <div className="font-semibold mb-1">Detected</div>
              <div>
                BMIDE:{" "}
                <span className="text-slate-600">{detected.bmide.length}</span>{" "}
                · Prefs:{" "}
                <span className="text-slate-600">
                  {detected.preferences.length}
                </span>{" "}
                · Stylesheets:{" "}
                <span className="text-slate-600">
                  {detected.stylesheets.length}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200"
              onClick={() => setStep(3)}
            >
              Back
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
              onClick={() => setStep(5)}
              disabled={selectedPaths.size === 0}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2">
          <div className="text-[12px] text-slate-700">
            Confirm selection ({selectedPaths.size} items)
          </div>
          <div className="max-h-40 overflow-y-auto bg-slate-50 border rounded p-2 text-[12px] font-mono">
            {[...selectedPaths].map((p) => (
              <div key={p} className="truncate">
                {p}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 rounded-lg ring-1 ring-slate-200"
              onClick={() => setStep(4)}
            >
              Back
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white"
              onClick={confirmSelection}
            >
              Attach to Deployment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DeploymentConsole with embedded RepoConnect
 * -------------------------------------------------------
 * Tailwind-only. Zero external UI deps beyond react-icons.
 * Global state expected: { environment, moduleType, file, logs, status, repoFiles, loading }
 */
export default function DeploymentConsole() {
  const dispatch = useDispatch();

  // Hosts (mock)
  const hosts = [
    "PLM-DEV07",
    "PLM-DEV10",
    "UAT-GW-01",
    "PROD-GW-02",
    "OnPrem-DC-01",
  ];

  // Redux state
  const { environment, moduleType, file, logs, status, repoFiles, loading } =
    useSelector((s) => s.deployment);

  // Local UI
  const [selectedHost, setSelectedHost] = useState(hosts[0] || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [showReview, setShowReview] = useState(false);
  const [tab, setTab] = useState("console"); // console | plan | history

  // RepoConnect modal/inline
  const [showRepoWizard, setShowRepoWizard] = useState(false);
  const [wizardRepoFiles, setWizardRepoFiles] = useState(null); // {bmide:[], preferences:[], stylesheets:[]}

  // Optional: auto-gate into wizard if nothing selected yet
  // useEffect(() => {
  //   if (!file?.length) setShowRepoWizard(true);
  // }, [file?.length]);

  // Preflight & strategy
  const [preflight, setPreflight] = useState({
    dryRun: true,
    backupBefore: true,
    stopServices: false,
    notifyOnFinish: true,
  });
  const [strategy, setStrategy] = useState("all-at-once");

  // Pull artifacts when module changes (legacy path)
  useEffect(() => {
    if (moduleType) dispatch(getArtifactFileFromRepo(moduleType));
  }, [moduleType, dispatch]);

  const toggleCollapse = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] }));

  const activeRepoFiles = wizardRepoFiles || repoFiles || {};
  const allArtifacts = useMemo(() => {
    return [
      ...(activeRepoFiles?.preferences || []),
      ...(activeRepoFiles?.stylesheets || []),
      ...(activeRepoFiles?.bmide || []),
    ];
  }, [activeRepoFiles]);

  const filterFiles = (files = []) =>
    !searchTerm
      ? files
      : files.filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleFileSelection = (e, fname) => {
    const next = e.target.checked
      ? [...(file || []), fname]
      : (file || []).filter((f) => f !== fname);
    dispatch(setFile([...new Set(next)]));
  };

  const handleSectionSelectAll = (sectionFiles = [], checked) => {
    if (checked) dispatch(setFile([...(file || []), ...sectionFiles]));
    else
      dispatch(setFile((file || []).filter((f) => !sectionFiles.includes(f))));
  };

  const handleGlobalSelectAll = (checked) => {
    dispatch(setFile(checked ? allArtifacts : []));
  };

  const readyToDeploy = useMemo(
    () =>
      Boolean(
        selectedHost && environment && moduleType && (file?.length || 0) > 0
      ),
    [selectedHost, environment, moduleType, file]
  );

  const handleDeploy = async () => {
    try {
      setShowReview(false);
      dispatch(startDeployment());
      await new Promise((r) => setTimeout(r, 1200));
      dispatch(deploymentSuccess());
    } catch (err) {
      dispatch(deploymentFailure(err?.message || "Deployment failed"));
    }
  };

  // --- Small building blocks ---
  const SectionCard = ({ title, icon: Icon, right, children }) => (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-slate-500 h-4 w-4" />}
          <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
        </div>
        {right}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );

  const StatTile = ({ label, value, icon: Icon, tone = "slate" }) => (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 bg-white ${
        tone === "green"
          ? "border-emerald-200"
          : tone === "amber"
          ? "border-amber-200"
          : tone === "rose"
          ? "border-rose-200"
          : "border-slate-200"
      }`}
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center ${
          tone === "green"
            ? "bg-emerald-50 text-emerald-700"
            : tone === "amber"
            ? "bg-amber-50 text-amber-700"
            : tone === "rose"
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-50 text-slate-600"
        }`}
      >
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div>
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-[13px] font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );

  const Badge = ({ children, tone = "slate" }) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded ring-1 ${
        tone === "indigo"
          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
          : tone === "amber"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : tone === "rose"
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {children}
    </span>
  );

  const Toggle = ({ label, checked, onChange, hint }) => (
    <label className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200">
      <div className="text-[12px] text-slate-700">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );

  const Radio = ({ value, current, onChange, title, desc }) => {
    const selected = current === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        className={`w-full text-left rounded-lg border p-3 ${
          selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
        }`}
        aria-pressed={selected}
      >
        <div className="text-[12px] font-medium text-slate-800">{title}</div>
        {desc && <div className="text-[11px] text-slate-500">{desc}</div>}
      </button>
    );
  };

  const ToolbarButton = ({ icon: Icon, children, onClick, disabled }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon className="h-4 w-4 text-slate-600" />}
      <span className="text-slate-700">{children}</span>
    </button>
  );

  const renderSection = (title, key, files = []) => {
    if (!files?.length) return null;
    const open = !collapsed[key];
    const picked = files.filter((f) => file?.includes(f)).length;
    const allChecked = picked === files.length && files.length > 0;

    return (
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCollapse(key)}
          className="w-full flex items-center justify-between px-3 py-2.5"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">
              {title}
            </span>
            <span className="text-[10px] text-slate-500">
              {files.length} files
            </span>
            {picked > 0 && (
              <span className="text-[10px] text-blue-700 bg-blue-50 ring-1 ring-blue-200 rounded px-1 py-px">
                {picked} selected
              </span>
            )}
          </div>
          <div className="text-slate-500 text-xs">
            {open ? <FiChevronDown /> : <FiChevronRight />}
          </div>
        </button>

        <div className="px-3 pb-2 -mt-1 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
            <input
              type="checkbox"
              className="rounded text-blue-600 focus:ring-blue-500"
              checked={allChecked}
              onChange={(e) => handleSectionSelectAll(files, e.target.checked)}
            />
            <span>
              Select all <span className="font-medium">{title}</span>
            </span>
          </label>
          <Badge>
            {picked} / {files.length}
          </Badge>
        </div>

        {open && (
          <div className="max-h-56 overflow-y-auto border-t border-slate-200 bg-slate-50 px-3 py-2 space-y-1">
            {filterFiles(files).map((f) => (
              <label
                key={f}
                className="flex items-center gap-2 text-[11px] text-slate-700"
              >
                <input
                  type="checkbox"
                  value={f}
                  checked={file?.includes?.(f)}
                  onChange={(e) => handleFileSelection(e, f)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate" title={f}>
                  {f}
                </span>
              </label>
            ))}
            {filterFiles(files).length === 0 && (
              <div className="text-[11px] text-slate-500">
                No matches for your search.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Derived metrics
  const selectedCount = file?.length || 0;
  const totalCount = allArtifacts.length || 0;
  const statusTone =
    status === "success"
      ? "green"
      : status === "failure"
      ? "rose"
      : status === "deploying"
      ? "amber"
      : "slate";

  // --- Render ---
  return (
    <div className="text-slate-800 space-y-3">
      {/* Header / Breadcrumb */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge>
            <FiLayers className="h-4 w-4" />
            Deployment Studio
          </Badge>
          <div className="text-[11px] text-slate-500">/ New deployment</div>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton
            icon={FiRefreshCw}
            onClick={() =>
              moduleType && dispatch(getArtifactFileFromRepo(moduleType))
            }
            disabled={loading}
          >
            Refresh Artifacts
          </ToolbarButton>
          <ToolbarButton icon={FiSettings} onClick={() => setTab("plan")}>
            Plan
          </ToolbarButton>
          <ToolbarButton icon={FiList} onClick={() => setTab("history")}>
            History
          </ToolbarButton>
          <ToolbarButton
            icon={FiGitBranch}
            onClick={() => setShowRepoWizard(true)}
          >
            Connect Repo
          </ToolbarButton>
        </div>
      </div>

      {/* Inline RepoConnect (toggleable) */}
      {showRepoWizard && (
        <RepoConnectInline
          onCancel={() => setShowRepoWizard(false)}
          onComplete={(payload) => {
            // 1) ensure modules render as sections
            dispatch(setModuleType("all"));
            // 2) preselect files for plan/review
            dispatch(setFile(payload.files || []));
            // 3) optionally surface detected files in the Artifacts column
            setWizardRepoFiles(payload.buckets || null);
            // 4) close wizard
            setShowRepoWizard(false);
          }}
        />
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatTile
          label="Environment"
          value={environment || "DEV"}
          icon={FiShield}
          tone="green"
        />
        <StatTile label="Module" value={moduleType || "—"} icon={FiGitBranch} />
        <StatTile
          label="Selected Files"
          value={`${selectedCount} / ${totalCount}`}
          icon={FiUploadCloud}
        />
        <StatTile
          label="Status"
          value={status ? status : "Ready"}
          icon={FiActivity}
          tone={statusTone}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Column 1: Configuration */}
        <SectionCard title="Configuration" icon={FiServer}>
          <div className="space-y-3">
            {/* Host */}

            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Environment
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px] bg-white"
                value={environment || "DEV"}
                onChange={(e) => dispatch(setEnvironment(e.target.value))}
              >
                <option>DEV</option>
                <option>TEST</option>
                <option>PROD</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Target Host
              </label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 text-[12px] bg-white"
                  value={selectedHost}
                  onChange={(e) => setSelectedHost(e.target.value)}
                >
                  {hosts.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Environment */}

            {/* Module Type */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Module Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: "all", t: "All" },
                  { k: "preferences", t: "Preferences" },
                  { k: "stylesheets", t: "Stylesheets" },
                  { k: "bmide", t: "BMIDE" },
                ].map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => dispatch(setModuleType(m.k))}
                    className={`px-2.5 py-1.5 rounded-lg text-[12px] border ${
                      moduleType === m.k
                        ? "border-blue-400 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {m.t}
                  </button>
                ))}
              </div>
            </div>

            {/* Preflight toggles */}
            <div className="grid grid-cols-1 gap-2">
              <Toggle
                label="Dry Run"
                hint="Generate plan, do not mutate."
                checked={preflight.dryRun}
                onChange={(v) => setPreflight((p) => ({ ...p, dryRun: v }))}
              />
              <Toggle
                label="Backup before deploy"
                hint="Snapshot configs & DB artifacts where applicable."
                checked={preflight.backupBefore}
                onChange={(v) =>
                  setPreflight((p) => ({ ...p, backupBefore: v }))
                }
              />
              <Toggle
                label="Stop services during rollout"
                hint="Minimize contention; increases downtime."
                checked={preflight.stopServices}
                onChange={(v) =>
                  setPreflight((p) => ({ ...p, stopServices: v }))
                }
              />
              <Toggle
                label="Notify on finish"
                hint="Send summary to channel/email."
                checked={preflight.notifyOnFinish}
                onChange={(v) =>
                  setPreflight((p) => ({ ...p, notifyOnFinish: v }))
                }
              />
            </div>

            {/* Strategy */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-700">
                Deployment Strategy
              </label>
              <div className="grid grid-cols-1 gap-2">
                <Radio
                  value="all-at-once"
                  current={strategy}
                  onChange={setStrategy}
                  title="All at once"
                  desc="Fastest. Single blast."
                />
                <Radio
                  value="linear"
                  current={strategy}
                  onChange={setStrategy}
                  title="Linear rollout"
                  desc="Health checks between phases."
                />
                <Radio
                  value="canary"
                  current={strategy}
                  onChange={setStrategy}
                  title="Canary"
                  desc="Subset first, then complete."
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Column 2: Artifact Explorer */}
        <SectionCard
          title="Artifacts"
          icon={FiUploadCloud}
          right={
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={
                  selectedCount > 0 &&
                  selectedCount === totalCount &&
                  totalCount > 0
                }
                onChange={(e) => handleGlobalSelectAll(e.target.checked)}
              />
              <span className="font-medium text-blue-700">Select All</span>
            </label>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <FiSearch className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-7 p-2 focus:ring-2 focus:ring-blue-500 text-[12px] bg-white"
                />
              </div>
              <ToolbarButton icon={FiFilter}>Filters</ToolbarButton>
            </div>

            {loading ? (
              <div className="flex justify-center items-center gap-2 text-[12px] text-slate-500 py-8">
                <span>Loading files…</span>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-blue-500" />
              </div>
            ) : moduleType === "all" ? (
              <>
                {renderSection(
                  "Preferences",
                  "preferences",
                  activeRepoFiles?.preferences
                )}
                {renderSection(
                  "Stylesheets",
                  "stylesheets",
                  activeRepoFiles?.stylesheets
                )}
                {renderSection("BMIDE", "bmide", activeRepoFiles?.bmide)}
              </>
            ) : (
              renderSection(
                moduleType
                  ? moduleType[0].toUpperCase() + moduleType.slice(1)
                  : "",
                moduleType || "single",
                activeRepoFiles?.[moduleType] || []
              )
            )}

            {/*         
            <div className="pt-1">
              <div className="text-[11px] text-slate-500 mb-1">
                Or upload a local artifact
              </div>
              <FileUpload onChange={(f) => dispatch(setFile(f))} />
            </div> */}
          </div>
        </SectionCard>

        {/* Column 3: Readiness & Activity */}
        <SectionCard title="Readiness & Activity" icon={FiActivity}>
          <div className="space-y-3">
            {/* Readiness banner */}
            <div
              className={`rounded-lg border p-2 text-[11px] flex items-center gap-2 ${
                readyToDeploy
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
              role="status"
            >
              {readyToDeploy ? (
                <>
                  <FiCheckCircle className="h-4 w-4" /> Configuration looks
                  good.
                </>
              ) : (
                <>
                  <FiAlertTriangle className="h-4 w-4" /> Complete all required
                  inputs to enable Deploy.
                </>
              )}
            </div>

            {/* Status tile */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px]">
              {status === "deploying" ? (
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Deploying…
                </div>
              ) : status === "success" ? (
                <div className="text-emerald-700">Last run: Success</div>
              ) : status === "failure" ? (
                <div className="text-rose-600">Last run: Failed</div>
              ) : (
                <div className="text-slate-600">Ready</div>
              )}
            </div>

            {/* Logs Tabs */}
            <div className="flex items-center gap-2">
              {["console", "plan", "history"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] border ${
                    tab === t
                      ? "border-slate-400 bg-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {t === "console" && "Live Console"}
                  {t === "plan" && "Plan Preview"}
                  {t === "history" && "History"}
                </button>
              ))}
            </div>

            {/* Panel content */}
            {tab === "console" && (
              <div className="h-64 rounded-lg border border-slate-200 overflow-hidden">
                <LogsViewer logs={logs} />
              </div>
            )}

            {tab === "plan" && (
              <div className="h-64 rounded-lg border border-slate-200 bg-white p-3 text-[12px] overflow-auto">
                <div className="font-semibold text-slate-800 mb-2">
                  Execution plan (simulated)
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {file?.map((f) => (
                    <li key={f}>
                      Apply <span className="font-mono">{f}</span> to{" "}
                      {selectedHost}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-[11px] text-slate-500">
                  Strategy: <span className="font-medium">{strategy}</span> ·
                  Dry run: {preflight.dryRun ? "yes" : "no"}
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="h-64 rounded-lg border border-slate-200 bg-white p-3 text-[12px] overflow-auto">
                <div className="text-slate-500">
                  No history loaded in this view. Surface your recent
                  deployments here.
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Sticky Deploy Bar */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-2">
        <div className="rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Badge tone="indigo">
              <FiServer className="h-4 w-4" />
              {selectedHost || "—"}
            </Badge>
            <Badge
              tone={
                environment === "DEV"
                  ? "indigo"
                  : environment === "TEST"
                  ? "amber"
                  : "rose"
              }
            >
              {environment || "DEV"}
            </Badge>
            <Badge>{moduleType || "—"}</Badge>
            <Badge>{selectedCount} files</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ToolbarButton
              icon={FiDownloadCloud}
              onClick={() => setTab("plan")}
              disabled={!readyToDeploy}
            >
              Review Plan
            </ToolbarButton>
            <button
              type="button"
              onClick={() => setShowReview(true)}
              disabled={!readyToDeploy || status === "deploying"}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white ${
                !readyToDeploy || status === "deploying"
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <FiPlay className="h-4 w-4" />{" "}
              {status === "deploying" ? "Deploying…" : "Deploy"}
            </button>
          </div>
        </div>
      </div>

      {/* Review & Deploy Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReview(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiShield className="text-slate-600" />
                <div className="text-[13px] font-semibold text-slate-900">
                  Review deployment
                </div>
              </div>
              <button
                className="p-1 rounded hover:bg-slate-100"
                onClick={() => setShowReview(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500">Target</div>
                  <div className="font-semibold text-slate-800">
                    {selectedHost}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500">Environment</div>
                  <div className="font-semibold text-slate-800">
                    {environment}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500">Module</div>
                  <div className="font-semibold text-slate-800">
                    {moduleType}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500">Strategy</div>
                  <div className="font-semibold text-slate-800">{strategy}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-2">
                  <div className="text-[11px] text-slate-500">Preflight</div>
                  <ul className="text-slate-800 list-disc pl-4">
                    <li>Dry run: {preflight.dryRun ? "yes" : "no"}</li>
                    <li>Backup: {preflight.backupBefore ? "yes" : "no"}</li>
                    <li>
                      Stop services: {preflight.stopServices ? "yes" : "no"}
                    </li>
                    <li>Notify: {preflight.notifyOnFinish ? "yes" : "no"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 max-h-40 overflow-auto">
              <div className="text-[11px] text-slate-500 mb-1">
                Files ({selectedCount})
              </div>
              {file?.length ? (
                <ul className="text-[12px] text-slate-800 list-disc pl-5 space-y-0.5">
                  {file.map((f) => (
                    <li key={f} className="font-mono truncate" title={f}>
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[12px] text-slate-500">
                  No files selected.
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-[12px] ring-1 ring-slate-200 bg-white hover:bg-slate-50"
                onClick={() => setShowReview(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <FiPlay className="h-4 w-4" /> Confirm & Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
