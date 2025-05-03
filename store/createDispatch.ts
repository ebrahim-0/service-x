import { CreateDispatch } from "zustore";

export const createDispatch = CreateDispatch(({ name, payload, tools }) => {
  const { dispatch, addState } = tools;

  // Action functions
  const setAge = () => {
    const age = payload.value;
    dispatch({ age }, "info"); // Example of using addState
  };

  const lang = () => {
    const { lang } = payload;
    addState({ lang }, "info2"); // Example of using addState
  };

  // Switch based on the function name
  switch (name) {
    case "setAge":
      return setAge();
    case "lang":
      return lang();
    default:
      console.log("No matching action for:", name);
      break;
  }
});
