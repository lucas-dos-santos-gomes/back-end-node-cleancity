const stringToByteArray$1 = function (str) {
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
          out[p++] = c;
      }
      else if (c < 2048) {
          out[p++] = (c >> 6) | 192;
          out[p++] = (c & 63) | 128;
      }
      else if ((c & 0xfc00) === 0xd800 &&
          i + 1 < str.length &&
          (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
          c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
          out[p++] = (c >> 18) | 240;
          out[p++] = ((c >> 12) & 63) | 128;
          out[p++] = ((c >> 6) & 63) | 128;
          out[p++] = (c & 63) | 128;
      }
      else {
          out[p++] = (c >> 12) | 224;
          out[p++] = ((c >> 6) & 63) | 128;
          out[p++] = (c & 63) | 128;
      }
  }
  return out;
};
const byteArrayToString = function (bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
      const c1 = bytes[pos++];
      if (c1 < 128) {
          out[c++] = String.fromCharCode(c1);
      }
      else if (c1 > 191 && c1 < 224) {
          const c2 = bytes[pos++];
          out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      }
      else if (c1 > 239 && c1 < 365) {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          const c4 = bytes[pos++];
          const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
              0x10000;
          out[c++] = String.fromCharCode(0xd800 + (u >> 10));
          out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
      }
      else {
          const c2 = bytes[pos++];
          const c3 = bytes[pos++];
          out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
  }
  return out.join('');
};
const base64 = {
  byteToCharMap_: null,
  charToByteMap_: null,
  byteToCharMapWebSafe_: null,
  charToByteMapWebSafe_: null,
  ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
  get ENCODED_VALS() {
      return this.ENCODED_VALS_BASE + '+/=';
  },
  get ENCODED_VALS_WEBSAFE() {
      return this.ENCODED_VALS_BASE + '-_.';
  },
  HAS_NATIVE_SUPPORT: typeof atob === 'function',
  encodeByteArray(input, webSafe) {
      if (!Array.isArray(input)) {
          throw Error('encodeByteArray takes an array as a parameter');
      }
      this.init_();
      const byteToCharMap = webSafe
          ? this.byteToCharMapWebSafe_
          : this.byteToCharMap_;
      const output = [];
      for (let i = 0; i < input.length; i += 3) {
          const byte1 = input[i];
          const haveByte2 = i + 1 < input.length;
          const byte2 = haveByte2 ? input[i + 1] : 0;
          const haveByte3 = i + 2 < input.length;
          const byte3 = haveByte3 ? input[i + 2] : 0;
          const outByte1 = byte1 >> 2;
          const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
          let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
          let outByte4 = byte3 & 0x3f;
          if (!haveByte3) {
              outByte4 = 64;
              if (!haveByte2) {
                  outByte3 = 64;
              }
          }
          output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
      }
      return output.join('');
  },
  encodeString(input, webSafe) {
      if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return btoa(input);
      }
      return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  decodeString(input, webSafe) {
      if (this.HAS_NATIVE_SUPPORT && !webSafe) {
          return atob(input);
      }
      return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  decodeStringToByteArray(input, webSafe) {
      this.init_();
      const charToByteMap = webSafe
          ? this.charToByteMapWebSafe_
          : this.charToByteMap_;
      const output = [];
      for (let i = 0; i < input.length;) {
          const byte1 = charToByteMap[input.charAt(i++)];
          const haveByte2 = i < input.length;
          const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
          ++i;
          const haveByte3 = i < input.length;
          const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          const haveByte4 = i < input.length;
          const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
          ++i;
          if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
              throw new DecodeBase64StringError();
          }
          const outByte1 = (byte1 << 2) | (byte2 >> 4);
          output.push(outByte1);
          if (byte3 !== 64) {
              const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
              output.push(outByte2);
              if (byte4 !== 64) {
                  const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
                  output.push(outByte3);
              }
          }
      }
      return output;
  },
  init_() {
      if (!this.byteToCharMap_) {
          this.byteToCharMap_ = {};
          this.charToByteMap_ = {};
          this.byteToCharMapWebSafe_ = {};
          this.charToByteMapWebSafe_ = {};
          // We want quick mappings back and forth, so we precompute two maps.
          for (let i = 0; i < this.ENCODED_VALS.length; i++) {
              this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
              this.charToByteMap_[this.byteToCharMap_[i]] = i;
              this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
              this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
              // Be forgiving when decoding and correctly decode both encodings.
              if (i >= this.ENCODED_VALS_BASE.length) {
                  this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                  this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
              }
          }
      }
  }
};
class DecodeBase64StringError extends Error {
  constructor() {
      super(...arguments);
      this.name = 'DecodeBase64StringError';
  }
}
const base64Encode = function (str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
const base64urlEncodeWithoutPadding = function (str) {
  return base64Encode(str).replace(/\./g, '');
};
const base64Decode = function (str) {
  try {
      return base64.decodeString(str, true);
  }
  catch (e) {
      console.error('base64Decode failed: ', e);
  }
  return null;
};

function getGlobal() {
  if (typeof self !== 'undefined') {
      return self;
  }
  if (typeof window !== 'undefined') {
      return window;
  }
  if (typeof global !== 'undefined') {
      return global;
  }
  throw new Error('Unable to locate global object.');
}

const getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
const getDefaultsFromEnvVariable = () => {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
      return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
      return JSON.parse(defaultsJsonString);
  }
};
const getDefaultsFromCookie = () => {
  if (typeof document === 'undefined') {
      return;
  }
  let match;
  try {
      match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  }
  catch (e) {
      return;
  }
  const decoded = match && base64Decode(match[1]);
  return decoded && JSON.parse(decoded);
};

