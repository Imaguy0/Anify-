import { exec } from "child_process";
import colors from "colors";

const frontendConfig = {
  name: "anify-frontend",
  script: "cd ../anify-frontend && bun start",
  autorestart: true,
  watch: false,
  max_memory_restart: "1G"
};

const backendConfig = {
  name: "anify-backend",
  script: "cd ../anify-backend && bun start",
  autorestart: true,
  watch: false,
  max_memory_restart: "1G"
};

const authenticationConfig = {
  name: "anify-auth",
  script: "cd ../anify-auth && bun start",
  autorestart: true,
  watch: false,
  max_memory_restart: "1G"
};

const configs = [frontendConfig, backendConfig, authenticationConfig];

async function readEnv(processName) {
  const env = Bun.file(`../${processName}/.env`);
  if (await env.exists()) {
    const data = await env.text();

    // Return as JSON like { "key": "value" }
    const result = {};
    data.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      result[key] = value;
    });

    return JSON.stringify(result);
  } else return undefined;
}

async function start() {
  /*
  const backendEnv = await readEnv(Process.BACKEND);
  if (backendEnv) Object.assign(backendConfig, { env: backendEnv });

  const frontendEnv = await readEnv(Process.FRONTEND);
  if (frontendEnv) Object.assign(frontendConfig, { env: frontendEnv });

  const authEnv = await readEnv(Process.AUTH);
  if (authEnv) Object.assign(authenticationConfig, { env: authEnv });
  */

  await Promise.all(configs.map((config) => new Promise((resolve, reject) => {
    exec(config.script, (error) => {
      if (error) reject(error);
      else resolve(true);
    });
  })));

  console.log(colors.green("Started services!"));
}

export async function remove(process) {
  return new Promise((resolve, reject) => {
    exec(`killall -9 ${process}`, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
}

export async function stop(process) {
  return new Promise((resolve, reject) => {
    exec(`killall ${process}`, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
}

start();

process.on("beforeExit", async () => {
  console.log(colors.red("Stopping services..."));
  await Promise.all([remove(Process.FRONTEND), remove(Process.BACKEND), remove(Process.AUTH)]).catch((err) => {
    console.error(colors.red("Error: "), err);
  });
});

process.on("unhandledRejection", (err) => {
  console.error(colors.red("Unhandled Promise rejection: "), err);
});

process.on("SIGINT", async () => {
  console.log(colors.red("Stopping services..."));
  await Promise.all([remove(Process.FRONTEND), remove(Process.BACKEND), remove(Process.AUTH)]).catch((err) => {
    console.error(colors.red("Error: "), err);
  });
  process.exit();
});

export const Process = {
  FRONTEND: "anify-frontend",
  BACKEND: "anify-backend",
  AUTH: "anify-auth",
};
