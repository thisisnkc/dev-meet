export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Worker initialization disabled - now runs as standalone service
    // See worker/ directory and WORKER_README.md for details
  }
}