const getDefaults = () => {
  try {
      return (getDefaultsFromGlobal() ||
          getDefaultsFromEnvVariable() ||
          getDefaultsFromCookie());
  }
  catch (e) {
      console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
      return;
  }
};
const getDefaultAppConfig = () => { var _a; return (_a = getDefaults()) === null || _a === void 0 ? void 0 : _a.config; };

class Deferred {
  constructor() {
      this.reject = () => { };
      this.resolve = () => { };
      this.promise = new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
      });
  }
  
  wrapCallback(callback) {
      return (error, value) => {
          if (error) {
              this.reject(error);
          }
          else {
              this.resolve(value);
          }
          if (typeof callback === 'function') {
              this.promise.catch(() => { });
              if (callback.length === 1) {
                  callback(error);
              }
              else {
                  callback(error, value);
              }
          }
      };
  }
}
function isBrowser() {
  return typeof window !== 'undefined' || isWebWorker();
}
function isWebWorker() {
  return (typeof WorkerGlobalScope !== 'undefined' &&
      typeof self !== 'undefined' &&
      self instanceof WorkerGlobalScope);
}
function isIndexedDBAvailable() {
  try {
      return typeof indexedDB === 'object';
  }
  catch (e) {
      return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
      try {
          let preExist = true;
          const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
          const request = self.indexedDB.open(DB_CHECK_NAME);
          request.onsuccess = () => {
              request.result.close();
              if (!preExist) {
                  self.indexedDB.deleteDatabase(DB_CHECK_NAME);
              }
              resolve(true);
          };
          request.onupgradeneeded = () => {
              preExist = false;
          };
          request.onerror = () => {
              var _a;
              reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || '');
          };
      }
      catch (error) {
          reject(error);
      }
  });
}

const ERROR_NAME = 'FirebaseError';
class FirebaseError extends Error {
  constructor(
  code, message, 
  customData) {
      super(message);
      this.code = code;
      this.customData = customData;
      this.name = ERROR_NAME;
      Object.setPrototypeOf(this, FirebaseError.prototype);
      if (Error.captureStackTrace) {
          Error.captureStackTrace(this, ErrorFactory.prototype.create);
      }
  }
}
class ErrorFactory {
  constructor(service, serviceName, errors) {
      this.service = service;
      this.serviceName = serviceName;
      this.errors = errors;
  }
  create(code, ...data) {
      const customData = data[0] || {};
      const fullCode = `${this.service}/${code}`;
      const template = this.errors[code];
      const message = template ? replaceTemplate(template, customData) : 'Error';
      // Service Name: Error message (service/code).
      const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
      const error = new FirebaseError(fullCode, fullMessage, customData);
      return error;
  }
}
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
      const value = data[key];
      return value != null ? String(value) : `<${key}?>`;
  });
}
const PATTERN = /\{\$([^}]+)}/g;

