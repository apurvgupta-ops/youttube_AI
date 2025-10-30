import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * Base model class with common fields and methods
 */
class BaseModel {
  /**
   * Add common timestamp fields to a model definition
   */
  static addTimestamps(attributes = {}) {
    return {
      ...attributes,
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
    };
  }

  /**
   * Add soft delete fields to a model definition
   */
  static addSoftDelete(attributes = {}) {
    return {
      ...attributes,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    };
  }

  /**
   * Add both timestamps and soft delete fields
   */
  static addCommonFields(attributes = {}) {
    return this.addSoftDelete(this.addTimestamps(attributes));
  }

  /**
   * Standard model options with common hooks
   */
  static getModelOptions(tableName, additionalOptions = {}) {
    return {
      sequelize,
      modelName: tableName,
      tableName: tableName,
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeUpdate: (instance) => {
          instance.updated_at = new Date();
        },
        beforeDestroy: (instance) => {
          if (instance.is_deleted !== undefined) {
            instance.is_deleted = true;
            instance.deleted_at = new Date();
          }
        },
      },
      scopes: {
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
      },
      ...additionalOptions,
    };
  }

  /**
   * Common validation rules
   */
  static getValidationRules() {
    return {
      email: {
        isEmail: {
          msg: "Must be a valid email address",
        },
      },
      phone: {
        is: {
          args: /^[\+]?[1-9][\d]{0,15}$/,
          msg: "Phone number must be a valid format",
        },
      },
      url: {
        isUrl: {
          msg: "Must be a valid URL",
        },
      },
      notEmpty: {
        notEmpty: {
          msg: "This field cannot be empty",
        },
      },
      strongPassword: {
        is: {
          args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          msg: "Password must contain at least one uppercase letter, lowercase letter, number, and special character",
        },
        len: {
          args: [8, 100],
          msg: "Password must be between 8 and 100 characters",
        },
      },
    };
  }
}

export default BaseModel;
