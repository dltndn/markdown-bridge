import { spawn } from "node:child_process";

export type CommandProbeResult = {
  available: boolean;
  output: string | null;
};

export function probeCommand(command: string, args: string[] = ["--version"]): Promise<CommandProbeResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("error", () => {
      resolve({ available: false, output: null });
    });
    child.on("close", (code) => {
      resolve({
        available: code === 0,
        output: code === 0 ? output.trim() : null
      });
    });
  });
}