function deepEqual(a, b) {
  if (a === b) {
      return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
      if (!bKeys.includes(k)) {
          return false;
      }
      const aProp = a[k];
      const bProp = b[k];
      if (isObject(aProp) && isObject(bProp)) {
          if (!deepEqual(aProp, bProp)) {
              return false;
          }
      }
      else if (aProp !== bProp) {
          return false;
      }
  }
  for (const k of bKeys) {
      if (!aKeys.includes(k)) {
          return false;
      }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === 'object';
}

class Component {

  constructor(name, instanceFactory, type) {
      this.name = name;
      this.instanceFactory = instanceFactory;
      this.type = type;
      this.multipleInstances = false;

      this.serviceProps = {};
      this.instantiationMode = "LAZY";
      this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
      this.instantiationMode = mode;
      return this;
  }
  setMultipleInstances(multipleInstances) {
      this.multipleInstances = multipleInstances;
      return this;
  }
  setServiceProps(props) {
      this.serviceProps = props;
      return this;
  }
  setInstanceCreatedCallback(callback) {
      this.onInstanceCreated = callback;
      return this;
  }
}

const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

class Provider {
  constructor(name, container) {
      this.name = name;
      this.container = container;
      this.component = null;
      this.instances = new Map();
      this.instancesDeferred = new Map();
      this.instancesOptions = new Map();
      this.onInitCallbacks = new Map();
  }

  get(identifier) {
      const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
      if (!this.instancesDeferred.has(normalizedIdentifier)) {
          const deferred = new Deferred();
          this.instancesDeferred.set(normalizedIdentifier, deferred);
          if (this.isInitialized(normalizedIdentifier) ||
              this.shouldAutoInitialize()) {
              try {
                  const instance = this.getOrInitializeService({
                      instanceIdentifier: normalizedIdentifier
                  });
                  if (instance) {
                      deferred.resolve(instance);
                  }
              }
              catch (e) {}
          }
      }
      return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
      var _a;
      const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
      const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
      if (this.isInitialized(normalizedIdentifier) ||
          this.shouldAutoInitialize()) {
          try {
              return this.getOrInitializeService({
                  instanceIdentifier: normalizedIdentifier
              });
          }
          catch (e) {
              if (optional) {
                  return null;
              }
              else {
                  throw e;
              }
          }
      }
      else {
          if (optional) {
              return null;
          }
          else {
              throw Error(`Service ${this.name} is not available`);
          }
      }
  }
  getComponent() {
      return this.component;
  }
  setComponent(component) {
      if (component.name !== this.name) {
          throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
      }
      if (this.component) {
          throw Error(`Component for ${this.name} has already been provided`);
      }
      this.component = component;
      if (!this.shouldAutoInitialize()) {
          return;
      }
      if (isComponentEager(component)) {
          try {
              this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
          }
          catch (e) {
          }
      }
      for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          try {
              const instance = this.getOrInitializeService({
                  instanceIdentifier: normalizedIdentifier
              });
              instanceDeferred.resolve(instance);
          }
          catch (e) {
          }
      }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
      this.instancesDeferred.delete(identifier);
      this.instancesOptions.delete(identifier);
      this.instances.delete(identifier);
  }
  async delete() {
      const services = Array.from(this.instances.values());
      await Promise.all([
          ...services
              .filter(service => 'INTERNAL' in service) // legacy services
              .map(service => service.INTERNAL.delete()),
          ...services
              .filter(service => '_delete' in service) // modularized services
              .map(service => service._delete())
      ]);
  }
  isComponentSet() {
      return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
      return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
      return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
      const { options = {} } = opts;
      const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
      if (this.isInitialized(normalizedIdentifier)) {
          throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
      }
      if (!this.isComponentSet()) {
          throw Error(`Component ${this.name} has not been registered yet`);
      }
      const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier,
          options
      });
      for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
          const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
          if (normalizedIdentifier === normalizedDeferredIdentifier) {
              instanceDeferred.resolve(instance);
          }
      }
      return instance;
  }

  onInit(callback, identifier) {
      var _a;
      const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
      const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
      existingCallbacks.add(callback);
      this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
      const existingInstance = this.instances.get(normalizedIdentifier);
      if (existingInstance) {
          callback(existingInstance, normalizedIdentifier);
      }
      return () => {
          existingCallbacks.delete(callback);
      };
  }
  
  invokeOnInitCallbacks(instance, identifier) {
      const callbacks = this.onInitCallbacks.get(identifier);
      if (!callbacks) {
          return;
      }
      for (const callback of callbacks) {
          try {
              callback(instance, identifier);
          }
          catch (_a) {
          }
      }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
      let instance = this.instances.get(instanceIdentifier);
      if (!instance && this.component) {
          instance = this.component.instanceFactory(this.container, {
              instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
              options
          });
          this.instances.set(instanceIdentifier, instance);
          this.instancesOptions.set(instanceIdentifier, options);
          
          this.invokeOnInitCallbacks(instance, instanceIdentifier);
          
          if (this.component.onInstanceCreated) {
              try {
                  this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
              }
              catch (_a) {
              }
          }
      }
      return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
      if (this.component) {
          return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
      }
      else {
          return identifier;
      }
  }
  shouldAutoInitialize() {
      return (!!this.component &&
          this.component.instantiationMode !== "EXPLICIT" );
  }
}
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER" ;
}

class ComponentContainer {
  constructor(name) {
      this.name = name;
      this.providers = new Map();
  }
  
  addComponent(component) {
      const provider = this.getProvider(component.name);
      if (provider.isComponentSet()) {
          throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
      }
      provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
      const provider = this.getProvider(component.name);
      if (provider.isComponentSet()) {
          this.providers.delete(component.name);
      }
      this.addComponent(component);
  }
  
  getProvider(name) {
      if (this.providers.has(name)) {
          return this.providers.get(name);
      }
      const provider = new Provider(name, this);
      this.providers.set(name, provider);
      return provider;
  }
  getProviders() {
      return Array.from(this.providers.values());
  }
}

const instances = [];

var LogLevel;
(function (LogLevel) {
  LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
  LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
  LogLevel[LogLevel["INFO"] = 2] = "INFO";
  LogLevel[LogLevel["WARN"] = 3] = "WARN";
  LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
  LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
const levelStringToEnum = {
  'debug': LogLevel.DEBUG,
  'verbose': LogLevel.VERBOSE,
  'info': LogLevel.INFO,
  'warn': LogLevel.WARN,
  'error': LogLevel.ERROR,
  'silent': LogLevel.SILENT
};

const defaultLogLevel = LogLevel.INFO;

const ConsoleMethod = {
  [LogLevel.DEBUG]: 'log',
  [LogLevel.VERBOSE]: 'log',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error'
};

const defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
      return;
  }
  const now = new Date().toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
      console[method](`[${now}]  ${instance.name}:`, ...args);
  }
  else {
      throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
  }
};
class Logger {
  
