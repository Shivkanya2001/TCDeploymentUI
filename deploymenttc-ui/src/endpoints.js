const BASE_URL = "/api/";

export const DEPLOYMENTFILES = {
  getArtifactFileFromRepo: `${BASE_URL}deployment/files`, // Corrected constant name and URL path
};

//Config APIs
export const DefaultConfig = {
  getConfig: `${BASE_URL}config`,
  upsertConfig: `${BASE_URL}config`, // PUT body
  patchConfig: `${BASE_URL}config`, // PATCH body
  // hosts
  addHost: `${BASE_URL}config/hosts`, // POST body
  updateHost: (id) => `${BASE_URL}config/hosts/${id}`, // PATCH body
  removeHost: (id) => `${BASE_URL}config/hosts/${id}`, // DELETE
  toggleDefaultHost: (id) => `${BASE_URL}config/hosts/${id}/toggle-default`, // POST body {selected}
};

export const repoConfig = {
  getGitRepoConfig: `${BASE_URL}gitconfig/repos`,
  gitRepoConnect: `${BASE_URL}gitconfig/connect`,
  getRepoBranches: `${BASE_URL}gitconfig/branches`,
};
