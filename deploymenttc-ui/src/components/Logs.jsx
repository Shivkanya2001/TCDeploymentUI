export default function LogsViewer({ logs }) {
  return (
    <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-48 overflow-y-auto">
      {/* If there are no logs, display a message */}
      {logs.length === 0 ? (
        <p className="text-gray-400">No logs yet...</p>
      ) : (
        logs.map((line, i) => (
          <div key={i} className="truncate">
            {line}
          </div> // Use truncate for long lines
        ))
      )}
    </div>
  );
}