  constructor(name) {
      this.name = name;
      
      this._logLevel = defaultLogLevel;
      this._logHandler = defaultLogHandler;
      this._userLogHandler = null;
      instances.push(this);
  }
  get logLevel() {
      return this._logLevel;
  }
  set logLevel(val) {
      if (!(val in LogLevel)) {
          throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
      }
      this._logLevel = val;
  }
  setLogLevel(val) {
      this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
  }
  get logHandler() {
      return this._logHandler;
  }
  set logHandler(val) {
      if (typeof val !== 'function') {
          throw new TypeError('Value assigned to `logHandler` must be a function');
      }
      this._logHandler = val;
  }
  get userLogHandler() {
      return this._userLogHandler;
  }
  set userLogHandler(val) {
      this._userLogHandler = val;
  }
  debug(...args) {
      this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
      this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
      this._userLogHandler &&
          this._userLogHandler(this, LogLevel.VERBOSE, ...args);
      this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
      this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
      this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
      this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
      this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
      this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
      this._logHandler(this, LogLevel.ERROR, ...args);
  }
}
function setLogLevel$1(level) {
  instances.forEach(inst => {
      inst.setLogLevel(level);
  });
}
function setUserLogHandler(logCallback, options) {
  for (const instance of instances) {
      let customLogLevel = null;
      if (options && options.level) {
          customLogLevel = levelStringToEnum[options.level];
      }
      if (logCallback === null) {
          instance.userLogHandler = null;
      }
      else {
          instance.userLogHandler = (instance, level, ...args) => {
              const message = args
                  .map(arg => {
                  if (arg == null) {
                      return null;
                  }
                  else if (typeof arg === 'string') {
                      return arg;
                  }
                  else if (typeof arg === 'number' || typeof arg === 'boolean') {
                      return arg.toString();
                  }
                  else if (arg instanceof Error) {
                      return arg.message;
                  }
                  else {
                      try {
                          return JSON.stringify(arg);
                      }
                      catch (ignored) {
                          return null;
                      }
                  }
              })
                  .filter(arg => arg)
                  .join(' ');
              if (level >= (customLogLevel !== null && customLogLevel !== void 0 ? customLogLevel : instance.logLevel)) {
                  logCallback({
                      level: LogLevel[level].toLowerCase(),
                      message,
                      args,
                      type: instance.name
                  });
              }
          };
      }
  }
}

