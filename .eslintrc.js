module.exports = {
  extends: [
    "airbnb-base",
    "plugin:security/recommended",
    "plugin:jest/recommended",
  ],
  plugins: [
    "jest",
    "security"
  ],
  "rules": {
    "linebreak-style":[0,"error", "windows"]
  }
};