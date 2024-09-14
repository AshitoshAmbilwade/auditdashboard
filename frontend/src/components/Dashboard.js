import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse'; // Import PapaParse for CSV generation
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation

function Dashboard() {
  const [os, setOs] = useState('Ubuntu');
  const [version, setVersion] = useState('20.04 LTS');
  const [scripts, setScripts] = useState({
    passwordComplexity: false,
    sshSecurity: false,
    firewall: false,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false); // State for showing download options

  const handleRunAudit = async () => {
    setLoading(true);
    setError(null);

    const auditRequest = {
      os,
      version,
      scripts,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/audit/run', auditRequest);
      setResults(response.data.results); // Update the results state with audit results
    } catch (err) {
      setError('Error running audit: ' + err.message); // Set error message
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (format) => {
    setShowDownloadOptions(false); // Hide download options after selection
    if (format === 'csv') {
      // Generate CSV
      const csv = Papa.unparse(results);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_report.csv');
      link.click();
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF();
      doc.text('Audit Report', 10, 10);
      results.forEach((result, index) => {
        doc.text(`${result.benchmark}: ${result.status}`, 10, 20 + index * 10);
      });
      doc.save('audit_report.pdf');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Audit Dashboard</h1>

      {/* OS and Version Selector */}
      <div className="mb-6 w-full">
        <label className="block text-gray-700 font-semibold mb-2">Select OS:</label>
        <select
          value={os}
          onChange={(e) => setOs(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Ubuntu">Ubuntu</option>
          <option value="RHEL">RHEL</option>
          <option value="Windows">Windows</option>
        </select>

        <label className="block text-gray-700 font-semibold mt-4 mb-2">Select Version:</label>
        <select
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="20.04 LTS">20.04 LTS</option>
          <option value="22.04 LTS">22.04 LTS</option>
          <option value="8">RHEL 8</option>
          <option value="9">RHEL 9</option>
          <option value="11 Enterprise">Windows 11 Enterprise</option>
        </select>
      </div>

      {/* Script Selection */}
      <div className="mb-6 w-full">
        <label className="block text-gray-700 font-semibold mb-2">Select Scripts to Run:</label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={scripts.passwordComplexity}
              onChange={() =>
                setScripts((prev) => ({
                  ...prev,
                  passwordComplexity: !prev.passwordComplexity,
                }))
              }
              className="mr-2"
            />
            <span>Password Complexity</span>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={scripts.sshSecurity}
              onChange={() =>
                setScripts((prev) => ({
                  ...prev,
                  sshSecurity: !prev.sshSecurity,
                }))
              }
              className="mr-2"
            />
            <span>SSH Security</span>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={scripts.firewall}
              onChange={() =>
                setScripts((prev) => ({
                  ...prev,
                  firewall: !prev.firewall,
                }))
              }
              className="mr-2"
            />
            <span>Firewall Settings</span>
          </div>
        </div>
      </div>

      {/* Run Audit Button */}
      <button
        onClick={handleRunAudit}
        disabled={loading}
        className={`px-4 py-2 font-semibold text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Running Audit...' : 'Run Audit'}
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* Report Section */}
      <div className="mt-6 w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Audit Results</h2>
        {results.length > 0 ? (
          <div className="w-full">
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li
                  key={index}
                  className={`flex items-center p-2 rounded-md ${
                    result.status === 'Pass'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  <span className="flex-1">{result.benchmark}</span>
                  <span>{result.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">No results to display.</p>
        )}
      </div>

      {/* Download Report Button with Options */}
      <div className="relative mt-4">
        <button
          onClick={() => setShowDownloadOptions(!showDownloadOptions)}
          disabled={results.length === 0} // Disable button when there are no results
          className={`px-4 py-2 font-semibold text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            results.length === 0 ? 'cursor-not-allowed' : ''
          }`}
        >
          Download Report
        </button>

        {showDownloadOptions && results.length > 0 && (
          <div className="absolute mt-2 w-40 bg-white border rounded-lg shadow-lg">
            <button
              onClick={() => handleDownloadReport('csv')}
              className="block w-full px-4 py-2 text-left hover:bg-gray-200"
            >
              CSV
            </button>
            <button
              onClick={() => handleDownloadReport('pdf')}
              className="block w-full px-4 py-2 text-left hover:bg-gray-200"
            >
              PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