const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return (idbProxyableTypes ||
      (idbProxyableTypes = [
          IDBDatabase,
          IDBObjectStore,
          IDBIndex,
          IDBCursor,
          IDBTransaction,
      ]));
}
function getCursorAdvanceMethods() {
  return (cursorAdvanceMethods ||
      (cursorAdvanceMethods = [
          IDBCursor.prototype.advance,
          IDBCursor.prototype.continue,
          IDBCursor.prototype.continuePrimaryKey,
      ]));
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
          request.removeEventListener('success', success);
          request.removeEventListener('error', error);
      };
      const success = () => {
          resolve(wrap(request.result));
          unlisten();
      };
      const error = () => {
          reject(request.error);
          unlisten();
      };
      request.addEventListener('success', success);
      request.addEventListener('error', error);
  });
  promise
      .then((value) => {
      if (value instanceof IDBCursor) {
          cursorRequestMap.set(value, request);
      }
  })
      .catch(() => { });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
      return;
  const done = new Promise((resolve, reject) => {
      const unlisten = () => {
          tx.removeEventListener('complete', complete);
          tx.removeEventListener('error', error);
          tx.removeEventListener('abort', error);
      };
      const complete = () => {
          resolve();
          unlisten();
      };
      const error = () => {
          reject(tx.error || new DOMException('AbortError', 'AbortError'));
          unlisten();
      };
      tx.addEventListener('complete', complete);
      tx.addEventListener('error', error);
      tx.addEventListener('abort', error);
  });
  transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
  get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
          if (prop === 'done')
              return transactionDoneMap.get(target);
          if (prop === 'objectStoreNames') {
              return target.objectStoreNames || transactionStoreNamesMap.get(target);
          }
          if (prop === 'store') {
              return receiver.objectStoreNames[1]
                  ? undefined
                  : receiver.objectStore(receiver.objectStoreNames[0]);
          }
      }
      return wrap(target[prop]);
  },
  set(target, prop, value) {
      target[prop] = value;
      return true;
  },
  has(target, prop) {
      if (target instanceof IDBTransaction &&
          (prop === 'done' || prop === 'store')) {
          return true;
      }
      return prop in target;
  },
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction &&
      !('objectStoreNames' in IDBTransaction.prototype)) {
      return function (storeNames, ...args) {
          const tx = func.call(unwrap(this), storeNames, ...args);
          transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
          return wrap(tx);
      };
  }
  if (getCursorAdvanceMethods().includes(func)) {
      return function (...args) {
          func.apply(unwrap(this), args);
          return wrap(cursorRequestMap.get(this));
      };
  }
  return function (...args) {
      return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === 'function')
      return wrapFunction(value);
  if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
      return promisifyRequest(value);
  if (transformCache.has(value))
      return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
      request.addEventListener('upgradeneeded', (event) => {
          upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
  }
  if (blocked) {
      request.addEventListener('blocked', (event) => blocked(
      event.oldVersion, event.newVersion, event));
  }
  openPromise
      .then((db) => {
      if (terminated)
          db.addEventListener('close', () => terminated());
      if (blocking) {
          db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
      }
  })
      .catch(() => { });
  return openPromise;
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase &&
      !(prop in target) &&
      typeof prop === 'string')) {
      return;
  }
  if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, '');
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
  !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
      !(isWrite || readMethods.includes(targetFuncName))) {
      return;
  }
  const method = async function (storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
      let target = tx.store;
      if (useIndex)
          target = target.index(args.shift());
      return (await Promise.all([
          target[targetFuncName](...args),
          isWrite && tx.done,
      ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

class PlatformLoggerServiceImpl {
  constructor(container) {
      this.container = container;
  }
  getPlatformInfoString() {
      const providers = this.container.getProviders();
      return providers
          .map(provider => {
          if (isVersionServiceProvider(provider)) {
              const service = provider.getImmediate();
              return `${service.library}/${service.version}`;
          }
          else {
              return null;
          }
      })
          .filter(logString => logString)
          .join(' ');
  }
}
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* ComponentType.VERSION */;
}

const name$p = "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
const version$1 = "0.10.11";

const logger = new Logger('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');

const name$o = "@firebase/app-compat";

const name$n = "@firebase/analytics-compat";

const name$m = "@firebase/analytics";

const name$l = "@firebase/app-check-compat";

const name$k = "@firebase/app-check";

const name$j = "@firebase/auth";

const name$i = "@firebase/auth-compat";

const name$h = "@firebase/database";

const name$g = "@firebase/database-compat";

const name$f = "@firebase/functions";

const name$e = "@firebase/functions-compat";

const name$d = "@firebase/installations";

const name$c = "@firebase/installations-compat";

const name$b = "@firebase/messaging";

const name$a = "@firebase/messaging-compat";

const name$9 = "@firebase/performance";

const name$8 = "@firebase/performance-compat";

const name$7 = "@firebase/remote-config";

const name$6 = "@firebase/remote-config-compat";

const name$5 = "@firebase/storage";

const name$4 = "@firebase/storage-compat";

const name$3 = "@firebase/firestore";

const name$2 = "@firebase/vertexai-preview";

const name$1 = "@firebase/firestore-compat";

const name$q = "firebase";
const version$2 = "10.13.2";

const DEFAULT_ENTRY_NAME = '[DEFAULT]';
const PLATFORM_LOG_STRING = {
  [name$p]: 'fire-core',
  [name$o]: 'fire-core-compat',
  [name$m]: 'fire-analytics',
  [name$n]: 'fire-analytics-compat',
  [name$k]: 'fire-app-check',
  [name$l]: 'fire-app-check-compat',
  [name$j]: 'fire-auth',
  [name$i]: 'fire-auth-compat',
  [name$h]: 'fire-rtdb',
  [name$g]: 'fire-rtdb-compat',
  [name$f]: 'fire-fn',
  [name$e]: 'fire-fn-compat',
  [name$d]: 'fire-iid',
  [name$c]: 'fire-iid-compat',
  [name$b]: 'fire-fcm',
  [name$a]: 'fire-fcm-compat',
  [name$9]: 'fire-perf',
  [name$8]: 'fire-perf-compat',
  [name$7]: 'fire-rc',
  [name$6]: 'fire-rc-compat',
  [name$5]: 'fire-gcs',
  [name$4]: 'fire-gcs-compat',
  [name$3]: 'fire-fst',
  [name$1]: 'fire-fst-compat',
  [name$2]: 'fire-vertex',
  'fire-js': 'fire-js',
  [name$q]: 'fire-js-all'
};

const _apps = new Map();
const _serverApps = new Map();
const _components = new Map();

function _addComponent(app, component) {
  try {
      app.container.addComponent(component);
  }
  catch (e) {
      logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
  }
}

function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
      logger.debug(`There were multiple attempts to register component ${componentName}.`);
      return false;
  }
  _components.set(componentName, component);
  // add the component to existing app instances
  for (const app of _apps.values()) {
      _addComponent(app, component);
  }
  for (const serverApp of _serverApps.values()) {
      _addComponent(serverApp, component);
  }
  return true;
}

function _getProvider(app, name) {
  const heartbeatController = app.container
      .getProvider('heartbeat')
      .getImmediate({ optional: true });
  if (heartbeatController) {
      void heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name);
}
function _removeServiceInstance(app, name, instanceIdentifier = DEFAULT_ENTRY_NAME) {
  _getProvider(app, name).clearInstance(instanceIdentifier);
}
function _isFirebaseApp(obj) {
  return obj.options !== undefined;
}
function _isFirebaseServerApp(obj) {
  return obj.settings !== undefined;
}
function _clearComponents() {
  _components.clear();
}
const ERRORS = {
  ["no-app" /* AppError.NO_APP */]: "No Firebase App '{$appName}' has been created - " +
      'call initializeApp() first',
  ["bad-app-name" /* AppError.BAD_APP_NAME */]: "Illegal App name: '{$appName}'",
  ["duplicate-app" /* AppError.DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted" /* AppError.APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
  ["server-app-deleted" /* AppError.SERVER_APP_DELETED */]: 'Firebase Server App has been deleted',
  ["no-options" /* AppError.NO_OPTIONS */]: 'Need to provide options, when not being deployed to hosting via source.',
  ["invalid-app-argument" /* AppError.INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
      'Firebase App instance.',
  ["invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.',
  ["idb-open" /* AppError.IDB_OPEN */]: 'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',
  ["idb-get" /* AppError.IDB_GET */]: 'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',
  ["idb-set" /* AppError.IDB_WRITE */]: 'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',
  ["idb-delete" /* AppError.IDB_DELETE */]: 'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.',
  ["finalization-registry-not-supported" /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */]: 'FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.',
  ["invalid-server-app-environment" /* AppError.INVALID_SERVER_APP_ENVIRONMENT */]: 'FirebaseServerApp is not for use in browser environments.'
};
const ERROR_FACTORY = new ErrorFactory('app', 'Firebase', ERRORS);

class FirebaseAppImpl {
  constructor(options, config, container) {
      this._isDeleted = false;
      this._options = Object.assign({}, options);
      this._config = Object.assign({}, config);
      this._name = config.name;
      this._automaticDataCollectionEnabled =
          config.automaticDataCollectionEnabled;
      this._container = container;
      this.container.addComponent(new Component('app', () => this, "PUBLIC" /* ComponentType.PUBLIC */));
  }
  get automaticDataCollectionEnabled() {
      this.checkDestroyed();
      return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
      this.checkDestroyed();
      this._automaticDataCollectionEnabled = val;
  }
  get name() {
      this.checkDestroyed();
      return this._name;
  }
  get options() {
      this.checkDestroyed();
      return this._options;
  }
  get config() {
      this.checkDestroyed();
      return this._config;
  }
  get container() {
      return this._container;
  }
  get isDeleted() {
      return this._isDeleted;
  }
  set isDeleted(val) {
      this._isDeleted = val;
  }
  checkDestroyed() {
      if (this.isDeleted) {
          throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
      }
  }
}

class FirebaseServerAppImpl extends FirebaseAppImpl {
  constructor(options, serverConfig, name, container) {
      const automaticDataCollectionEnabled = serverConfig.automaticDataCollectionEnabled !== undefined
          ? serverConfig.automaticDataCollectionEnabled
          : false;
      const config = {
          name,
          automaticDataCollectionEnabled
      };
      if (options.apiKey !== undefined) {
          super(options, config, container);
      }
      else {
          const appImpl = options;
          super(appImpl.options, config, container);
      }
      this._serverConfig = Object.assign({ automaticDataCollectionEnabled }, serverConfig);
      this._finalizationRegistry = null;
      if (typeof FinalizationRegistry !== 'undefined') {
          this._finalizationRegistry = new FinalizationRegistry(() => {
              this.automaticCleanup();
          });
      }
      this._refCount = 0;
      this.incRefCount(this._serverConfig.releaseOnDeref);
      this._serverConfig.releaseOnDeref = undefined;
      serverConfig.releaseOnDeref = undefined;
      registerVersion(name$p, version$1, 'serverapp');
  }
  toJSON() {
      return undefined;
  }
  get refCount() {
      return this._refCount;
  }
  incRefCount(obj) {
      if (this.isDeleted) {
          return;
      }
      this._refCount++;
      if (obj !== undefined && this._finalizationRegistry !== null) {
          this._finalizationRegistry.register(obj, this);
      }
  }
  decRefCount() {
      if (this.isDeleted) {
          return 0;
      }
      return --this._refCount;
  }
  automaticCleanup() {
      void deleteApp(this);
  }
  get settings() {
      this.checkDestroyed();
      return this._serverConfig;
  }
  checkDestroyed() {
      if (this.isDeleted) {
          throw ERROR_FACTORY.create("server-app-deleted");
      }
  }
}

const SDK_VERSION = version$2;
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== 'object') {
      const name = rawConfig;
      rawConfig = { name };
  }
  const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
  const name = config.name;
  if (typeof name !== 'string' || !name) {
      throw ERROR_FACTORY.create("bad-app-name" /* AppError.BAD_APP_NAME */, {
          appName: String(name)
      });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
      throw ERROR_FACTORY.create("no-options" /* AppError.NO_OPTIONS */);
  }
  const existingApp = _apps.get(name);
  if (existingApp) {
      if (deepEqual(options, existingApp.options) &&
          deepEqual(config, existingApp.config)) {
          return existingApp;
      }
      else {
          throw ERROR_FACTORY.create("duplicate-app" /* AppError.DUPLICATE_APP */, { appName: name });
      }
  }
  const container = new ComponentContainer(name);
  for (const component of _components.values()) {
      container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name, newApp);
  return newApp;
}
function initializeServerApp(_options, _serverAppConfig) {
  if (isBrowser() && !isWebWorker()) {
      throw ERROR_FACTORY.create("invalid-server-app-environment" /* AppError.INVALID_SERVER_APP_ENVIRONMENT */);
  }
  if (_serverAppConfig.automaticDataCollectionEnabled === undefined) {
      _serverAppConfig.automaticDataCollectionEnabled = false;
  }
  let appOptions;
  if (_isFirebaseApp(_options)) {
      appOptions = _options.options;
  }
  else {
      appOptions = _options;
  }
  const nameObj = Object.assign(Object.assign({}, _serverAppConfig), appOptions);
  if (nameObj.releaseOnDeref !== undefined) {
      delete nameObj.releaseOnDeref;
  }
  const hashCode = (s) => {
      return [...s].reduce((hash, c) => (Math.imul(31, hash) + c.charCodeAt(0)) | 0, 0);
  };
  if (_serverAppConfig.releaseOnDeref !== undefined) {
      if (typeof FinalizationRegistry === 'undefined') {
          throw ERROR_FACTORY.create("finalization-registry-not-supported" /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */, {});
      }
  }
  const nameString = '' + hashCode(JSON.stringify(nameObj));
  const existingApp = _serverApps.get(nameString);
  if (existingApp) {
      existingApp.incRefCount(_serverAppConfig.releaseOnDeref);
      return existingApp;
  }
  const container = new ComponentContainer(nameString);
  for (const component of _components.values()) {
      container.addComponent(component);
  }
  const newApp = new FirebaseServerAppImpl(appOptions, _serverAppConfig, nameString, container);
  _serverApps.set(nameString, newApp);
  return newApp;
}
function getApp(name = DEFAULT_ENTRY_NAME) {
  const app = _apps.get(name);
  if (!app && name === DEFAULT_ENTRY_NAME && getDefaultAppConfig()) {
      return initializeApp();
  }
  if (!app) {
      throw ERROR_FACTORY.create("no-app" /* AppError.NO_APP */, { appName: name });
  }
  return app;
}
function getApps() {
  return Array.from(_apps.values());
}
async function deleteApp(app) {
  let cleanupProviders = false;
  const name = app.name;
  if (_apps.has(name)) {
      cleanupProviders = true;
      _apps.delete(name);
  }
  else if (_serverApps.has(name)) {
      const firebaseServerApp = app;
      if (firebaseServerApp.decRefCount() <= 0) {
          _serverApps.delete(name);
          cleanupProviders = true;
      }
  }
  if (cleanupProviders) {
      await Promise.all(app.container
          .getProviders()
          .map(provider => provider.delete()));
      app.isDeleted = true;
  }
}
function registerVersion(libraryKeyOrName, version, variant) {
  var _a;
  let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
  if (variant) {
      library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
      const warning = [
          `Unable to register library "${library}" with version "${version}":`
      ];
      if (libraryMismatch) {
          warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
      }
      if (libraryMismatch && versionMismatch) {
          warning.push('and');
      }
      if (versionMismatch) {
          warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
      }
      logger.warn(warning.join(' '));
      return;
  }
  _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* ComponentType.VERSION */));
}

