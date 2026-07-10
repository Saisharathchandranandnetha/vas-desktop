import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';

export function InteractiveREPL() {
  const { exit } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Welcome to VAS Desktop CLI!',
    'Type a message and press Enter to query the agent.',
    'Press Ctrl+C to exit.'
  ]);
  const [status, setStatus] = useState<'idle' | 'thinking'>('idle');

  // Input Handling using Ink's useInput hook
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

      // Simulate a quick agent response
      setTimeout(() => {
        setHistory(prev => [
          ...prev, 
          `Agent: I heard you say "${userText}". Processing request in Phase 0 sandbox... Done!`
        ]);
        setStatus('idle');
      }, 800);
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
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1} width={60}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="green" bold>🤖 VAS DESKTOP CLI (v0.1.0) 🤖</Text>
      </Box>

      {/* History Area */}
      <Box flexDirection="column" minHeight={8} marginBottom={1}>
        {history.map((line, index) => {
          const isUser = line.startsWith('>');
          const isAgent = line.startsWith('Agent:');
          let color = 'white';
          if (isUser) color = 'yellow';
          if (isAgent) color = 'green';
          return (
            <Text key={index} color={color}>
              {line}
            </Text>
          );
        })}
        {status === 'thinking' && (
          <Text color="magenta" italic>Agent is thinking...</Text>
        )}
      </Box>

      {/* Input Prompt */}
      <Box borderStyle="round" borderColor="dim" paddingLeft={1}>
        <Text color="blue" bold>Query: </Text>
        <Text color="white">{inputVal}</Text>
        <Text color="white" inverse={true}> </Text>
      </Box>
    </Box>
  );
}

export function startREPL() {
  render(<InteractiveREPL />);
}
