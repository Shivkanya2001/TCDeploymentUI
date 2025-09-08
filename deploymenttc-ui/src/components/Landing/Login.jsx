import React from "react";
import { useMsal } from "@azure/msal-react";
import { msalConfig } from "../authConfig";

const Login = () => {
  const { instance } = useMsal();

  const login = () => {
    instance
      .loginPopup(msalConfig)
      .then((response) => {
        console.log(response);
        // Handle successful login
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Welcome to Azure Login
        </h1>
        <button
          onClick={login}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Login with Azure
        </button>
      </div>
    </div>
  );
};

export default Login;