function onLog(logCallback, options) {
  if (logCallback !== null && typeof logCallback !== 'function') {
      throw ERROR_FACTORY.create("invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */);
  }
  setUserLogHandler(logCallback, options);
}

function setLogLevel(logLevel) {
  setLogLevel$1(logLevel);
}

const DB_NAME = 'firebase-heartbeat-database';
const DB_VERSION = 1;
const STORE_NAME = 'firebase-heartbeat-store';
let dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
          upgrade: (db, oldVersion) => {
              switch (oldVersion) {
                  case 0:
                      try {
                          db.createObjectStore(STORE_NAME);
                      }
                      catch (e) {
                          console.warn(e);
                      }
              }
          }
      }).catch(e => {
          throw ERROR_FACTORY.create("idb-open" /* AppError.IDB_OPEN */, {
              originalErrorMessage: e.message
          });
      });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app) {
  try {
      const db = await getDbPromise();
      const tx = db.transaction(STORE_NAME);
      const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
      await tx.done;
      return result;
  }
  catch (e) {
      if (e instanceof FirebaseError) {
          logger.warn(e.message);
      }
      else {
          const idbGetError = ERROR_FACTORY.create("idb-get" /* AppError.IDB_GET */, {
              originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
          });
          logger.warn(idbGetError.message);
      }
  }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  try {
      const db = await getDbPromise();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = tx.objectStore(STORE_NAME);
      await objectStore.put(heartbeatObject, computeKey(app));
      await tx.done;
  }
  catch (e) {
      if (e instanceof FirebaseError) {
          logger.warn(e.message);
      }
      else {
          const idbGetError = ERROR_FACTORY.create("idb-set" /* AppError.IDB_WRITE */, {
              originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
          });
          logger.warn(idbGetError.message);
      }
  }
}
function computeKey(app) {
  return `${app.name}!${app.options.appId}`;
}

