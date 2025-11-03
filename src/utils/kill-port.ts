import { execSync } from 'node:child_process';

export function killPort(port: number): void {
  const isWindows = process.platform === 'win32';

  const collectPids = (): number[] => {
    try {
      if (isWindows) {
        const output = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' }).toString();
        const pids = new Set<number>();
        output
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const match = line.match(/(\d+)\s*$/);
            if (match) {
              pids.add(Number(match[1]));
            }
          });
        return Array.from(pids);
      }

      const output = execSync(`lsof -ti tcp:${port}`, { stdio: 'pipe' }).toString();
      return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((pid) => Number(pid));
    } catch (error) {
      if ((error as { status?: number }).status === 1) {
        return [];
      }
      throw error;
    }
  };

  const pids = collectPids();

  if (pids.length === 0) {
    return;
  }

  if (isWindows) {
    pids.forEach((pid) => {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    });
  } else {
    pids.forEach((pid) => {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        execSync(`kill -9 ${pid}`);
      }
    });
  }
}
