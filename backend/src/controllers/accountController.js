export const accountController = (req, res) => {
  res.status(200).send("Welcome to the account controller!");
};

export const signin = (req, res) => {
  // signin logic will go here
  res.status(200).send({ message: "User signed in successfully!" });
};

export const signup = (req, res) => {
  // signup logic will go here
  res.status(201).send({ message: "User signed up successfully!" });
};