const MAX_HEADER_BYTES = 1024;
// 30 days
const STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;
class HeartbeatServiceImpl {
  constructor(container) {
      this.container = container;

      this._heartbeatsCache = null;
      const app = this.container.getProvider('app').getImmediate();
      this._storage = new HeartbeatStorageImpl(app);
      this._heartbeatsCachePromise = this._storage.read().then(result => {
          this._heartbeatsCache = result;
          return result;
      });
  }
  async triggerHeartbeat() {
      var _a, _b;
      try {
          const platformLogger = this.container
              .getProvider('platform-logger')
              .getImmediate();
          const agent = platformLogger.getPlatformInfoString();
          const date = getUTCDateString();
          if (((_a = this._heartbeatsCache) === null || _a === void 0 ? void 0 : _a.heartbeats) == null) {
              this._heartbeatsCache = await this._heartbeatsCachePromise;
              if (((_b = this._heartbeatsCache) === null || _b === void 0 ? void 0 : _b.heartbeats) == null) {
                  return;
              }
          }
          if (this._heartbeatsCache.lastSentHeartbeatDate === date ||
              this._heartbeatsCache.heartbeats.some(singleDateHeartbeat => singleDateHeartbeat.date === date)) {
              return;
          }
          else {
              this._heartbeatsCache.heartbeats.push({ date, agent });
          }
          this._heartbeatsCache.heartbeats =
              this._heartbeatsCache.heartbeats.filter(singleDateHeartbeat => {
                  const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
                  const now = Date.now();
                  return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
              });
          return this._storage.overwrite(this._heartbeatsCache);
      }
      catch (e) {
          logger.warn(e);
      }
  }
  
