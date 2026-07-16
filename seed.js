const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection OK.');
    await sequelize.sync();
    console.log('Tables synced.');

    const existingAdmin = await User.findOne({ where: { role: 'Admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('TJKTsmea2026', 12);
    await User.create({
      username: 'admintjkt2026',
      password: hashedPassword,
      role: 'Admin'
    });

    console.log('');
    console.log('==========================================');
    console.log('  Admin user created successfully!');
    console.log('  Username: admintjkt2026');
    console.log('  Password: TJKTsmea2026');
    console.log('  IMPORTANT: Change this password');
    console.log('  immediately after first login!');
    console.log('==========================================');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('ERROR: Could not seed admin.');
    console.error('');
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('  Make sure MySQL/MariaDB is running and');
      console.error('  the database credentials in .env are correct.');
      console.error('');
      console.error('  Then create the database:');
      console.error('    mysql -u root -p -e "CREATE DATABASE server_tjkt;"');
      console.error('');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('  Database access denied. Check DB_USER and DB_PASSWORD in .env');
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

seedAdmin();
