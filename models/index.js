import defineUser from "./User.js";
import definePrompt from "./Prompts.js";

import { sequelize } from "../config/database.js";

const User = defineUser(sequelize);
const Prompt = definePrompt(sequelize);

// other model imports...

const models = { User, Prompt };

// associations, etc.

models.sequelize = sequelize;
models.Sequelize = sequelize.Sequelize;

export default models;
export { User, Prompt, sequelize };
