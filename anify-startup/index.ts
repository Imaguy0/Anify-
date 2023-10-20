import { exec } from "child_process";
import colors from "colors";
import pify from "pify";

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
const pExec = pify(exec);

async function readEnv(processName) {
  const env = Bun.file(`../${processName}/.env`);
  if (await env.exists()) {
    const data = await env.text();
    const result = {};
    data.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      result[key] = value;
    });
    return JSON.stringify(result);
  } else return undefined;
}

async function start(showLogs) {
  await Promise.all(
    configs.map((config) =>
      new Promise((resolve, reject) => {
        const process = exec(config.script);
        if (showLogs) {
          process.stdout.on("data", (data) => {
            console.log(colors.yellow(`[${config.name}] Output:`));
            console.log(data);
          });

          process.stderr.on("data", (data) => {
            console.error(colors.red(`[${config.name}] Error:`));
            console.error(data);
          });
        }
        process.on("close", (code) => {
          resolve(code);
        });
        process.on("error", (error) => {
          reject(error);
        });
      })
    )
  );

  console.log(colors.green("Started services!"));
}

export const remove = pify((process) => exec(`killall -9 ${process}`));

export const stop = (process) => {
  return new Promise((resolve, reject) => {
    exec(`pgrep -f ${process}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      const pids = stdout.split("\n").filter((pid) => pid !== "");
      pids.forEach((pid) => {
        exec(`kill -9 ${pid}`, (err, result) => {
          if (err) {
            reject(err);
          }
        });
      });
      resolve(true);
    });
  });
};

start(true); // Start the services with logs enabled

process.on("beforeExit", async () => {
  console.log(colors.red("Stopping services..."));
  await Promise.all([
    stop(frontendConfig.name),
    stop(backendConfig.name),
    stop(authenticationConfig.name)
  ]).catch((err) => {
    console.error(colors.red("Error: "), err);
  });
});

process.on("unhandledRejection", (err) => {
  console.error(colors.red("Unhandled Promise rejection: "), err);
});

process.on("SIGINT", async () => {
  console.log(colors.red("Stopping services..."));
  await Promise.all([
    stop(frontendConfig.name),
    stop(backendConfig.name),
    stop(authenticationConfig.name)
  ]).catch((err) => {
    console.error(colors.red("Error: "), err);
  });

  process.exit();
});

export const Process = {
  FRONTEND: "anify-frontend",
  BACKEND: "anify-backend",
  AUTH: "anify-auth",
};
