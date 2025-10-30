import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";

class User extends Model {
  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  toSafeJSON() {
    const user = this.toJSON();
    delete user.password;
    return user;
  }
}

const defineUser = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [6, 255],
        },
      },
      role: {
        type: DataTypes.ENUM("user", "admin", "moderator"),
        allowNull: false,
        defaultValue: "user",
        validate: {
          isIn: [["user", "admin", "moderator"]],
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: /^[\+]?[1-9][\d]{0,15}$/,
        },
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: true,
          isBefore: new Date().toISOString().split("T")[0],
        },
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
      hooks: {
        beforeSave: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
      indexes: [
        { unique: true, fields: ["email"] },
        { fields: ["role"] },
        { fields: ["is_active"] },
        { fields: ["created_at"] },
      ],
    }
  );

  return User;
};

export default defineUser;
