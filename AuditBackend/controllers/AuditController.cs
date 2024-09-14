using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditBackend.Services; // Ensure this namespace is included
using System.IO;

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly ScriptExecutionService _scriptExecutionService;

    // Constructor injection for ScriptExecutionService
    public AuditController(ScriptExecutionService scriptExecutionService)
    {
        _scriptExecutionService = scriptExecutionService;
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunAudit([FromBody] AuditRequest request)
    {
        if (request == null)
        {
            return BadRequest("Request body cannot be null");
        }

        var results = new List<AuditResult>();

        // Determine the script to run based on OS and version
        string scriptName = GetScriptName(request.Os, request.Version);
        if (scriptName == null)
        {
            return BadRequest("Unsupported OS or version");
        }

        // Check if script exists
        string scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "Scripts", scriptName);
        if (!System.IO.File.Exists(scriptPath))
        {
            return BadRequest("Script file not found");
        }

        // Execute scripts based on selected checks
        try
        {
            // Initialize output variable
            var output = string.Empty;

            // Run the PowerShell or Bash script based on the selected checks
            if (request.Scripts.PasswordComplexity)
            {
                output = await _scriptExecutionService.RunPowerShellScriptAsync(scriptPath);
                results.Add(new AuditResult { Benchmark = "Password Complexity", Status = ParseResult(output, "Password Complexity") });
            }

            if (request.Scripts.SshSecurity)
            {
                output = await _scriptExecutionService.RunBashScriptAsync(scriptPath);
                results.Add(new AuditResult { Benchmark = "SSH Security", Status = ParseResult(output, "SSH Security") });
            }

            if (request.Scripts.Firewall)
            {
                output = await _scriptExecutionService.RunPowerShellScriptAsync(scriptPath);
                results.Add(new AuditResult { Benchmark = "Firewall Settings", Status = ParseResult(output, "Firewall Settings") });
            }
        }
        catch (Exception ex)
        {
            // Log the detailed exception message
            // For real scenarios, use a logging framework like Serilog or NLog
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }

        return Ok(new { Results = results });
    }

    private string? GetScriptName(string os, string version)
    {
        // Define script mapping based on OS and version
        if (os == "Windows" && version == "11 Enterprise")
        {
            return "audit.ps1";
        }
        else if (os == "Ubuntu" || os == "RHEL")
        {
            return "audit.sh";
        }
        return null;
    }

    private string ParseResult(string output, string benchmark)
    {
        // Implement your result parsing logic here
        // For now, returning "Pass" or "Fail" based on output content
        if (output.Contains($"{benchmark}: Pass"))
        {
            return "Pass";
        }
        if (output.Contains($"{benchmark}: Fail"))
        {
            return "Fail";
        }
        return "Unknown";
    }
}

// Model classes for request and response
public class AuditRequest
{
    public string Os { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public AuditScripts Scripts { get; set; } = new AuditScripts();
}

public class AuditScripts
{
    public bool PasswordComplexity { get; set; }
    public bool SshSecurity { get; set; }
    public bool Firewall { get; set; }
}

public class AuditResult
{
    public string Benchmark { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
