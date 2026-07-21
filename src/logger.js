// Distinct stylized console logging for KEQ extension
export const log = {
  info: (msg, ...args) => console.log('%c[KEQ]%c ' + msg, 'background: #ff0055; color: white; padding: 1px 4px; border-radius: 3px; font-weight: bold;', '', ...args),
  error: (msg, error, ...args) => {
    console.group('%c[KEQ ERROR]%c ' + msg, 'background: #ff0000; color: white; padding: 1px 4px; border-radius: 3px; font-weight: bold;', 'color: #ff0000; font-weight: bold;');
    if (error) console.error(error);
    console.groupEnd();
  }
};