  async getHeartbeatsHeader() {
      var _a;
      try {
          if (this._heartbeatsCache === null) {
              await this._heartbeatsCachePromise;
          }
          if (((_a = this._heartbeatsCache) === null || _a === void 0 ? void 0 : _a.heartbeats) == null ||
              this._heartbeatsCache.heartbeats.length === 0) {
              return '';
          }
          const date = getUTCDateString();
          const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
          const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
          this._heartbeatsCache.lastSentHeartbeatDate = date;
          if (unsentEntries.length > 0) {
              this._heartbeatsCache.heartbeats = unsentEntries;
              await this._storage.overwrite(this._heartbeatsCache);
          }
          else {
              this._heartbeatsCache.heartbeats = [];
              void this._storage.overwrite(this._heartbeatsCache);
          }
          return headerString;
      }
      catch (e) {
          logger.warn(e);
          return '';
      }
  }
}
function getUTCDateString() {
  const today = new Date();
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
      const heartbeatEntry = heartbeatsToSend.find(hb => hb.agent === singleDateHeartbeat.agent);
      if (!heartbeatEntry) {
          heartbeatsToSend.push({
              agent: singleDateHeartbeat.agent,
              dates: [singleDateHeartbeat.date]
          });
          if (countBytes(heartbeatsToSend) > maxSize) {
              heartbeatsToSend.pop();
              break;
          }
      }
      else {
          heartbeatEntry.dates.push(singleDateHeartbeat.date);
          if (countBytes(heartbeatsToSend) > maxSize) {
              heartbeatEntry.dates.pop();
              break;
          }
      }
      unsentEntries = unsentEntries.slice(1);
  }
  return {
      heartbeatsToSend,
      unsentEntries
  };
}
class HeartbeatStorageImpl {
  constructor(app) {
      this.app = app;
      this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
      if (!isIndexedDBAvailable()) {
          return false;
      }
      else {
          return validateIndexedDBOpenable()
              .then(() => true)
              .catch(() => false);
      }
  }
  
  async read() {
      const canUseIndexedDB = await this._canUseIndexedDBPromise;
      if (!canUseIndexedDB) {
          return { heartbeats: [] };
      }
      else {
          const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
          if (idbHeartbeatObject === null || idbHeartbeatObject === void 0 ? void 0 : idbHeartbeatObject.heartbeats) {
              return idbHeartbeatObject;
          }
          else {
              return { heartbeats: [] };
          }
      }
  }
  async overwrite(heartbeatsObject) {
      var _a;
      const canUseIndexedDB = await this._canUseIndexedDBPromise;
      if (!canUseIndexedDB) {
          return;
      }
      else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
              lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
              heartbeats: heartbeatsObject.heartbeats
          });
      }
  }
  async add(heartbeatsObject) {
      var _a;
      const canUseIndexedDB = await this._canUseIndexedDBPromise;
      if (!canUseIndexedDB) {
          return;
      }
      else {
          const existingHeartbeatsObject = await this.read();
          return writeHeartbeatsToIndexedDB(this.app, {
              lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
              heartbeats: [
                  ...existingHeartbeatsObject.heartbeats,
                  ...heartbeatsObject.heartbeats
              ]
          });
      }
  }
}

function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
  JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
}

function registerCoreComponents(variant) {
  _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" ));
  _registerComponent(new Component('heartbeat', container => new HeartbeatServiceImpl(container), "PRIVATE" ));
  registerVersion(name$p, version$1, variant);
  registerVersion(name$p, version$1, 'esm2017');
  registerVersion('fire-js', '');
}

registerCoreComponents('');

var name = "firebase";
var version = "10.13.2";

registerVersion(name, version, 'cdn');

export { FirebaseError, SDK_VERSION, DEFAULT_ENTRY_NAME as _DEFAULT_ENTRY_NAME, _addComponent, _addOrOverwriteComponent, _apps, _clearComponents, _components, _getProvider, _isFirebaseApp, _isFirebaseServerApp, _registerComponent, _removeServiceInstance, _serverApps, deleteApp, getApp, getApps, initializeApp, initializeServerApp, onLog, registerVersion, setLogLevel };
