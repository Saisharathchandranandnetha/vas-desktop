import React, { useState } from 'react';
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
    'Welcome! Type a command or ask a question.',
    'Loaded plugins: ' + (plugins.length > 0 ? plugins.map(p => p.name).join(', ') : 'none')
  ]);
  const [status, setStatus] = useState<'auto' | 'thinking' | 'sandbox'>('auto');

  // Input Handling
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (key.return) {
      if (!inputVal.trim()) return;

      const userText = inputVal;
      setHistory(prev => [...prev, `> ${userText}`]);
      setInputVal('');
      setStatus('thinking');

      // Check if command matches any registered plugin command
      let matchedCmd = false;
      for (const plugin of plugins) {
        for (const cmd of plugin.commands) {
          if (cmd.name === userText.trim()) {
            matchedCmd = true;
            setStatus('sandbox');
            
            setTimeout(() => {
              setHistory(prev => [...prev, `System: Executed command [${cmd.name}] successfully.`]);
              setStatus('auto');
            }, 800);
            break;
          }
        }
      }

      if (!matchedCmd) {
        setTimeout(() => {
          setHistory(prev => [
            ...prev, 
            `Agent: I heard you say "${userText}". Try running one of the registered commands.`
          ]);
          setStatus('auto');
        }, 1000);
      }
      return;
    }

    if (key.backspace) {
      setInputVal(prev => prev.slice(0, -1));
      return;
    }

    // Capture standard printable characters
    if (input && input.length === 1 && !key.meta && !key.ctrl) {
      setInputVal(prev => prev + input);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} width={80}>
      {/* Sleek, Branded ASCII Art Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" marginRight={2}>
          <Text color="cyan" bold> __      __   _    _____  </Text>
          <Text color="cyan" bold> \ \    / /  / \  / ____| </Text>
          <Text color="cyan" bold>  \ \  / /  / _ \ \___ \  </Text>
          <Text color="cyan" bold>   \ \/ /  / ___ \____) | </Text>
          <Text color="cyan" bold>    \__/  /_/   \_\_____/  </Text>
        </Box>
        <Box flexDirection="column" justifyContent="center">
          <Text bold color="white">VAS Desktop CLI v0.1.0</Text>
          <Text color="dim">active workspace: C:\Users\gunde\Documents\Vas_Projects</Text>
          <Text color="dim">plugins: {plugins.map(p => `${p.name}@${p.version}`).join(', ')}</Text>
        </Box>
      </Box>

      {/* Thin line separator */}
      <Text color="dim">────────────────────────────────────────────────────────────────────────</Text>

      {/* Main Conversation Stream (Borderless and clean) */}
      <Box flexDirection="column" marginY={1} minHeight={6}>
        {history.map((line, index) => {
          if (line.startsWith('>')) {
            return (
              <Text key={index} color="yellow">
                {line}
              </Text>
            );
          }
          if (line.startsWith('Agent:')) {
            return (
              <Text key={index} color="green">
                {line}
              </Text>
            );
          }
          if (line.startsWith('System:')) {
            return (
              <Text key={index} color="magenta">
                {line}
              </Text>
            );
          }
          return (
            <Text key={index} color="white">
              {line}
            </Text>
          );
        })}
        {status === 'thinking' && (
          <Text color="magenta" italic>Agent is thinking...</Text>
        )}
      </Box>

      {/* Clean Bottom Prompt & Divider */}
      <Text color="dim">────────────────────────────────────────────────────────────────────────</Text>
      
      <Box marginY={1}>
        <Text color="cyan" bold>❯ </Text>
        <Text color="white">{inputVal}</Text>
        <Text color="white" inverse> </Text>
      </Box>

      {/* Sleek, Dark Status Bar */}
      <Box backgroundColor="gray" paddingX={1} justifyContent="space-between">
        <Box>
          <Text color="black" bold>{status}</Text>
          <Text color="black"> | gunde</Text>
        </Box>
        <Text color="black" bold>Gemini 3.5 Flash (High)</Text>
      </Box>
    </Box>
  );
}

export function startREPL(config: Config, plugins: SystemPlugin[]) {
  render(<InteractiveREPL config={config} plugins={plugins} />);
}
