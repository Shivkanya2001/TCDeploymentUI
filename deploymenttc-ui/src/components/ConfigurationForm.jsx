import React, { useState } from "react";

const ConfigurationForm = () => {
  const [formData, setFormData] = useState({
    repo: "https://github.com/example/plm-deployment",
    branch: "main",
    user: "plm-admin",
    group: "plm-devops",
    pwFile: "/secrets/plm.key",
    action: "deploy",
    agentList: "",
    host: "plm-server-01",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saved config:", formData);
    // TODO: save via Redux or API
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-xs">
      <div>
        <label className="block text-gray-600 mb-1">Git Repo</label>
        <input
          type="text"
          name="repo"
          value={formData.repo}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Branch</label>
        <select
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        >
          <option value="main">main</option>
          <option value="develop">develop</option>
          <option value="release">release</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-600 mb-1">User</label>
        <input
          type="text"
          name="user"
          value={formData.user}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Group</label>
        <input
          type="text"
          name="group"
          value={formData.group}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Password File</label>
        <input
          type="text"
          name="pwFile"
          value={formData.pwFile}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Action</label>
        <select
          name="action"
          value={formData.action}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        >
          <option value="deploy">Deploy</option>
          <option value="rollback">Rollback</option>
          <option value="validate">Validate</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Agent List</label>
        <input
          type="text"
          name="agentList"
          value={formData.agentList}
          onChange={handleChange}
          placeholder="Comma separated (agent-01, agent-02)"
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-gray-600 mb-1">Host</label>
        <input
          type="text"
          name="host"
          value={formData.host}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Save Config
        </button>
      </div>
    </form>
  );
};

export default ConfigurationForm;
