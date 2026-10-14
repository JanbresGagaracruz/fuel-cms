module.exports = {
  apps: [
    {
      name: "nextjs",
      cwd: "C:\\Apache24\\htdocs\\fuel-cms",
      script: "cmd.exe",
      args: "/c npm start",
      interpreter: "none",

      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

