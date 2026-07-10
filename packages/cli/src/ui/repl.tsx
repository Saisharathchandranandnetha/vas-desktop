import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { Config, SystemPlugin } from '../types.js';

interface REPLProps {
  config: Config;
  plugins: SystemPlugin[];
}

export function InteractiveREPL({ config, plugins }: REPLProps) {
  const { exit } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Agent: Hello! I am the VAS Desktop Core Agent.',
    'System: Ready to accept commands or reasoning prompts.'
  ]);
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'SANDBOX_EXEC'>('IDLE');
  const [logs, setLogs] = useState<string[]>([
    'System initialized.',
    'Config loaded successfully.',
    `Plugins scanned: ${plugins.length} found.`
  ]);

  // Handle Input
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (key.ctrl && input === 'l') {
      setHistory([]);
      return;
    }

    if (key.return) {
      if (!inputVal.trim()) return;

      const userText = inputVal;
      setHistory(prev => [...prev, `User ❯ ${userText}`]);
      setInputVal('');
      setStatus('THINKING');
      setLogs(prev => [...prev.slice(-4), `Running command: ${userText}`]);

      // Check if command matches any registered plugin command
      let matchedCmd = false;
      for (const plugin of plugins) {
        for (const cmd of plugin.commands) {
          if (cmd.name === userText.trim()) {
            matchedCmd = true;
            setStatus('SANDBOX_EXEC');
            setLogs(prev => [...prev.slice(-4), `Entering sandbox mode for ${cmd.name}`]);
            
            setTimeout(() => {
              setHistory(prev => [...prev, `System: Executed command [${cmd.name}] successfully.`]);
              setLogs(prev => [...prev.slice(-4), `Exited sandbox cleanly.`]);
              setStatus('IDLE');
            }, 1000);
            break;
          }
        }
      }

      if (!matchedCmd) {
        // Fallback simulated agent response
        setTimeout(() => {
          setHistory(prev => [
            ...prev, 
            `Agent: I received your query "${userText}". I am currently running in Phase 0 scaffolding mode. Try running one of the plugin commands listed on the right panel.`
          ]);
          setStatus('IDLE');
        }, 1200);
      }
      return;
    }

    if (key.backspace) {
      setInputVal(prev => prev.slice(0, -1));
      return;
    }

    // Capture standard input
    if (input && input.length === 1 && !key.meta && !key.ctrl) {
      setInputVal(prev => prev + input);
    }
  });

  return (
    <Box flexDirection="column" width={80} borderStyle="double" borderColor="cyan" padding={1}>
      {/* Title Bar */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="black" backgroundColor="cyan" bold> VAS DESKTOP CLI v0.1.0 </Text>
        <Text color="yellow" bold>[STATUS: {status}]</Text>
      </Box>

      {/* Main Panels Layout (Split Screen) */}
      <Box flexDirection="row" height={12}>
        {/* Left Panel: Chat History */}
        <Box 
          flexDirection="column" 
          width={50} 
          borderStyle="round" 
          borderColor="blue" 
          padding={1}
          marginRight={1}
        >
          <Box marginBottom={1}>
            <Text color="blue" bold underline>CONVERSATION LOG</Text>
          </Box>
          <Box flexDirection="column">
            {history.slice(-5).map((line, index) => {
              const isUser = line.startsWith('User ❯');
              const isSystem = line.startsWith('System:');
              let color = 'white';
              if (isUser) color = 'yellow';
              if (isSystem) color = 'magenta';
              return (
                <Text key={index} color={color}>
                  {line}
                </Text>
              );
            })}
          </Box>
        </Box>

        {/* Right Panel: Metadata & System Logs */}
        <Box 
          flexDirection="column" 
          width={28} 
          borderStyle="round" 
          borderColor="magenta" 
          padding={1}
        >
          <Text color="magenta" bold underline>🔌 PLUGINS LOADED</Text>
          {plugins.length === 0 ? (
            <Text color="dim">None</Text>
          ) : (
            plugins.map(p => (
              <Text key={p.name} color="green">
                • {p.name} (v{p.version})
              </Text>
            ))
          )}

          <Box marginTop={1} flexDirection="column">
            <Text color="magenta" bold underline>📋 TELEMETRY LOGS</Text>
            {logs.slice(-3).map((log, index) => (
              <Text key={index} color="dim" wrap="truncate-end">
                › {log}
              </Text>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Interactive Input Area */}
      <Box borderStyle="single" borderColor="green" paddingLeft={1} marginTop={1} flexDirection="column">
        <Box>
          <Text color="green" bold>Query ❯ </Text>
          <Text color="white">{inputVal}</Text>
          <Text color="white" inverse={true}> </Text>
        </Box>
      </Box>

      {/* Footer Info */}
      <Box justifyContent="space-between" marginTop={1}>
        <Text color="dim">[Enter] Submit Prompt</Text>
        <Text color="dim">[Ctrl+L] Clear Screen</Text>
        <Text color="dim">[Ctrl+C] Exit CLI</Text>
      </Box>
    </Box>
  );
}

export function startREPL(config: Config, plugins: SystemPlugin[]) {
  render(<InteractiveREPL config={config} plugins={plugins} />);
}
