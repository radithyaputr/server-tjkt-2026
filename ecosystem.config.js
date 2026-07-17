module.exports = {
  apps: [{
    name: 'server-tjkt-2026',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,
  }]
};
