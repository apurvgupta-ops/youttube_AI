import { DataTypes, Model } from "sequelize";
import BaseModel from "./BaseModel.js";
import bcrypt from "bcrypt";

class User extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Define associations here
    // User.hasMany(models.Post, { foreignKey: 'user_id' });
  }

  /**
   * Check if password matches
   */
  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  /**
   * Get user without password
   */
  toSafeJSON() {
    const user = this.toJSON();
    delete user.password;
    return user;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.role === "admin";
  }

  /**
   * Check if user is active
   */
  isActive() {
    return this.is_active && !this.is_deleted;
  }
}

// Define User model attributes and options
export const UserModelDefinition = {
  attributes: BaseModel.addCommonFields({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: "Name must be between 2 and 100 characters",
        },
        notEmpty: {
          msg: "Name cannot be empty",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: "users_email_unique",
        msg: "Email address already exists",
      },
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "Password must be at least 8 characters",
        },
        // is: {
        //   args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        //   msg: "Password must contain at least one uppercase letter, lowercase letter, number, and special character",
        // },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "moderator"),
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: {
          args: [["user", "admin", "moderator"]],
          msg: "Role must be one of: user, admin, moderator",
        },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[1-9][\d]{0,15}$/,
          msg: "Phone number must be a valid format",
        },
      },
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: "Date of birth must be a valid date",
        },
        isBefore: {
          args: new Date().toISOString().split("T")[0],
          msg: "Date of birth cannot be in the future",
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Avatar URL must be a valid URL",
        },
      },
    },
  }),
  options: {
    tableName: "users",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
      where: {
        is_deleted: false,
      },
      attributes: {
        exclude: ["password"],
      },
    },
    scopes: {
      withPassword: {
        attributes: {
          include: ["password"],
        },
      },
      active: {
        where: {
          is_active: true,
          is_deleted: false,
        },
      },
      inactive: {
        where: {
          is_active: false,
        },
      },
      notDeleted: {
        where: {
          is_deleted: false,
        },
      },
      deleted: {
        where: {
          is_deleted: true,
        },
      },
      byRole: (role) => ({
        where: {
          role: role,
        },
      }),
    },
    hooks: {
      beforeSave: async (user) => {
        // Hash password if it's new or changed
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: (user) => {
        user.updated_at = new Date();
      },
      afterCreate: (user) => {
        // Remove password from the returned object
        delete user.dataValues.password;
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        fields: ["role"],
      },
      {
        fields: ["is_active"],
      },
      {
        fields: ["created_at"],
      },
    ],
  },
};

export default User;
