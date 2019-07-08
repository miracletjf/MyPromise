// promise 的状态
const PENDING = Symbol("pending");
const FULFILLED = Symbol("fulfilled");
const REJECTED = Symbol("rejected");

// 判断是否为函数
const isFunction = fn => {
  return fn && typeof fn === "function";
};

// 自定义的 promise 方法
class MyPromise {
  constructor(excutor) {
    // 如果参数不为函数的话，抛出错误
    if (!isFunction(excutor)) {
      throw new Error("MyPromise must accept a function as a parameter!");
    }
    // 初始化 promise 状态
    this._status = PENDING;
    this._value = "";
    this._reason = null;
    // 状态改变时，执行 then 函数中定义的回调
    // 因为 then 可以多次调用，所以使用数组来接收
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    try {
      excutor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  _resolve(value) {
    const run = value => {
      if (this._status !== PENDING) return;

      let runFulfilled = val => {
        this.onFulfilledCallbacks.forEach(cb => {
          cb(val);
        });
      };

      let runRejected = error => {
        this.onRejectedCallbacks.forEach(cb => {
          cb(error);
        });
      };

      if (value instanceof MyPromise) {
        value.then(
          val => {
            this._status = FULFILLED;
            this._value = val;
            runFulfilled(val);
          },
          err => {
            this._status = REJECTED;
            this._reason = err;
            runRejected(err);
          }
        );
      } else {
        // 调用 resolve 的时候，改变状态
        // 执行 then 中定义的回调函数
        // 并且把值赋值给回调中
        this._status = FULFILLED;
        this._value = value;
        runFulfilled(value);
      }
    };

    // 把resolve方法放到异步队列中
    // 等到then方法调用后，把回调放入待执行的队列中去
    // 然后再统一调用定义好的 回调
    setTimeout(() => {
      run(value);
    }, 0);
  }

  _reject(reason) {
    const run = () => {
      if (this._status !== PENDING) return;
      this._status = REJECTED;
      this._reason = reason;
      this.onRejectedCallbacks.forEach(cb => {
        cb(reason);
      });
    };

    setTimeout(run, 0);
  }

  // 静态 resolve
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }
  // 静态 reject
  static reject(value) {
    return new MyPromise((resolve, reject) => reject(value));
  }
  // 静态 all 方法
  static all(list) {
    return new MyPromise((resolve, reject) => {
      let count = 0;
      let values = [];
      for (let [i, mypromise] of list.entries()) {
        this.resolve(mypromise).then(
          res => {
            values[i] = res;
            count++;
            if (count === list.length) resolve(values);
          },
          err => {
            reject(err);
          }
        );
      }
    });
  }
  // 静态 race 方法
  static race(list) {
    return new MyPromise((resolve, reject) => {
      for (let mypromise of list) {
        this.resolve(mypromise).then(
          res => {
            resolve(res);
          },
          err => {
            reject(err);
          }
        );
      }
    });
  }
}

// promise.then
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  let { _status, _value, _reason } = this;
  // 支持链式调用，返回一个 新的 MyPromise 实例
  return new MyPromise((resolve, reject) => {
    // 成功状态的 回调函数
    let fulfilled = value => {
      try {
        // 如果 then 的第一个参数不是函数
        // 把状态传递下去,value值也传递下去
        if (!isFunction(onFulfilled)) {
          resolve(value);
        } else {
          // 执行成功状态的回调
          let res = onFulfilled(value);
          if (res instanceof MyPromise) {
            // 若返回值是 promise 类型，需要等待 promise 状态变化后 再执行接下来的操作
            res.then(resolve, reject);
          } else {
            // 否则直接执行接下来的操作
            resolve(res);
          }
        }
      } catch (err) {
        // 捕捉错误，交给reject
        reject(err);
      }
    };
    // 失败状态的 回调函数
    let rejected = error => {
      try {
        // 判断 then 的第二个参数不是函数
        // 把状态传递下去，reason 也传递下去
        if (!isFunction(onRejected)) {
          reject(error);
        } else {
          // 执行错误状态的回调
          let res = onRejected(error);
          if (res instanceof MyPromise) {
            // 若返回值类型是 promise，需要等待 promise 状态变化后 再执行接下来的操作
            res.then(resolve, reject);
          } else {
            // 否则直接进行接下来的操作
            resolve(res);
          }
        }
      } catch (err) {
        // 捕捉错误，交给reject
        reject(err);
      }
    };

    switch (_status) {
      case PENDING:
        this.onFulfilledCallbacks.push(fulfilled);
        this.onRejectedCallbacks.push(rejected);
        break;
      case FULFILLED:
        fulfilled(_value);
        break;
      case REJECTED:
        rejected(_reason);
        break;
      default:
        console.log("default");
        break;
    }
  });
};
// promise.catch
MyPromise.prototype.catch = onRejected => this.then(undefined, onRejected);
// promise.then
MyPromise.prototype.finally = cb => {
  return this.then(
    value => MyPromise.resolve(cb()).then(() => value),
    reason =>
      MyPromise.resolve(cb()).then(() => {
        throw reason;
      })
  );
};

export default MyPromise;
