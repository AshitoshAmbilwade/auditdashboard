using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace AuditBackend.Services
{
    public class ScriptExecutionService
    {
        private readonly string _scriptsPath;

        public ScriptExecutionService()
        {
            _scriptsPath = Path.Combine(Directory.GetCurrentDirectory(), "Scripts");
        }

        public async Task<string> RunPowerShellScriptAsync(string scriptName)
        {
            var scriptPath = Path.Combine(_scriptsPath, scriptName);

            if (!File.Exists(scriptPath))
            {
                throw new FileNotFoundException("PowerShell script not found.", scriptPath);
            }

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-ExecutionPolicy Bypass -File \"{scriptPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            process.WaitForExit();

            if (process.ExitCode != 0 || !string.IsNullOrEmpty(error))
            {
                throw new InvalidOperationException($"Error executing PowerShell script '{scriptName}'. Exit Code: {process.ExitCode}. Error: {error}");
            }

            return output;
        }

        public async Task<string> RunBashScriptAsync(string scriptName)
        {
            var scriptPath = Path.Combine(_scriptsPath, scriptName);

            if (!File.Exists(scriptPath))
            {
                throw new FileNotFoundException("Bash script not found.", scriptPath);
            }

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "bash",
                Arguments = $"\"{scriptPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            process.WaitForExit();

            if (process.ExitCode != 0 || !string.IsNullOrEmpty(error))
            {
                throw new InvalidOperationException($"Error executing Bash script '{scriptName}'. Exit Code: {process.ExitCode}. Error: {error}");
            }

            return output;
        }
    }
}
