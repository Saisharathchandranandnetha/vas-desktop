export default {
  name: "test-plugin",
  version: "1.0.0",
  commands: [
    {
      name: "hello",
      description: "A test command that prints hello world",
      execute: async (args, config) => {
        console.log("Hello World from the test plugin!");
        console.log("Args:", args);
      }
    }
  ]
};
