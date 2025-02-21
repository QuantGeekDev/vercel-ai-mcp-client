'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

interface StoredServer {
  id: string;
  url: string;
  name: string;
  connected: boolean;
}

interface ToolCall {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: any;
}

interface ToolResult {
  type: 'tool-result';
  toolCallId: string;
  content: any;
}

interface MessageContent {
  type: string;
  text?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

const ChatPage = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({});
  
  const [serverUrl, setServerUrl] = useState("");
  const [serverStatus, setServerStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const [connectedServers, setConnectedServers] = useState<StoredServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverTools, setServerTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolArgs, setToolArgs] = useState<string>("");
  const [toolResult, setToolResult] = useState<any>(null);

  useEffect(() => {
    const loadStoredServers = async () => {
      const storedServers = localStorage.getItem('connectedServers');
      if (storedServers) {
        const servers: StoredServer[] = JSON.parse(storedServers);
        
        const reconnectedServers = await Promise.all(
          servers.map(async (server) => {
            try {
              const response = await fetch("/api/mcp/server", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: server.url }),
              });
              const data = await response.json();
              if (data.success) {
                return data.server;
              }
              return null;
            } catch (error) {
              console.error(`Failed to reconnect to server ${server.url}:`, error);
              return null;
            }
          })
        );

        const successfulReconnections = reconnectedServers.filter((server): server is StoredServer => server !== null);
        setConnectedServers(successfulReconnections);
        
        localStorage.setItem('connectedServers', JSON.stringify(successfulReconnections));
      }
    };

    loadStoredServers();
  }, []);

  useEffect(() => {
    localStorage.setItem('connectedServers', JSON.stringify(connectedServers));
  }, [connectedServers]);

  const handleServerConnect = async () => {
    setServerStatus("connecting");
    try {
      const response = await fetch("/api/mcp/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serverUrl }),
      });
      const data = await response.json();
      if (data.success) {
        setServerStatus("connected");
        setConnectedServers((prev) => {
          const exists = prev.some(server => server.url === data.server.url);
          if (exists) return prev;
          return [...prev, data.server];
        });
        setServerUrl(""); 
      } else {
        setServerStatus("failed");
      }
    } catch (error) {
      setServerStatus("failed");
    }
  };

  const handleServerDisconnect = async (serverId: string) => {
    try {
      setConnectedServers(prev => prev.filter(server => server.id !== serverId));
      
      if (selectedServer === serverId) {
        setSelectedServer(null);
        setServerTools([]);
        setSelectedTool(null);
        setToolResult(null);
      }
    } catch (error) {
      console.error('Failed to disconnect server:', error);
    }
  };

  const handleServerSelect = async (serverId: string) => {
    setSelectedServer(serverId);
    setServerTools([]);
    setSelectedTool(null);
    setToolResult(null);

    try {
      const response = await fetch(`/api/mcp/server/${serverId}/tools`);
      const data = await response.json();
      if (data.success && data.tools) {
        setServerTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch server tools:', error);
    }
  };

  const renderMessageContent = (content: any) => {
    if (typeof content === 'string') {
      return <div>{content}</div>;
    }

    if (Array.isArray(content)) {
      return content.map((part, index) => {
        if (part.type === 'text') {
          return <div key={index}>{part.text}</div>;
        }
        if (part.type === 'tool-call') {
          return (
            <div key={index} className="tool-call" style={{ 
              background: '#f0f0f0',
              padding: '0.5rem',
              margin: '0.5rem 0',
              borderLeft: '3px solid #007bff'
            }}>
              <strong>Tool Call:</strong> {part.toolName}
              <pre style={{ 
                background: '#e0e0e0',
                padding: '0.5rem',
                borderRadius: '4px',
                marginTop: '0.25rem'
              }}>
                {JSON.stringify(part.args, null, 2)}
              </pre>
            </div>
          );
        }
        if (part.type === 'tool-result') {
          return (
            <div key={index} className="tool-result" style={{
              background: '#f5f5f5',
              padding: '0.5rem',
              margin: '0.5rem 0',
              borderLeft: '3px solid #28a745'
            }}>
              <strong>Tool Result:</strong>
              <pre style={{
                background: '#e5e5e5',
                padding: '0.5rem',
                borderRadius: '4px',
                marginTop: '0.25rem'
              }}>
                {JSON.stringify(part.content, null, 2)}
              </pre>
            </div>
          );
        }
        return null;
      });
    }

    return <div>{JSON.stringify(content)}</div>;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Chat and MCP Server Control Panel</h1>

      {/* Server Control Panel */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h2>Connect to MCP Server</h2>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="Enter server URL (e.g., https://example.com/sse)"
          style={{ width: "300px", marginRight: "1rem" }}
        />
        <button onClick={handleServerConnect}>Connect</button>
        <div style={{ marginTop: "1rem" }}>
          {serverStatus === "connecting" && <p>Connecting...</p>}
          {serverStatus === "connected" && <p style={{ color: "green" }}>Connected ✅</p>}
          {serverStatus === "failed" && <p style={{ color: "red" }}>Connection failed</p>}
        </div>
      </section>

      <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h2>Connected MCP Servers</h2>
        {connectedServers.length === 0 ? (
          <p>No servers connected yet.</p>
        ) : (
          <div>
            {connectedServers.map((server) => (
              <div 
                key={server.id} 
                style={{ 
                  padding: "0.5rem",
                  marginBottom: "0.5rem",
                  border: selectedServer === server.id ? "2px solid #007bff" : "1px solid #ccc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div 
                  style={{ cursor: "pointer", flex: 1 }}
                  onClick={() => handleServerSelect(server.id)}
                >
                  <strong>{server.name}</strong> - {server.url}
                </div>
                <button 
                  onClick={() => handleServerDisconnect(server.id)}
                  style={{ 
                    marginLeft: "1rem",
                    padding: "0.25rem 0.5rem",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Disconnect
                </button>
              </div>
            ))}

            {selectedServer && (
              <div style={{ marginTop: "1rem" }}>
                <h3>Available Tools</h3>
                {serverTools.length === 0 ? (
                  <p>No tools available</p>
                ) : (
                  <div>
                    <select 
                      value={selectedTool || ''} 
                      onChange={(e) => setSelectedTool(e.target.value)}
                      style={{ marginBottom: "1rem", width: "100%" }}
                    >
                      <option value="">Select a tool</option>
                      {serverTools.map((tool: any) => (
                        <option key={tool.name} value={tool.name}>
                          {tool.name}
                        </option>
                      ))}
                    </select>

                    {selectedTool && (
                      <div>
                        <h4>Tool Arguments (JSON)</h4>
                        <textarea
                          value={toolArgs}
                          onChange={(e) => setToolArgs(e.target.value)}
                          placeholder='{"arg1": "value1"}'
                          style={{ width: "100%", height: "100px", marginBottom: "1rem" }}
                        />
                        <button onClick={() => {}}>Execute Tool</button>

                        {toolResult && (
                          <div style={{ marginTop: "1rem" }}>
                            <h4>Result</h4>
                            <pre style={{ 
                              background: "#f5f5f5", 
                              padding: "1rem",
                              borderRadius: "4px",
                              overflow: "auto"
                            }}>
                              {JSON.stringify(toolResult, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #ccc", padding: "1rem" }}>
        <h2>Chat</h2>
        <div>
          {messages.map((message) => (
            <div key={message.id} style={{ marginBottom: "1rem" }}>
              <strong>{message.role === "user" ? "User" : "Assistant"}: </strong>
              {renderMessageContent(message.content)}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", marginTop: "1rem" }}>
          <input
            name="prompt"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter prompt..."
            style={{ flex: 1, marginRight: "1rem" }}
          />
          <button type="submit">Submit</button>
        </form>
      </section>
    </div>
  );
};

export default ChatPage;
