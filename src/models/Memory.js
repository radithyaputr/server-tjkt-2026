const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Memory = sequelize.define('Memory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Lainnya',
  },
  caption: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['filename'] },
    { fields: ['uploadedBy'] },
  ],
});

User.hasMany(Memory, { foreignKey: 'uploadedBy' });
Memory.belongsTo(User, { foreignKey: 'uploadedBy' });

module.exports = Memory;

