export const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  return "";
};