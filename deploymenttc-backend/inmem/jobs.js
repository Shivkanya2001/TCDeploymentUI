const store = {
  jobs: new Map(), // id -> { id, status, logs:[], createdAt, updatedAt, payload }
  seq: 1,
};

// simple id
function nextId() {
  return String(store.seq++).padStart(6, "0");
}

// create & run a fake async deployment
export function enqueueDeployment(payload, onLog) {
  const id = nextId();
  const job = {
    id,
    status: "queued", // queued -> running -> success|failure
    logs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload,
  };
  store.jobs.set(id, job);

  // simulate async worker
  setTimeout(() => runJob(id, onLog), 50);
  return job;
}

function appendLog(job, line) {
  job.logs.push({ ts: new Date().toISOString(), line });
}

function runJob(id, onLog) {
  const job = store.jobs.get(id);
  if (!job) return;
  job.status = "running";
  job.updatedAt = new Date().toISOString();
  appendLog(job, "Deployment started.");
  onLog?.(job, "Deployment started.");

  // simulate phases
  setTimeout(() => {
    appendLog(job, "Validating artifacts…");
    onLog?.(job, "Validating artifacts…");
  }, 300);

  setTimeout(() => {
    appendLog(job, `Connecting to hosts: ${job.payload.hostIds.join(", ")}`);
    onLog?.(job, `Connecting to hosts: ${job.payload.hostIds.join(", ")}`);
  }, 900);

  setTimeout(() => {
    const ok = true; // flip for failure scenario
    if (ok) {
      appendLog(job, "Deploying modules…");
      onLog?.(job, "Deploying modules…");
    } else {
      appendLog(job, "Error: artifact checksum mismatch.");
      onLog?.(job, "Error: artifact checksum mismatch.");
    }
  }, 1500);

  setTimeout(() => {
    const success = true; // simulate success
    job.status = success ? "success" : "failure";
    job.updatedAt = new Date().toISOString();
    appendLog(
      job,
      success ? "Deployment completed ✅" : "Deployment failed ❌"
    );
    onLog?.(job, success ? "Deployment completed ✅" : "Deployment failed ❌");
  }, 2200);
}

export function getJob(id) {
  return store.jobs.get(id) || null;
}
export function getLogs(id) {
  return store.jobs.get(id)?.logs || [];
}
