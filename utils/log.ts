import chalk from "chalk";

const log = {
  info: (...args: unknown[]) => console.log(chalk.green(...args)),
  warning: (...args: unknown[]) => console.log(chalk.yellow(...args)),
  error: (...args: unknown[]) => console.log(chalk.red(...args)),
  debug: (...args: unknown[]) => console.log(chalk.blue(...args)),
};

export default log;
